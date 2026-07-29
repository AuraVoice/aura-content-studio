import { NextRequest, NextResponse } from "next/server";
import { campaignScheduleStatus } from "@/lib/campaign-schedule";
import { env } from "@/lib/env";
import {
  claimDailyCampaign,
  claimWorkflowRun,
  completeWorkflowRun,
  localDate,
  saveMessage
} from "@/lib/repository";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { invokeWorkflow } from "@/lib/workflow/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env().CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const date = localDate(env().STUDIO_TIMEZONE);
  const scheduleStatus = campaignScheduleStatus(date);
  if (scheduleStatus !== "active") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: scheduleStatus,
      date
    });
  }
  const campaign = await claimDailyCampaign(date);
  const campaignId = campaign.id as string;
  const run = await claimWorkflowRun({
    key: `daily:${date}`,
    campaignId,
    runVersion: Number(campaign.run_version),
    eventType: "daily"
  });
  if (!run.is_new) {
    return NextResponse.json({ ok: true, duplicate: true, status: run.status });
  }
  try {
    const result = await invokeWorkflow({
      campaignId,
      campaignDate: date,
      threadId: campaign.thread_id as string,
      runVersion: Number(campaign.run_version),
      eventType: "daily"
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
    await completeWorkflowRun(run.id, "completed", {
      status: result.state.status,
      interrupted: result.interrupted
    });
    return NextResponse.json({ ok: true, campaignId, status: result.state.status });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Unknown daily workflow error";
    await completeWorkflowRun(run.id, "failed", undefined, text);
    return NextResponse.json({ ok: false, error: text }, { status: 500 });
  }
}
