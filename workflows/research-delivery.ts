import { sleep } from "workflow";

export interface DurableResearchInput {
  campaignDate: string;
  threadId: string;
  baseIdempotencyKey: string;
  executionId: string;
  workflowEventType: "daily" | "manual_research";
  ownerInstruction?: string;
}

interface ResolvedResearchInput extends DurableResearchInput {
  campaignId: string;
  runVersion: number;
  terminalReason?: string;
}

export interface DurableResearchResult {
  delivered: boolean;
  attempts: number;
  terminalReason?: string;
}

export function researchRetryDelayMs(attempt: number): number {
  const exponent = Math.max(0, Math.min(attempt - 1, 7));
  return Math.min(60 * 60 * 1000, 30_000 * 2 ** exponent);
}

export const CLAIM_LEASE_MS = 10 * 60 * 1000;

export function claimLeaseIsCurrent(claimedAt: string | undefined, now = Date.now()): boolean {
  const claimedAtMs = Date.parse(claimedAt ?? "");
  return Number.isFinite(claimedAtMs) && now - claimedAtMs < CLAIM_LEASE_MS;
}

async function initializeResearch(
  input: DurableResearchInput
): Promise<ResolvedResearchInput> {
  "use step";

  const {
    beginManualResearch,
    claimDailyCampaign,
    claimWorkflowRun
  } = await import("@/lib/repository");
  const campaign = await claimDailyCampaign(input.campaignDate);
  const requestOwner = `research_request:${input.executionId}`;
  const requestClaim = await claimWorkflowRun({
    key: `${input.baseIdempotencyKey}:request`,
    campaignId: String(campaign.id),
    runVersion: Number(campaign.run_version),
    eventType: requestOwner
  });

  if (!requestClaim.is_new) {
    const sameExecution = requestClaim.event_type === requestOwner;
    const sameThread = String(campaign.thread_id) === input.threadId;
    const mutationHasNotStarted =
      Number(campaign.run_version) === Number(requestClaim.run_version);
    if (!sameExecution || (!sameThread && !mutationHasNotStarted)) {
      return {
        ...input,
        campaignId: String(campaign.id),
        runVersion: Number(requestClaim.run_version),
        terminalReason: "This research request was already claimed."
      };
    }
  }

  if (
    input.workflowEventType === "daily" &&
    String(campaign.thread_id) !== input.threadId
  ) {
    return {
      ...input,
      campaignId: String(campaign.id),
      runVersion: Number(campaign.run_version),
      terminalReason: "The daily request was superseded by a manual research run."
    };
  }
  const claimed =
    input.workflowEventType === "manual_research"
      ? await beginManualResearch(String(campaign.id), input.threadId)
      : campaign;
  return {
    ...input,
    campaignId: String(claimed.id),
    runVersion: Number(claimed.run_version)
  };
}

async function runResearchAttempt(
  input: ResolvedResearchInput,
  attempt: number
): Promise<{
  delivered: boolean;
  retrySameAttempt?: boolean;
  terminalReason?: string;
}> {
  "use step";

  const { getCampaign, updateCampaign } = await import("@/lib/repository");
  const { executeResearchRun } = await import("@/lib/workflow/research-run");
  const campaign = await getCampaign(input.campaignId);
  if (
    Number(campaign.run_version) !== input.runVersion ||
    campaign.cancelled_at
  ) {
    return {
      delivered: false,
      terminalReason: "Campaign was cancelled or replaced by a newer version."
    };
  }

  const current = await updateCampaign(
    input.campaignId,
    {
      status: "researching",
      current_step: `Research retry ${attempt} running`,
      thread_id: input.threadId,
      cancelled_at: null
    },
    input.runVersion
  );
  if (!current) {
    return {
      delivered: false,
      terminalReason: "Campaign changed before the retry could start."
    };
  }

  try {
    const result = await executeResearchRun({
      campaign: {
        id: input.campaignId,
        campaign_date: input.campaignDate,
        thread_id: input.threadId,
        run_version: input.runVersion
      },
      idempotencyKey: `${input.baseIdempotencyKey}:attempt:${attempt}`,
      workflowEventType: input.workflowEventType,
      ownerInstruction: input.ownerInstruction,
      suppressFailureMessages: true
    });
    if (result.telegramDelivered) return { delivered: true };
    if (result.duplicate && result.status === "claimed") {
      return {
        delivered: false,
        retrySameAttempt: claimLeaseIsCurrent(result.claimedAt)
      };
    }
  } catch {
    // The durable workflow records the failed attempt and schedules the next one.
  }

  const retryScheduled = await updateCampaign(
    input.campaignId,
    {
      status: "researching",
      current_step: `Research retry ${attempt + 1} scheduled`,
      error: null
    },
    input.runVersion
  );
  if (!retryScheduled) {
    return {
      delivered: false,
      terminalReason: "Campaign changed before the next retry could be scheduled."
    };
  }
  return { delivered: false };
}

export async function deliverResearchUntilTelegram(
  input: DurableResearchInput
): Promise<DurableResearchResult> {
  "use workflow";

  let resolved: ResolvedResearchInput | undefined;
  while (!resolved) {
    try {
      resolved = await initializeResearch(input);
    } catch {
      await sleep("30s");
    }
  }
  if (resolved.terminalReason) {
    return {
      delivered: false,
      attempts: 0,
      terminalReason: resolved.terminalReason
    };
  }

  let attempt = 1;
  while (true) {
    let result: Awaited<ReturnType<typeof runResearchAttempt>>;
    try {
      result = await runResearchAttempt(resolved, attempt);
    } catch {
      result = { delivered: false };
    }
    if (result.delivered) {
      return { delivered: true, attempts: attempt };
    }
    if (result.terminalReason) {
      return {
        delivered: false,
        attempts: attempt,
        terminalReason: result.terminalReason
      };
    }
    await sleep(researchRetryDelayMs(attempt));
    if (!result.retrySameAttempt) attempt += 1;
  }
}
