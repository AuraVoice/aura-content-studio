import { z } from "zod";
import { generateStructured } from "@/lib/ai/gemini";
import {
  AURA_DESKTOP_FACTS,
  AURA_DESKTOP_GUARDRAILS,
  BRAND_VOICE
} from "@/lib/product";
import type { LockedAttributes, PromptPackage, TrendIdea } from "@/lib/types";

const shotSchema = z.object({
  startSecond: z.number().min(0),
  endSecond: z.number().positive(),
  visual: z.string(),
  dialogue: z.string(),
  camera: z.string(),
  overlay: z.string().optional()
});

const promptSchema = z.object({
  finalConcept: z.string(),
  hook: z.string(),
  spokenScript: z.string(),
  shots: z.array(shotSchema).min(1),
  higgsfieldPrompt: z.string(),
  negativeConstraints: z.array(z.string()).min(4),
  durationSeconds: z.number().int().min(5).max(60),
  recommendedModel: z.string(),
  failurePoints: z.array(z.string()).min(2),
  lockedAttributes: z.object({
    actor: z.string(),
    clothing: z.string(),
    environment: z.string(),
    lighting: z.string(),
    durationSeconds: z.number().int(),
    spokenScript: z.string(),
    productClaims: z.array(z.string())
  }).catchall(z.union([z.string(), z.number(), z.array(z.string())])),
  validation: z.object({
    estimatedSpokenSeconds: z.number(),
    dialogueFits: z.boolean(),
    cameraExplicit: z.boolean(),
    contradictions: z.array(z.string()),
    repeatedHook: z.boolean()
  })
});

const WORDS_PER_SECOND = 2.35;

