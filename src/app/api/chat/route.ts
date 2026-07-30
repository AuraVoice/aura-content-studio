import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  claimDailyCampaign,
  claimWorkflowRun,
  completeWorkflowRun,
  getActiveCampaign,
  listIdeas,
  localDate,
  saveMessage,
  updateCampaign
} from "@/lib/repository";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { invokeWorkflow } from "@/lib/workflow/service";
import { describeWorkflowFailure } from "@/lib/workflow/errors";

interface ChatRequest {
  message?: string;
  requestId?: string;
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    await requireSession();
  } catch {
    return invalid("Your studio session expired. Sign in again.", 401);
  }

  let body: ChatRequest;
  try {
    body = await request.json() as ChatRequest;
  } catch {
    return invalid("Invalid chat request");
  }
  const message = body.message?.trim();
  if (!message || message.length > 4000) {
    return invalid("Enter a message up to 4,000 characters");
  }
  if (!body.requestId || !/^[a-f0-9-]{20,64}$/i.test(body.requestId)) {
    return invalid("Chat request identifier is invalid");
  }

  let campaign = await getActiveCampaign();
  if (!campaign) campaign = await claimDailyCampaign(localDate(env().STUDIO_TIMEZONE));
  const campaignId = String(campaign.id);
  const run = await claimWorkflowRun({
    key: `dashboard-chat:${body.requestId}`,
    campaignId,
    runVersion: Number(campaign.run_version),
    eventType: "dashboard_chat"
  });
  if (!run.is_new) {
    return NextResponse.json({ duplicate: true, status: run.status });
  }

  await saveMessage({
    campaignId,
    direction: "inbound",
    source: "dashboard",
    text: message,
    payload: { requestId: body.requestId }
  });

  try {
    const hasIdeas = (await listIdeas(campaignId)).length > 0;
    const result = await invokeWorkflow({
      campaignId,
      campaignDate: String(campaign.campaign_date),
      threadId: String(campaign.thread_id),
      runVersion: Number(campaign.run_version),
      eventType: hasIdeas ? "instruction" : "daily",
      ownerInstruction: message
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
    if (result.state.status === "failed") {
      const failure = describeWorkflowFailure(new Error(result.state.error));
      await completeWorkflowRun(run.id, "failed", { failure }, failure.message);
      return NextResponse.json(
        {
          messages: result.messages,
          error: failure.message,
          code: failure.code,
          retryable: failure.retryable
        },
        { status: 500 }
      );
    }
    await completeWorkflowRun(run.id, result.state.stale ? "stale" : "completed", {
      status: result.state.status,
      interrupted: result.interrupted
    });
    return NextResponse.json({ messages: result.messages, status: result.state.status });
  } catch (error) {
    const failure = describeWorkflowFailure(error);
    await updateCampaign(
      campaignId,
      {
        status: "failed",
        current_step: "Dashboard request failed",
        error: failure.message
      },
      Number(campaign.run_version)
    );
    await completeWorkflowRun(run.id, "failed", { failure }, failure.message);
    return NextResponse.json(
      { error: failure.message, code: failure.code, retryable: failure.retryable },
      { status: 500 }
    );
  }
}
