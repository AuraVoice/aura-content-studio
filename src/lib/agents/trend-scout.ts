import { z } from "zod";
import { generateStructured } from "@/lib/ai/gemini";
import { dailyTrendResearch, type SearchProvider } from "@/lib/search/provider";
import {
  AURA_DESKTOP_FACTS,
  AURA_DESKTOP_GUARDRAILS,
  BRAND_VOICE,
  COMPETITOR_CONTEXT
} from "@/lib/product";
import type { TrendIdea } from "@/lib/types";

const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  publishedAt: z.string().optional(),
  note: z.string()
});

const ideaSchema = z.object({
  rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  concept: z.string(),
  hook: z.string(),
  format: z.enum([
    "ugc_video",
    "product_demo",
    "screen_recording",
    "x_meme",
    "screenshot",
    "comparison_image",
    "mixed"
  ]),
  platform: z.enum(["X", "TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn"]),
  auraRelevance: z.string(),
  sources: z.array(sourceSchema).min(1),
  shelfLife: z.enum(["24 hours", "3 days", "1 week", "evergreen"]),
  higgsfieldNeeded: z.boolean(),
  generationRisk: z.enum(["low", "medium", "high"]),
  riskReason: z.string()
});

const scoutSchema = z.object({
  ideas: z.array(ideaSchema).length(3)
});

export async function runTrendScout(
  provider?: SearchProvider,
  instruction?: string
): Promise<TrendIdea[]> {
  const research = await dailyTrendResearch(provider);
  const evidence = research
    .slice(0, 24)
    .map(
      (item, index) =>
        `[${index + 1}] ${item.title}\nURL: ${item.url}\nPublished: ${item.publishedAt ?? "unknown"}\n${item.content}`
    )
    .join("\n\n");

  const result = await generateStructured(
    scoutSchema,
    `You are Trend Scout, a marketing research specialist for Aura Desktop.

Return exactly three distinct daily ideas. Rank them by likely impact and honesty.
At least one idea should avoid Higgsfield when a meme, real screenshot, screen recording, comparison image, or product demo would work better.
Use only the evidence URLs below as source links. Never invent a URL.

Aura Desktop facts:
${AURA_DESKTOP_FACTS.map((fact) => `- ${fact}`).join("\n")}

Hard guardrails:
${AURA_DESKTOP_GUARDRAILS.map((rule) => `- ${rule}`).join("\n")}

Voice:
${BRAND_VOICE.map((rule) => `- ${rule}`).join("\n")}

Competitor context:
${COMPETITOR_CONTEXT}

Owner instruction:
${instruction || "No special instruction today."}

Research evidence:
${evidence}

For each idea, explain its specific relevance, honest shelf life, whether Higgsfield is actually needed, and realistic generation risk. Every idea must depict the Windows desktop product.`,
    { temperature: 0.55 }
  );

  const allowedUrls = new Set(research.map((item) => item.url));
  for (const idea of result.ideas) {
    if (!idea.sources.length || idea.sources.some((source) => !allowedUrls.has(source.url))) {
      throw new Error("Trend Scout returned a source URL that was not in web research");
    }
  }
  return result.ideas.sort((a, b) => a.rank - b.rank) as TrendIdea[];
}
