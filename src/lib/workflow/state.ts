import { StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import type { CriticEvaluation, PromptPackage, TrendIdea } from "@/lib/types";

const jsonIdea = z.custom<TrendIdea>();
const jsonPrompt = z.custom<PromptPackage>();
const jsonEvaluation = z.custom<CriticEvaluation>();

export const WorkflowState = new StateSchema({
  campaignId: z.string(),
  campaignDate: z.string(),
  threadId: z.string(),
  runVersion: z.number().int(),
  eventType: z
    .enum(["daily", "instruction", "video_uploaded", "resume"])
    .default("daily"),
  route: z
    .enum(["research", "direct", "critic", "cancel", "noop"])
    .default("noop"),
  status: z.string().default("researching"),
  ownerInstruction: z.string().default(""),
  humanResponse: z.string().default(""),
  uploadId: z.string().default(""),
  ideas: z.array(jsonIdea).default([]),
  selectedIdea: jsonIdea.optional(),
  promptPackage: jsonPrompt.optional(),
  evaluation: jsonEvaluation.optional(),
  decision: z.enum(["selected", "research", "skip", "none"]).default("none"),
  outboundMessages: z.array(z.string()).default([]),
  stale: z.boolean().default(false),
  error: z.string().default("")
});

export type WorkflowValue = typeof WorkflowState.State;

