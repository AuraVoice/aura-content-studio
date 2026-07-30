import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { campaignScheduleStatus } from "@/lib/campaign-schedule";
import { env } from "@/lib/env";
import { localDate } from "@/lib/repository";
import { start } from "workflow/api";
import { deliverResearchUntilTelegram } from "../../../../../workflows/research-delivery";

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
  try {
    const run = await start(deliverResearchUntilTelegram, [
      {
        campaignDate: date,
        threadId: `campaign:${date}`,
        baseIdempotencyKey: `daily:${date}`,
        executionId: randomUUID(),
        workflowEventType: "daily"
      }
    ]);
    return NextResponse.json({
      ok: true,
      queued: true,
      runId: run.runId
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Unknown daily workflow error";
    return NextResponse.json({ ok: false, error: text }, { status: 500 });
  }
}
