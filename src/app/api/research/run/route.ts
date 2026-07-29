import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  claimDailyCampaign,
  localDate,
  updateCampaign
} from "@/lib/repository";
import {
  executeResearchRun,
  manualResearchKey
} from "@/lib/workflow/research-run";

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
  const campaign = await claimDailyCampaign(date);
  const campaignId = String(campaign.id);
  const threadId = `campaign:${date}:manual:${body.requestId}`;

  try {
    const result = await executeResearchRun({
      campaign: {
        id: campaignId,
        campaign_date: String(campaign.campaign_date),
        thread_id: threadId,
        run_version: Number(campaign.run_version)
      },
      idempotencyKey: manualResearchKey(campaignId, body.requestId),
      workflowEventType: "manual_research",
      ownerInstruction:
        "Run a fresh research pass now. Replace today's ranked ideas with the strongest current evidence.",
      onClaimed: async () => {
        const current = await updateCampaign(
          campaignId,
          {
            status: "researching",
            current_step: "Manual research running",
            thread_id: threadId,
            cancelled_at: null
          },
          Number(campaign.run_version)
        );
        if (!current) {
          throw new Error("The campaign changed before research could start. Try again.");
        }
      }
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Manual research failed";
    return NextResponse.json({ ok: false, error: text }, { status: 500 });
  }
}
