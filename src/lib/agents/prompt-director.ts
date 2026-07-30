import { z } from "zod";
import { generateStructured } from "@/lib/ai/gemini";
import {
  AURA_DESKTOP_FACTS,
  AURA_DESKTOP_GUARDRAILS,
  BRAND_VOICE
} from "@/lib/product";
import type { PromptPackage, TrendIdea } from "@/lib/types";

const shotSchema = z.object({
  startSecond: z.number().min(0),
  endSecond: z.number().positive(),
  visual: z.string(),
  dialogue: z.string(),
  camera: z.string(),
  overlay: z.string().optional()
});

const clipSchema = z.object({
  clipNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  purpose: z.string(),
  durationSeconds: z.number().int().min(10).max(12),
  spokenScript: z.string(),
  estimatedSpokenSeconds: z.number(),
  wordCount: z.number().int(),
  higgsfieldPrompt: z.string(),
  continuityIn: z.string(),
  continuityOut: z.string(),
  shots: z.array(shotSchema).min(1)
});

const promptSchema = z.object({
  finalConcept: z.string(),
  hook: z.string(),
  spokenScript: z.string(),
  clips: z.array(clipSchema).length(3),
  higgsfieldPrompt: z.string(),
  negativeConstraints: z.array(z.string()).min(4),
  durationSeconds: z.number().int().min(30).max(36),
  recommendedModel: z.string(),
  failurePoints: z.array(z.string()).min(2),
  lockedAttributes: z.object({
    clipCount: z.literal(3)
  }),
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

function isRateLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown };
  return (
    candidate.status === 429 ||
    candidate.code === 429 ||
    candidate.code === "429" ||
    (typeof candidate.message === "string" &&
      /\b(429|resource exhausted|rate limit|quota exceeded)\b/i.test(candidate.message))
  );
}

export function fallbackPromptPackage(input: {
  idea: TrendIdea;
  previous?: PromptPackage;
}): PromptPackage {
  const version = (input.previous?.version ?? 0) + 1;
  if (input.previous) return { ...input.previous, version };

  const creator =
    "adult white blonde woman in her late twenties, glamorous and confident, wearing a fitted sleeveless navy top";
  const scripts = [
    "I stopped opening another tab every time I needed help on my Windows PC.",
    "I press one shortcut, ask Aura out loud, and keep my work visible.",
    "It feels less like switching apps and more like having a useful companion nearby."
  ];
  const purposes = ["Hook with the familiar problem", "Demonstrate the Aura workflow", "Land the companion-first payoff"];
  const locations = ["bright apartment kitchen counter", "same bright apartment kitchen counter", "same bright apartment kitchen counter"];
  const continuity = [
    ["Creator faces camera with laptop open beside her.", "Creator turns toward the visible Windows laptop and rests one hand beside the keyboard."],
    ["Match the prior final frame, hand beside the keyboard and eyeline on the Windows laptop.", "Creator turns back toward camera while the laptop remains visible over her shoulder."],
    ["Match the prior final frame, creator facing camera with the Windows laptop over her shoulder.", "Creator gives a small knowing smile and closes on a clean steady frame."]
  ];
  const clips = scripts.map((spokenScript, index) => {
    const clipNumber = (index + 1) as 1 | 2 | 3;
    const durationSeconds = 10;
    const wordCount = spokenScript.split(/\s+/).length;
    const estimatedSpokenSeconds = estimateSpeech(spokenScript);
    const camera =
      "35 mm lens, shoulder-height three-quarter medium shot, creator on the left third, subtle handheld push-in, soft daylight from camera right";
    const visual = `${creator} at a ${locations[index]}, speaking naturally with a Windows laptop visible and no legible generated interface text`;
    const higgsfieldPrompt = `Create one continuous 10-second platform-safe UGC clip. ${visual}. ${camera}. She says exactly: "${spokenScript}" Physical action: ${continuity[index][1]} Keep natural lip sync, realistic hands, consistent face, consistent wardrobe, and the same room. Use a blank compositing-safe laptop display with no fabricated Aura interface text.`;
    return {
      clipNumber,
      purpose: purposes[index],
      durationSeconds,
      spokenScript,
      estimatedSpokenSeconds,
      wordCount,
      higgsfieldPrompt,
      continuityIn: continuity[index][0],
      continuityOut: continuity[index][1],
      shots: [
        {
          startSecond: 0,
          endSecond: 10,
          visual,
          dialogue: spokenScript,
          camera,
          overlay: "No generated interface text. Add real Aura capture in post if needed."
        }
      ]
    };
  });
  const spokenScript = clips.map((clip) => clip.spokenScript).join(" ");
  return {
    version,
    finalConcept: `${input.idea.concept} Evergreen production fallback`,
    hook: input.idea.hook,
    spokenScript,
    clips,
    higgsfieldPrompt: clips
      .map((clip) => `CLIP ${clip.clipNumber}\n${clip.higgsfieldPrompt}`)
      .join("\n\n"),
    negativeConstraints: [
      "No autonomous clicking or computer control",
      "No Mac hardware or macOS interface",
      "No fabricated Aura interface text",
      "No changing face, wardrobe, room, or laptop between clips",
      "No clipped dialogue, slow delivery, or random camera motion"
    ],
    durationSeconds: 30,
    recommendedModel: "Use the available Higgsfield model with reliable character consistency, lip sync, and start-frame reference support.",
    failurePoints: [
      "Generated laptop details may look false, so composite real Aura capture in post.",
      "Character or wardrobe drift can break continuity between separately generated clips."
    ],
    lockedAttributes: { clipCount: 3 },
    validation: {
      estimatedSpokenSeconds: clips.reduce(
        (sum, clip) => sum + clip.estimatedSpokenSeconds,
        0
      ),
      dialogueFits: clips.every(
        (clip) => clip.estimatedSpokenSeconds <= clip.durationSeconds - 1
      ),
      cameraExplicit: true,
      contradictions: [],
      repeatedHook: false
    }
  };
}

