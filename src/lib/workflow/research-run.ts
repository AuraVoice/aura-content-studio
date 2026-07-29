import { env } from "@/lib/env";
import {
  claimWorkflowRun,
  completeWorkflowRun,
  saveMessage,
  updateCampaign
} from "@/lib/repository";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { invokeWorkflow } from "./service";
import { describeWorkflowFailure } from "./errors";

interface ResearchCampaign {
  id: string;
  campaign_date: string;
  thread_id: string;
  run_version: number;
}

export interface ResearchRunResult {
  duplicate: boolean;
  campaignId: string;
  status: string;
}

export function manualResearchKey(campaignId: string, requestId: string): string {
  return `manual-research:${campaignId}:${requestId}`;
}

export async function executeResearchRun(input: {
  campaign: ResearchCampaign;
  idempotencyKey: string;
  workflowEventType: "daily" | "manual_research";
  ownerInstruction?: string;
  onClaimed?: () => Promise<void>;
}): Promise<ResearchRunResult> {
  const campaignId = String(input.campaign.id);
  const run = await claimWorkflowRun({
    key: input.idempotencyKey,
    campaignId,
    runVersion: Number(input.campaign.run_version),
    eventType: input.workflowEventType
  });
  if (!run.is_new) {
    return {
      duplicate: true,
      campaignId,
      status: run.status
    };
  }

  try {
    await input.onClaimed?.();
    const result = await invokeWorkflow({
      campaignId,
      campaignDate: String(input.campaign.campaign_date),
      threadId: String(input.campaign.thread_id),
      runVersion: Number(input.campaign.run_version),
      eventType: "daily",
      ownerInstruction: input.ownerInstruction
    });
    for (const text of result.messages) {
      const sent = await sendTelegramMessage(env().TELEGRAM_ALLOWED_CHAT_ID, text);
      await saveMessage({
        campaignId,
        telegramMessageId: sent[0]?.message_id,
        direction: "outbound",
        source: "orchestrator",
        text
      });
    }
    await completeWorkflowRun(run.id, result.state.stale ? "stale" : "completed", {
      status: result.state.status,
      interrupted: result.interrupted
    });
    return {
      duplicate: false,
      campaignId,
      status: result.state.status
    };
  } catch (error) {
    const failure = describeWorkflowFailure(error);
    await updateCampaign(
      campaignId,
      {
        status: "failed",
        current_step: "Research failed",
        error: failure.message
      },
      Number(input.campaign.run_version)
    );
    await completeWorkflowRun(run.id, "failed", { failure }, failure.message);
    throw new Error(failure.message);
  }
}