export function estimateSpeech(script: string): number {
  return Math.ceil(script.trim().split(/\s+/).filter(Boolean).length / WORDS_PER_SECOND);
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function applyLocks(
  draft: z.infer<typeof promptSchema>,
  previous: PromptPackage | undefined,
  changeRequest: string | undefined
): z.infer<typeof promptSchema> {
  if (!previous || !changeRequest) return draft;
  const request = normalized(changeRequest);
  const onlyMatch = request.match(/change only (?:the )?(.+)/);
  if (!onlyMatch) {
    const lockedAttributes = { ...draft.lockedAttributes };
    const sameAttributeAliases: Array<[string, keyof LockedAttributes]> = [
      ["actor", "actor"],
      ["outfit", "clothing"],
      ["clothing", "clothing"],
      ["environment", "environment"],
      ["room", "environment"],
      ["lighting", "lighting"],
      ["script", "spokenScript"],
      ["duration", "durationSeconds"]
    ];
    for (const [phrase, key] of sameAttributeAliases) {
      if (request.includes(`same ${phrase}`)) {
        lockedAttributes[key] = previous.lockedAttributes[key];
      }
    }
    return {
      ...draft,
      spokenScript: request.includes("same script")
        ? previous.spokenScript
        : draft.spokenScript,
      durationSeconds: request.includes("same duration")
        ? previous.durationSeconds
        : draft.durationSeconds,
      lockedAttributes
    };
  }
  const allowed = onlyMatch[1];
  const locks = previous.lockedAttributes;
  const preserve = (key: keyof LockedAttributes) => !allowed.includes(normalized(String(key)));
  const lockedAttributes = { ...draft.lockedAttributes };
  for (const [key, value] of Object.entries(locks)) {
    if (preserve(key)) lockedAttributes[key] = value;
  }
  const cameraOnly = allowed.includes("camera") || allowed.includes("angle");
  const shots = cameraOnly
    ? previous.shots.map((shot, index) => ({
        ...shot,
        camera: draft.shots[index]?.camera ?? shot.camera
      }))
    : draft.shots;
  return {
    ...draft,
    finalConcept: allowed.includes("concept") ? draft.finalConcept : previous.finalConcept,
    hook: allowed.includes("hook") ? draft.hook : previous.hook,
    spokenScript:
      allowed.includes("script") || allowed.includes("dialogue")
        ? draft.spokenScript
        : previous.spokenScript,
    durationSeconds: allowed.includes("duration")
      ? draft.durationSeconds
      : previous.durationSeconds,
    shots,
    negativeConstraints: cameraOnly
      ? previous.negativeConstraints
      : draft.negativeConstraints,
    recommendedModel: cameraOnly ? previous.recommendedModel : draft.recommendedModel,
    failurePoints: cameraOnly ? previous.failurePoints : draft.failurePoints,
    lockedAttributes
  };
}

export async function runPromptDirector(input: {
  idea: TrendIdea;
  instruction?: string;
  previous?: PromptPackage;
  recentHooks?: string[];
  requiredRevision?: string[];
}): Promise<PromptPackage> {
  const nextVersion = (input.previous?.version ?? 0) + 1;
  const draft = await generateStructured(
    promptSchema,
    `You are Prompt Director for Aura Desktop marketing. Produce a complete, executable direction package.

Selected idea:
${JSON.stringify(input.idea, null, 2)}

Owner instruction:
${input.instruction || "Create the strongest honest execution."}

Required surgical fixes:
${input.requiredRevision?.join("\n") || "None"}

Previous package:
${input.previous ? JSON.stringify(input.previous, null, 2) : "None"}

Recent hooks that must not be repeated:
${input.recentHooks?.join("\n") || "None"}

Aura Desktop facts:
${AURA_DESKTOP_FACTS.map((fact) => `- ${fact}`).join("\n")}

Hard guardrails:
${AURA_DESKTOP_GUARDRAILS.map((rule) => `- ${rule}`).join("\n")}

Voice:
${BRAND_VOICE.map((rule) => `- ${rule}`).join("\n")}

Requirements:
- Dialogue must fit naturally in the duration at about 2.35 words per second.
- Every shot needs explicit lens or field of view, camera height, framing, movement, and subject position.
- Keep actor, clothing, environment, lighting, and product representation consistent.
- A Higgsfield prompt must never fabricate detailed Aura interface text. Use a compositing-safe blank or abstract overlay when needed.
- Speaking should sound conversational and energetic, not slow or scripted.
- Record every invariant in lockedAttributes.
- If the instruction requests one change, change only that attribute and copy everything else from the previous package.
- recommendedModel should describe the Higgsfield capability needed, since model availability varies by subscription.
- Show only a Windows desktop environment and product experience.`,
    { temperature: 0.35 }
  );

  const locked = applyLocks(draft, input.previous, input.instruction);
  const estimated = estimateSpeech(locked.spokenScript);
  const repeated = (input.recentHooks ?? []).some(
    (hook) => normalized(hook) === normalized(locked.hook)
  );
  const shotsValid =
    locked.shots[0]?.startSecond === 0 &&
    Math.abs((locked.shots.at(-1)?.endSecond ?? 0) - locked.durationSeconds) < 0.25 &&
    locked.shots.every(
      (shot, index) =>
        shot.startSecond < shot.endSecond &&
        (index === 0 || Math.abs(shot.startSecond - locked.shots[index - 1].endSecond) < 0.25)
    );
  if (!shotsValid) throw new Error("Prompt Director returned a discontinuous shot plan");
  if (estimated > locked.durationSeconds) {
    throw new Error(
      `Prompt Director dialogue needs about ${estimated}s but duration is ${locked.durationSeconds}s`
    );
  }
  if (locked.validation.contradictions.length) {
    throw new Error(`Prompt contradictions: ${locked.validation.contradictions.join(", ")}`);
  }
  if (repeated) {
    throw new Error("Prompt Director repeated a recent hook");
  }
  return {
    ...locked,
    version: nextVersion,
    validation: {
      ...locked.validation,
      estimatedSpokenSeconds: estimated,
      dialogueFits: estimated <= locked.durationSeconds,
      repeatedHook: repeated
    }
  };
}