function replaceCameraDirections(
  prompt: string,
  previousShots: PromptPackage["clips"][number]["shots"],
  draftShots: PromptPackage["clips"][number]["shots"]
): string {
  let revised = prompt;
  let replaced = false;
  previousShots.forEach((shot, index) => {
    const nextCamera = draftShots[index]?.camera;
    if (nextCamera && revised.includes(shot.camera)) {
      revised = revised.replaceAll(shot.camera, nextCamera);
      replaced = true;
    }
  });
  if (replaced) return revised;
  return `${prompt}\nCamera revision only: ${draftShots.map((shot) => shot.camera).join("; ")}. Keep every other direction unchanged.`;
}

function replaceScriptDirection(
  prompt: string,
  previousScript: string,
  nextScript: string
): string {
  if (prompt.includes(previousScript)) {
    return prompt.replaceAll(previousScript, nextScript);
  }
  return `${prompt}\nSpoken dialogue revision only: "${nextScript}" Keep every other direction unchanged.`;
}

function replaceDurationDirection(
  prompt: string,
  previousDuration: number,
  nextDuration: number
): string {
  return prompt
    .replaceAll(`${previousDuration}-second`, `${nextDuration}-second`)
    .replaceAll(`${previousDuration} seconds`, `${nextDuration} seconds`);
}

