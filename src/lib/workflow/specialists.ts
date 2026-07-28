import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import { runTrendScout } from "@/lib/agents/trend-scout";
import { runPromptDirector } from "@/lib/agents/prompt-director";
import { runGeminiCritic } from "@/lib/agents/gemini-critic";
import { downloadUpload } from "@/lib/repository";
import type { CriticEvaluation, PromptPackage, TrendIdea } from "@/lib/types";

const TrendState = new StateSchema({
  instruction: z.string().default(""),
  ideas: z.array(z.custom<TrendIdea>()).default([])
});

export const trendScoutSubgraph = new StateGraph(TrendState)
  .addNode("research_current_web", async (state) => ({
    ideas: await runTrendScout(undefined, state.instruction)
  }))
  .addEdge(START, "research_current_web")
  .addEdge("research_current_web", END)
  .compile();

const DirectorState = new StateSchema({
  idea: z.custom<TrendIdea>(),
  instruction: z.string().default(""),
  previous: z.custom<PromptPackage>().optional(),
  recentHooks: z.array(z.string()).default([]),
  requiredRevision: z.array(z.string()).default([]),
  promptPackage: z.custom<PromptPackage>().optional()
});

export const promptDirectorSubgraph = new StateGraph(DirectorState)
  .addNode("write_and_validate_direction", async (state) => ({
    promptPackage: await runPromptDirector({
      idea: state.idea,
      instruction: state.instruction,
      previous: state.previous,
      recentHooks: state.recentHooks,
      requiredRevision: state.requiredRevision
    })
  }))
  .addEdge(START, "write_and_validate_direction")
  .addEdge("write_and_validate_direction", END)
  .compile();

const CriticState = new StateSchema({
  uploadId: z.string(),
  promptPackage: z.custom<PromptPackage>(),
  platform: z.string().default("short-form social"),
  evaluation: z.custom<CriticEvaluation>().optional()
});

export const geminiCriticSubgraph = new StateGraph(CriticState)
  .addNode("inspect_video", async (state) => {
    const { row, bytes } = await downloadUpload(state.uploadId);
    return {
      evaluation: await runGeminiCritic({
        bytes,
        mimeType: row.mime_type as string,
        fileName: row.file_name as string,
        promptPackage: state.promptPackage,
        platform: state.platform
      })
    };
  })
  .addEdge(START, "inspect_video")
  .addEdge("inspect_video", END)
  .compile();

