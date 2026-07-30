import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { localDate } from "@/lib/repository";
import { manualResearchKey } from "@/lib/workflow/research-run";
import { start } from "workflow/api";
import { deliverResearchUntilTelegram } from "../../../../../workflows/research-delivery";

export const maxDuration = 300;

interface ManualResearchRequest {
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

  let body: ManualResearchRequest;
  try {
    body = await request.json() as ManualResearchRequest;
  } catch {
    return invalid("Invalid research request");
  }
  if (!body.requestId || !/^[a-f0-9-]{20,64}$/i.test(body.requestId)) {
    return invalid("Research request identifier is invalid");
  }

  const date = localDate(env().STUDIO_TIMEZONE);
  const threadId = `campaign:${date}:manual:${body.requestId}`;

  try {
    const run = await start(deliverResearchUntilTelegram, [
      {
        campaignDate: date,
        threadId,
        baseIdempotencyKey: manualResearchKey(date, body.requestId),
        executionId: randomUUID(),
        workflowEventType: "manual_research",
        ownerInstruction:
          "Run a fresh research pass now. Replace today's ranked ideas with the strongest current evidence."
      }
    ]);
    return NextResponse.json({
      ok: true,
      queued: true,
      runId: run.runId
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Manual research failed";
    return NextResponse.json({ ok: false, error: text }, { status: 500 });
  }
}