export function applyLocks(
  draft: z.infer<typeof promptSchema>,
  previous: PromptPackage | undefined,
  changeRequest: string | undefined
): z.infer<typeof promptSchema> {
  if (!previous || !changeRequest) return draft;
  const previousUsesCurrentFormat =
    previous.clips.length === 3 &&
    previous.clips.every(
      (clip, index) =>
        clip.clipNumber === index + 1 &&
        clip.durationSeconds >= 10 &&
        clip.durationSeconds <= 12
    );
  if (!previousUsesCurrentFormat) {
    return { ...draft, lockedAttributes: { clipCount: 3 } };
  }
  const request = normalized(changeRequest);
  const onlyMatch = request.match(/change only (?:the )?(.+)/);
  if (!onlyMatch) {
    return {
      ...draft,
      lockedAttributes: { clipCount: 3 }
    };
  }
  const allowed = onlyMatch[1];
  const cameraOnly = allowed.includes("camera") || allowed.includes("angle");
  const scriptOnly = allowed.includes("script") || allowed.includes("dialogue");
  const durationOnly = allowed.includes("duration") || allowed.includes("length");
  const clips = previous.clips.map((clip, clipIndex) => {
    const draftClip = draft.clips[clipIndex] ?? clip;
    if (cameraOnly) {
      return {
        ...clip,
        higgsfieldPrompt: replaceCameraDirections(
          clip.higgsfieldPrompt,
          clip.shots,
          draftClip.shots
        ),
        shots: clip.shots.map((shot, shotIndex) => ({
          ...shot,
          camera: draftClip.shots[shotIndex]?.camera ?? shot.camera
        }))
      };
    }
    if (scriptOnly) {
      return {
        ...clip,
        spokenScript: draftClip.spokenScript,
        estimatedSpokenSeconds: draftClip.estimatedSpokenSeconds,
        wordCount: draftClip.wordCount,
        higgsfieldPrompt: replaceScriptDirection(
          clip.higgsfieldPrompt,
          clip.spokenScript,
          draftClip.spokenScript
        ),
        shots: clip.shots.map((shot, shotIndex) => ({
          ...shot,
          dialogue: draftClip.shots[shotIndex]?.dialogue ?? draftClip.spokenScript
        }))
      };
    }
    if (durationOnly) {
      const nextDuration = draftClip.durationSeconds;
      const ratio = nextDuration / clip.durationSeconds;
      return {
        ...clip,
        durationSeconds: nextDuration,
        higgsfieldPrompt: replaceDurationDirection(
          clip.higgsfieldPrompt,
          clip.durationSeconds,
          nextDuration
        ),
        shots: clip.shots.map((shot, shotIndex) => ({
          ...shot,
          startSecond: shotIndex === 0 ? 0 : Number((shot.startSecond * ratio).toFixed(2)),
          endSecond:
            shotIndex === clip.shots.length - 1
              ? nextDuration
              : Number((shot.endSecond * ratio).toFixed(2))
        }))
      };
    }
    return clip;
  });
  return {
    ...previous,
    finalConcept: allowed.includes("concept") ? draft.finalConcept : previous.finalConcept,
    hook: allowed.includes("hook") ? draft.hook : previous.hook,
    spokenScript: clips.map((clip) => clip.spokenScript).join(" "),
    durationSeconds: clips.reduce((sum, clip) => sum + clip.durationSeconds, 0),
    clips,
    higgsfieldPrompt: clips
      .map((clip) => `CLIP ${clip.clipNumber}\n${clip.higgsfieldPrompt}`)
      .join("\n\n"),
    negativeConstraints: allowed.includes("constraint")
      ? draft.negativeConstraints
      : previous.negativeConstraints,
    recommendedModel: allowed.includes("model")
      ? draft.recommendedModel
      : previous.recommendedModel,
    failurePoints: allowed.includes("failure")
      ? draft.failurePoints
      : previous.failurePoints,
    lockedAttributes: { clipCount: 3 }
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
  let draft: z.infer<typeof promptSchema>;
  try {
    draft = await generateStructured(
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
- Return exactly 3 separately generated clips. Every clip must be 10, 11, or 12 seconds. Never create a clip longer than 12 seconds.
- Give every clip its own complete, directly copyable Higgsfield prompt. The combined higgsfieldPrompt must label and include all 3 prompts.
- Cast an adult white blonde woman in her mid-to-late twenties. She should look striking, glamorous, confident, and flirtatious while remaining tasteful and platform-safe. Style her in a fashionable fitted sleeveless top.
- Do not force a desk scene. Choose a natural conversational setting that fits the concept, such as a couch, kitchen counter, bright studio corner, co-working lounge, or a creator moving through her space.
- Dialogue must fit naturally in each clip at about 2.35 words per second, with at least 1 second left for breath, reaction, or movement. A 10-second clip should normally contain no more than 21 spoken words.
- Build a hook, demonstration, and payoff arc across the 3 clips. Each spoken line must feel complete while leading naturally into the next.
- Every shot needs explicit lens or field of view, camera height, angle, framing, camera movement, subject position, lighting, and physical action.
- Repeat the same adult creator description and wardrobe in all 3 prompts for continuity, but do not store casting, clothing, environment, lighting, script, or duration as locked attributes.
- Define continuityIn and continuityOut for every clip. Clip 1 must create a clean final frame for clip 2. Clip 2 must start from clip 1's final frame and create a clean final frame for clip 3. Clip 3 must start from clip 2's final frame.
- Tell the owner to use each prior clip's exported final frame as the next clip's start-frame reference when the selected model exposes start and end frames.
- Prefer one motivated camera move per shot. Use combinations such as a subtle handheld push-in, shoulder-height three-quarter angle, lateral track, gentle orbit, or natural reframing. Avoid random motion and excessive cuts.
- Keep product representation consistent and make each cut happen on matched motion, eyeline, or an object passing frame.
- A Higgsfield prompt must never fabricate detailed Aura interface text. Use a compositing-safe blank or abstract overlay when needed.
- Speaking should sound conversational and energetic, not slow or scripted.
- lockedAttributes must contain only {"clipCount": 3}.
- If the instruction requests one change, change only that attribute and copy everything else from the previous package.
- recommendedModel should describe the Higgsfield capability needed, since model availability varies by subscription.
- Show only a Windows desktop environment and product experience.`,
      { temperature: 0.35, maxAttempts: 4 }
    );
  } catch (error) {
    if (!isRateLimitError(error)) throw error;
    return fallbackPromptPackage(input);
  }

  const locked = applyLocks(draft, input.previous, input.instruction);
  const clips = locked.clips.map((clip, index) => {
    const wordCount = clip.spokenScript.trim().split(/\s+/).filter(Boolean).length;
    const estimatedSpokenSeconds = estimateSpeech(clip.spokenScript);
    const shotsValid =
      clip.shots[0]?.startSecond === 0 &&
      Math.abs((clip.shots.at(-1)?.endSecond ?? 0) - clip.durationSeconds) < 0.25 &&
      clip.shots.every(
        (shot, shotIndex) =>
          shot.startSecond < shot.endSecond &&
          (shotIndex === 0 ||
            Math.abs(shot.startSecond - clip.shots[shotIndex - 1].endSecond) < 0.25)
      );
    if (clip.clipNumber !== index + 1) {
      throw new Error("Prompt Director returned clips out of order");
    }
    if (!shotsValid) {
      throw new Error(`Prompt Director returned a discontinuous plan for clip ${index + 1}`);
    }
    if (estimatedSpokenSeconds > clip.durationSeconds - 1) {
      throw new Error(
        `Clip ${index + 1} dialogue needs about ${estimatedSpokenSeconds}s but only ${clip.durationSeconds - 1}s is available for speech`
      );
    }
    return {
      ...clip,
      wordCount,
      estimatedSpokenSeconds
    };
  });
  const durationSeconds = clips.reduce((sum, clip) => sum + clip.durationSeconds, 0);
  const spokenScript = clips.map((clip) => clip.spokenScript).join(" ");
  const estimated = clips.reduce(
    (sum, clip) => sum + clip.estimatedSpokenSeconds,
    0
  );
  const repeated = (input.recentHooks ?? []).some(
    (hook) => normalized(hook) === normalized(locked.hook)
  );
  if (locked.validation.contradictions.length) {
    throw new Error(`Prompt contradictions: ${locked.validation.contradictions.join(", ")}`);
  }
  if (repeated) {
    throw new Error("Prompt Director repeated a recent hook");
  }
  const finalized = promptSchema.parse({
    ...locked,
    clips,
    spokenScript,
    higgsfieldPrompt: clips
      .map((clip) => `CLIP ${clip.clipNumber}\n${clip.higgsfieldPrompt}`)
      .join("\n\n"),
    durationSeconds,
    lockedAttributes: { clipCount: 3 },
    validation: {
      ...locked.validation,
      estimatedSpokenSeconds: estimated,
      dialogueFits: clips.every(
        (clip) => clip.estimatedSpokenSeconds <= clip.durationSeconds - 1
      ),
      repeatedHook: repeated
    }
  });
  return { ...finalized, version: nextVersion };
}
