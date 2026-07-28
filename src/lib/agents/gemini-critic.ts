import { z } from "zod";
import { evaluateVideoWithGemini } from "@/lib/ai/gemini";
import { AURA_DESKTOP_FACTS, AURA_DESKTOP_GUARDRAILS } from "@/lib/product";
import type { CriticEvaluation, PromptPackage } from "@/lib/types";

const issueSchema = z.object({
  timestamp: z.string(),
  severity: z.enum(["minor", "material", "fatal"]),
  category: z.enum([
    "hook",
    "realism",
    "camera",
    "framing",
    "pacing",
    "speech",
    "lip_sync",
    "consistency",
    "product_accuracy",
    "clipped_dialogue",
    "artifact",
    "platform"
  ]),
  problem: z.string(),
  remedy: z.string()
});

const evaluationSchema = z.object({
  verdict: z.enum([
    "APPROVE",
    "APPROVE_WITH_MINOR_ISSUES",
    "SURGICAL_REGENERATION",
    "ABANDON"
  ]),
  summary: z.string(),
  issues: z.array(issueSchema),
  creditRecommendation: z.string(),
  worthAnotherGeneration: z.boolean(),
  cheaperFixes: z.array(z.string()),
  regenerateOnly: z.array(z.string()),
  lockedAttributesToPreserve: z.array(z.string())
});

export async function runGeminiCritic(input: {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
  promptPackage: PromptPackage;
  platform?: string;
}): Promise<CriticEvaluation> {
  return evaluateVideoWithGemini({
    schema: evaluationSchema,
    bytes: input.bytes,
    mimeType: input.mimeType,
    fileName: input.fileName,
    prompt: `You are Gemini Critic, a strict but credit-conscious video reviewer.

Evaluate the uploaded video against this exact production package:
${JSON.stringify(input.promptPackage, null, 2)}

Target platform: ${input.platform ?? "short-form social"}

Aura Desktop facts:
${AURA_DESKTOP_FACTS.map((fact) => `- ${fact}`).join("\n")}

Guardrails:
${AURA_DESKTOP_GUARDRAILS.map((rule) => `- ${rule}`).join("\n")}

Inspect hook, realism, camera angle, framing, pacing, speech speed, lip sync, visual consistency, product accuracy, clipped dialogue, generation artifacts, and platform fit.
Timestamp every observed problem as MM:SS.

Decision policy:
- APPROVE when it is publishable.
- APPROVE_WITH_MINOR_ISSUES when trimming, captions, audio cleanup, cropping, or accepting a small flaw is smarter than spending another generation.
- SURGICAL_REGENERATION only when a bounded defect materially harms the post and the exact correction can be isolated.
- ABANDON when the concept or output is fundamentally unusable.
- Prefer cheaper editing fixes. Do not recommend another generation merely for polish.
- For surgical regeneration, regenerateOnly must list the smallest possible changes and lockedAttributesToPreserve must list everything that cannot drift.
- This evaluation recommends. It never initiates Higgsfield generation.`
  });
}

