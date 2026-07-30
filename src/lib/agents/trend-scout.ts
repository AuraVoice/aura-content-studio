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

function scoutSchemaFor(evidenceCount: number) {
  return scoutSchema.superRefine((value, context) => {
    value.ideas.forEach((idea, ideaIndex) => {
      const seen = new Set<number>();
      idea.sources.forEach((source, sourceIndex) => {
        if (source.evidenceIndex > evidenceCount) {
          context.addIssue({
            code: "custom",
            message: `Evidence index must be between 1 and ${evidenceCount}`,
            path: ["ideas", ideaIndex, "sources", sourceIndex, "evidenceIndex"]
          });
        }
        if (seen.has(source.evidenceIndex)) {
          context.addIssue({
            code: "custom",
            message: "Evidence indexes must be unique within an idea",
            path: ["ideas", ideaIndex, "sources", sourceIndex, "evidenceIndex"]
          });
        }
        seen.add(source.evidenceIndex);
      });
    });
  });
}

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

export function fallbackTrendIdeas(instruction?: string): TrendIdea[] {
  const ownerContext = instruction?.trim()
    ? ` Owner direction: ${instruction.trim()}`
    : "";
  return [
    {
      rank: 1,
      concept: "A creator admits how often tab switching breaks her focus, then shows Aura staying available in a lightweight Windows overlay.",
      hook: "I was losing my train of thought before I even reached the AI tab.",
      format: "ugc_video",
      platform: "TikTok",
      auraRelevance: `Demonstrates Aura as a voice-first Windows companion without claiming computer control.${ownerContext}`,
      sources: [],
      shelfLife: "evergreen",
      higgsfieldNeeded: true,
      generationRisk: "low",
      riskReason: "A simple creator-led confession and overlay-safe demonstration avoids fabricated interface detail."
    },
    {
      rank: 2,
      concept: "A real Windows screen recording shows the global shortcut, a spoken question about visible content, and a useful answer in the overlay.",
      hook: "The fastest way to ask about my screen is to stay on my screen.",
      format: "screen_recording",
      platform: "YouTube Shorts",
      auraRelevance: `Shows screen understanding only after access is enabled and keeps the product experience grounded in Windows.${ownerContext}`,
      sources: [],
      shelfLife: "evergreen",
      higgsfieldNeeded: false,
      generationRisk: "low",
      riskReason: "A real capture is more credible than generating interface details."
    },
    {
      rank: 3,
      concept: "A before-and-after product demo contrasts scattered tabs with asking Aura aloud and refining a draft without leaving the current task.",
      hook: "Same work. Fewer detours.",
      format: "product_demo",
      platform: "Instagram Reels",
      auraRelevance: `Connects voice conversation, visible drafting, and reduced context switching on Windows without implying autonomous actions.${ownerContext}`,
      sources: [],
      shelfLife: "evergreen",
      higgsfieldNeeded: false,
      generationRisk: "medium",
      riskReason: "The edit must clearly separate real product capture from any illustrative creator footage."
    }
  ];
}

export async function runTrendScout(
  provider?: SearchProvider,
  instruction?: string
): Promise<TrendIdea[]> {
  const research = await dailyTrendResearch(provider).catch(() => []);
  const availableResearch = Array.from(
    new Map(research.map((item) => [item.url, item])).values()
  ).slice(0, 24);
  if (!availableResearch.length) {
    return fallbackTrendIdeas(instruction);
  }
  const evidence = availableResearch
    .map(
      (item, index) =>
        `[${index + 1}] ${item.title}\nURL: ${item.url}\nPublished: ${item.publishedAt ?? "unknown"}\n${item.content}`
    )
    .join("\n\n");

  try {
    const result = await generateStructured(
      scoutSchemaFor(availableResearch.length),
      `You are Trend Scout, a marketing research specialist for Aura Desktop.

Return exactly three distinct daily ideas. Rank them by likely impact and honesty.
At least one idea should avoid Higgsfield when a meme, real screenshot, screen recording, comparison image, or product demo would work better.
For every source, return its evidenceIndex from the numbered evidence below and
your relevance note. Never return or rewrite a URL. The application resolves the
index to the exact researched URL.
Valid evidence indexes are 1 through ${availableResearch.length}. Use each index
at most once inside an idea. Check every index before returning the JSON.

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
      { temperature: 0.35, maxAttempts: 3 }
    );

    return result.ideas
      .map((idea) => ({
        ...idea,
        sources: resolveEvidenceSources(idea.sources, availableResearch)
      }))
      .sort((a, b) => a.rank - b.rank) as TrendIdea[];
  } catch {
    return fallbackTrendIdeas(instruction);
  }
}
