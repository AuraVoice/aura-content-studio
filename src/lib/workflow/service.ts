import { Command, INTERRUPT, isInterrupted, MemorySaver } from "@langchain/langgraph";
import { createOrchestrator } from "./orchestrator";
import type { WorkflowValue } from "./state";

export interface WorkflowEvent {
  campaignId: string;
  campaignDate: string;
  threadId: string;
  runVersion: number;
  eventType: "daily" | "instruction" | "video_uploaded";
  ownerInstruction?: string;
  uploadId?: string;
}

export interface WorkflowResult {
  state: WorkflowValue;
  messages: string[];
  interrupted: boolean;
}

export async function invokeWorkflow(
  event: WorkflowEvent,
  options: { useMemory?: boolean; forceResume?: boolean } = {}
): Promise<WorkflowResult> {
  const graph = await createOrchestrator(options.useMemory ? new MemorySaver() : undefined);
  const config = { configurable: { thread_id: event.threadId } };
  const snapshot = await graph.getState(config);
  const hasPendingInterrupt = snapshot.tasks.some((task) => task.interrupts?.length);
  const shouldResume =
    event.eventType === "instruction" && (options.forceResume || hasPendingInterrupt);

  const input = shouldResume
    ? new Command({ resume: event.ownerInstruction ?? "" })
    : {
        campaignId: event.campaignId,
        campaignDate: event.campaignDate,
        threadId: event.threadId,
        runVersion: event.runVersion,
        eventType: event.eventType,
        ownerInstruction: event.ownerInstruction ?? "",
        uploadId: event.uploadId ?? "",
        outboundMessages: []
      };
  const state = (await graph.invoke(
    input as Parameters<typeof graph.invoke>[0],
    config
  )) as WorkflowValue & {
    [INTERRUPT]?: Array<{ value?: { message?: string } }>;
  };
  const messages = [...(state.outboundMessages ?? [])];
  if (isInterrupted(state)) {
    for (const item of state[INTERRUPT]) {
      const message =
        typeof item.value === "object" && item.value && "message" in item.value
          ? String(item.value.message)
          : String(item.value);
      if (!messages.includes(message)) messages.push(message);
    }
  }
  return {
    state,
    messages,
    interrupted: isInterrupted(state)
  };
}
