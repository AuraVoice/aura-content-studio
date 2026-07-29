import { NextRequest, NextResponse } from "next/server";
import { campaignScheduleStatus } from "@/lib/campaign-schedule";
import { env } from "@/lib/env";
import {
  claimDailyCampaign,
  localDate
} from "@/lib/repository";
import { executeResearchRun } from "@/lib/workflow/research-run";

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
  try {
    const result = await executeResearchRun({
      campaign: {
        id: campaignId,
        campaign_date: date,
        thread_id: String(campaign.thread_id),
        run_version: Number(campaign.run_version)
      },
      idempotencyKey: `daily:${date}`,
      workflowEventType: "daily"
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Unknown daily workflow error";
    return NextResponse.json({ ok: false, error: text }, { status: 500 });
  }
}
