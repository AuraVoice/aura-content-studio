import { z } from "zod";
import { generateStructured } from "@/lib/ai/gemini";
import {
  dailyTrendResearch,
  type SearchProvider,
  type SearchResult
} from "@/lib/search/provider";
import {
  AURA_DESKTOP_FACTS,
  AURA_DESKTOP_GUARDRAILS,
  BRAND_VOICE,
  COMPETITOR_CONTEXT
} from "@/lib/product";
import type { TrendIdea, TrendSource } from "@/lib/types";

const sourceSchema = z.object({
  evidenceIndex: z.number().int().positive(),
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

export function resolveEvidenceSources(
  references: Array<{ evidenceIndex: number; note: string }>,
  research: SearchResult[]
): TrendSource[] {
  const seen = new Set<number>();
  return references.map((reference) => {
    const index = reference.evidenceIndex - 1;
    const source = research[index];
    if (!source || seen.has(index)) {
      throw new Error("Trend Scout returned an invalid or duplicate evidence index");
    }
    seen.add(index);
    return {
      title: source.title,
      url: source.url,
      publishedAt: source.publishedAt,
      note: reference.note
    };
  });
}

export async function runTrendScout(
  provider?: SearchProvider,
  instruction?: string
): Promise<TrendIdea[]> {
  const research = await dailyTrendResearch(provider);
  const availableResearch = research.slice(0, 24);
  const evidence = availableResearch
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
For every source, return its evidenceIndex from the numbered evidence below and
your relevance note. Never return or rewrite a URL. The application resolves the
index to the exact researched URL.

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

  return result.ideas
    .map((idea) => ({
      ...idea,
      sources: resolveEvidenceSources(idea.sources, availableResearch)
    }))
    .sort((a, b) => a.rank - b.rank) as TrendIdea[];
}
