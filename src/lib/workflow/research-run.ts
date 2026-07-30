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
  telegramDelivered: boolean;
  claimedAt?: string;
  error?: string;
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
  suppressFailureMessages?: boolean;
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
      status: run.status,
      telegramDelivered: run.status === "completed",
      claimedAt: run.claimed_at
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
    const messages =
      input.suppressFailureMessages && result.state.status === "failed"
        ? []
        : result.messages;
    let telegramDelivered = false;
    for (const text of messages) {
      const sent = await sendTelegramMessage(env().TELEGRAM_ALLOWED_CHAT_ID, text);
      telegramDelivered ||= sent.length > 0;
      await saveMessage({
        campaignId,
        telegramMessageId: sent[0]?.message_id,
        direction: "outbound",
        source: "orchestrator",
        text
      });
    }
    if (result.state.status === "failed") {
      const failure = describeWorkflowFailure(new Error(result.state.error));
      await completeWorkflowRun(run.id, "failed", { failure }, failure.message);
      return {
        duplicate: false,
        campaignId,
        status: "failed",
        telegramDelivered: false,
        error: failure.message
      };
    }
    await completeWorkflowRun(run.id, result.state.stale ? "stale" : "completed", {
      status: result.state.status,
      interrupted: result.interrupted
    });
    return {
      duplicate: false,
      campaignId,
      status: result.state.status,
      telegramDelivered
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
