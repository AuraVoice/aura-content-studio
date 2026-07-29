import { createHash } from "node:crypto";
import { env, hasCoreEnvironment } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";
import { demoSnapshot } from "@/lib/demo";
import type {
  CampaignSnapshot,
  CampaignStatus,
  CampaignDayLog,
  CriticEvaluation,
  PromptPackage,
  StudioMessage,
  TrendIdea,
  WorkflowRunLog
} from "@/lib/types";

type Row = Record<string, unknown>;

function assertData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Expected database result");
  return data;
}

export function localDate(timeZone = process.env.STUDIO_TIMEZONE ?? "America/Los_Angeles") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export async function claimDailyCampaign(date = localDate()) {
  const { data, error } = await supabaseAdmin().rpc("claim_daily_campaign", {
    p_date: date
  });
  return assertData(data as Row, error);
}

export async function getCampaign(campaignId: string): Promise<Row> {
  const { data, error } = await supabaseAdmin()
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  return assertData(data as Row, error);
}

export async function getCampaignByThread(threadId: string): Promise<Row | null> {
  const { data, error } = await supabaseAdmin()
    .from("campaigns")
    .select("*")
    .eq("thread_id", threadId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}

export async function getActiveCampaign(): Promise<Row | null> {
  const { data, error } = await supabaseAdmin()
    .from("campaigns")
    .select("*")
    .not("status", "in", '("approved","skipped","cancelled")')
    .order("campaign_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}

export async function updateCampaign(
  campaignId: string,
  values: Record<string, unknown>,
  expectedRunVersion?: number
): Promise<boolean> {
  let query = supabaseAdmin().from("campaigns").update(values).eq("id", campaignId);
  if (expectedRunVersion !== undefined) {
    query = query.eq("run_version", expectedRunVersion);
  }
  const { data, error } = await query.select("id");
  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

export async function cancelCampaign(campaignId: string): Promise<void> {
  const campaign = await getCampaign(campaignId);
  const nextVersion = Number(campaign.run_version) + 1;
  await updateCampaign(campaignId, {
    status: "cancelled",
    current_step: "Cancelled by owner",
    run_version: nextVersion,
    cancelled_at: new Date().toISOString()
  });
}

export async function claimWorkflowRun(input: {
  key: string;
  campaignId: string;
  runVersion: number;
  eventType: string;
}): Promise<{ id: string; status: string; claimed_at: string; is_new: boolean }> {
  const { data, error } = await supabaseAdmin().rpc("claim_workflow_run", {
    p_key: input.key,
    p_campaign_id: input.campaignId,
    p_run_version: input.runVersion,
    p_event_type: input.eventType
  });
  return assertData(data, error) as {
    id: string;
    status: string;
    claimed_at: string;
    is_new: boolean;
  };
}

export async function completeWorkflowRun(
  id: string,
  status: "completed" | "failed" | "stale",
  result?: unknown,
  errorText?: string
) {
  const { error } = await supabaseAdmin()
    .from("workflow_runs")
    .update({
      status,
      result: result ?? null,
      error: errorText ?? null,
      completed_at: new Date().toISOString()
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveTrendIdeas(
  campaignId: string,
  ideas: TrendIdea[],
  expectedRunVersion: number
): Promise<TrendIdea[]> {
  const campaign = await getCampaign(campaignId);
  if (Number(campaign.run_version) !== expectedRunVersion || campaign.cancelled_at) {
    return [];
  }
  const rows = ideas.map((idea) => ({
    campaign_id: campaignId,
    rank: idea.rank,
    concept: idea.concept,
    hook: idea.hook,
    format: idea.format,
    platform: idea.platform,
    aura_relevance: idea.auraRelevance,
    sources: idea.sources,
    shelf_life: idea.shelfLife,
    higgsfield_needed: idea.higgsfieldNeeded,
    generation_risk: idea.generationRisk,
    risk_reason: idea.riskReason
  }));
  const { data, error } = await supabaseAdmin()
    .from("trend_ideas")
    .upsert(rows, { onConflict: "campaign_id,rank" })
    .select("*")
    .order("rank");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapIdea);
}

export async function listIdeas(campaignId: string): Promise<TrendIdea[]> {
  const { data, error } = await supabaseAdmin()
    .from("trend_ideas")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("rank");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapIdea);
}

export async function savePrompt(
  campaignId: string,
  ideaId: string | undefined,
  prompt: PromptPackage,
  changeRequest: string | undefined,
  expectedRunVersion: number
): Promise<PromptPackage | null> {
  const campaign = await getCampaign(campaignId);
  if (Number(campaign.run_version) !== expectedRunVersion || campaign.cancelled_at) {
    return null;
  }
  const row = {
    campaign_id: campaignId,
    idea_id: ideaId ?? null,
    version: prompt.version,
    parent_version: prompt.version > 1 ? prompt.version - 1 : null,
    change_request: changeRequest ?? null,
    final_concept: prompt.finalConcept,
    hook: prompt.hook,
    spoken_script: prompt.spokenScript,
    shots: prompt.clips,
    higgsfield_prompt: prompt.higgsfieldPrompt,
    negative_constraints: prompt.negativeConstraints,
    duration_seconds: prompt.durationSeconds,
    recommended_model: prompt.recommendedModel,
    failure_points: prompt.failurePoints,
    locked_attributes: prompt.lockedAttributes,
    validation: prompt.validation
  };
  const { data, error } = await supabaseAdmin()
    .from("prompt_versions")
    .upsert(row, { onConflict: "campaign_id,version" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await updateCampaign(
    campaignId,
    { current_prompt_version: prompt.version },
    expectedRunVersion
  );
  return mapPrompt(data);
}

export async function getLatestPrompt(campaignId: string): Promise<PromptPackage | null> {
  const { data, error } = await supabaseAdmin()
    .from("prompt_versions")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPrompt(data) : null;
}

export async function getPromptVersion(
  campaignId: string,
  version: number
): Promise<PromptPackage | null> {
  const { data, error } = await supabaseAdmin()
    .from("prompt_versions")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("version", version)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPrompt(data) : null;
}

export async function listRecentHooks(limit = 20): Promise<string[]> {
  const { data, error } = await supabaseAdmin()
    .from("prompt_versions")
    .select("hook")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.hook as string);
}

export async function saveMessage(input: {
  campaignId?: string;
  telegramUpdateId?: number;
  telegramMessageId?: number;
  direction: StudioMessage["direction"];
  source: StudioMessage["source"];
  text: string;
  payload?: unknown;
}): Promise<boolean> {
  const { error } = await supabaseAdmin().from("studio_messages").insert({
    campaign_id: input.campaignId ?? null,
    telegram_update_id: input.telegramUpdateId ?? null,
    telegram_message_id: input.telegramMessageId ?? null,
    direction: input.direction,
    source: input.source,
    text: input.text,
    payload: input.payload ?? {}
  });
  if (error?.code === "23505") return false;
  if (error) throw new Error(error.message);
  return true;
}

export async function saveUpload(input: {
  campaignId: string;
  promptVersion: number;
  telegramFileId?: string;
  telegramFileUniqueId?: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}) {
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  const extension = input.fileName.split(".").pop()?.toLowerCase() || "mp4";
  const storagePath = `${input.campaignId}/${sha256.slice(0, 16)}.${extension}`;
  const bucket = env().SUPABASE_STORAGE_BUCKET;
  const { error: storageError } = await supabaseAdmin().storage
    .from(bucket)
    .upload(storagePath, input.bytes, {
      contentType: input.mimeType,
      upsert: false
    });
  if (storageError && !storageError.message.toLowerCase().includes("already exists")) {
    throw new Error(storageError.message);
  }
  const { data, error } = await supabaseAdmin()
    .from("media_uploads")
    .upsert(
      {
        campaign_id: input.campaignId,
        prompt_version: input.promptVersion,
        telegram_file_id: input.telegramFileId ?? null,
        telegram_file_unique_id: input.telegramFileUniqueId ?? null,
        storage_path: storagePath,
        file_name: input.fileName,
        mime_type: input.mimeType,
        byte_size: input.bytes.byteLength,
        sha256
      },
      { onConflict: "campaign_id,sha256" }
    )
    .select("*")
    .single();
  return assertData(data, error);
}

export async function findUploadBySha(
  campaignId: string,
  sha256: string
): Promise<Row | null> {
  const { data, error } = await supabaseAdmin()
    .from("media_uploads")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("sha256", sha256)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}

export async function createBrowserUploadToken(storagePath: string): Promise<{
  path: string;
  token: string;
  signedUrl: string;
}> {
  const { data, error } = await supabaseAdmin().storage
    .from(env().SUPABASE_STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function saveBrowserUpload(input: {
  campaignId: string;
  promptVersion: number;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
}) {
  const bucket = supabaseAdmin().storage.from(env().SUPABASE_STORAGE_BUCKET);
  const { data: object, error: objectError } = await bucket
    .info(input.storagePath);
  if (objectError || !object) {
    throw new Error(objectError?.message ?? "Uploaded video was not found in storage");
  }
  if (object.size !== input.byteSize) {
    throw new Error("Uploaded video size does not match the selected file");
  }
  if (object.contentType && object.contentType !== input.mimeType) {
    throw new Error("Uploaded video type does not match the selected file");
  }
  const { data: blob, error: downloadError } = await bucket.download(input.storagePath);
  if (downloadError || !blob) {
    throw new Error(downloadError?.message ?? "Uploaded video could not be verified");
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const verifiedSha = createHash("sha256").update(bytes).digest("hex");
  if (verifiedSha !== input.sha256) {
    await bucket.remove([input.storagePath]);
    throw new Error("Uploaded video checksum does not match the selected file");
  }
  const existing = await findUploadBySha(input.campaignId, verifiedSha);
  if (existing) {
    if (existing.storage_path !== input.storagePath) {
      await bucket.remove([input.storagePath]);
    }
    return existing;
  }
  const { data, error } = await supabaseAdmin()
    .from("media_uploads")
    .insert({
      campaign_id: input.campaignId,
      prompt_version: input.promptVersion,
      telegram_file_id: null,
      telegram_file_unique_id: null,
      storage_path: input.storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType,
      byte_size: input.byteSize,
      sha256: verifiedSha
    })
    .select("*")
    .single();
  if (error?.code === "23505") {
    await bucket.remove([input.storagePath]);
    const raced = await findUploadBySha(input.campaignId, verifiedSha);
    if (raced) return raced;
  }
  return assertData(data, error);
}

export async function getEvaluationByUploadId(uploadId: string): Promise<Row | null> {
  const { data, error } = await supabaseAdmin()
    .from("evaluations")
    .select("*")
    .eq("upload_id", uploadId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}

export async function nextUploadReviewKey(
  campaignId: string,
  sha256: string,
  promptVersion: number
): Promise<string> {
  const prefix = `dashboard-review:${campaignId}:${sha256}:${promptVersion}:`;
  const { data, error } = await supabaseAdmin()
    .from("workflow_runs")
    .select("idempotency_key,status,claimed_at")
    .like("idempotency_key", `${prefix}%`)
    .order("claimed_at", { ascending: false });
  if (error) throw new Error(error.message);
  const latest = data?.[0];
  const claimIsFresh =
    latest?.status === "claimed" &&
    Date.now() - new Date(String(latest.claimed_at)).getTime() < 10 * 60 * 1000;
  if (claimIsFresh) return String(latest.idempotency_key);
  return `${prefix}${(data?.length ?? 0) + 1}`;
}

export async function downloadUpload(uploadId: string): Promise<{
  row: Row;
  bytes: Uint8Array;
}> {
  const { data: row, error } = await supabaseAdmin()
    .from("media_uploads")
    .select("*")
    .eq("id", uploadId)
    .single();
  assertData(row, error);
  const { data, error: downloadError } = await supabaseAdmin().storage
    .from(env().SUPABASE_STORAGE_BUCKET)
    .download(row.storage_path);
  if (downloadError) throw new Error(downloadError.message);
  return { row, bytes: new Uint8Array(await data.arrayBuffer()) };
}

export async function saveEvaluation(
  campaignId: string,
  uploadId: string,
  promptVersion: number,
  evaluation: CriticEvaluation
) {
  const { data, error } = await supabaseAdmin()
    .from("evaluations")
    .upsert(
      {
        campaign_id: campaignId,
        upload_id: uploadId,
        prompt_version: promptVersion,
        verdict: evaluation.verdict,
        summary: evaluation.summary,
        issues: evaluation.issues,
        credit_recommendation: evaluation.creditRecommendation,
        worth_another_generation: evaluation.worthAnotherGeneration,
        cheaper_fixes: evaluation.cheaperFixes,
        regenerate_only: evaluation.regenerateOnly,
        locked_attributes_to_preserve: evaluation.lockedAttributesToPreserve,
        raw_response: evaluation
      },
      { onConflict: "upload_id" }
    )
    .select("*")
    .single();
  return assertData(data, error);
}

export async function getDashboardSnapshot(): Promise<CampaignSnapshot> {
  if (!hasCoreEnvironment()) return demoSnapshot;
  const { data: campaigns, error } = await supabaseAdmin()
    .from("campaigns")
    .select("*")
    .order("campaign_date", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  if (!campaigns?.length) return demoSnapshot;
  const campaign = campaigns[0];
  const campaignIds = campaigns.map((item) => String(item.id));

  const [
    ideasResult,
    promptsResult,
    uploadsResult,
    evaluationsResult,
    messagesResult,
    workflowRunsResult
  ] = await Promise.all([
      supabaseAdmin()
        .from("trend_ideas")
        .select("*")
        .in("campaign_id", campaignIds)
        .order("rank"),
      supabaseAdmin()
        .from("prompt_versions")
        .select("*")
        .in("campaign_id", campaignIds)
        .order("version", { ascending: false }),
      supabaseAdmin()
        .from("media_uploads")
        .select("*")
        .eq("campaign_id", campaign.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin()
        .from("evaluations")
        .select("*")
        .eq("campaign_id", campaign.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin()
        .from("studio_messages")
        .select("*")
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: true }),
      supabaseAdmin()
        .from("workflow_runs")
        .select("*")
        .in("campaign_id", campaignIds)
        .order("claimed_at", { ascending: false })
    ]);
  for (const result of [
    ideasResult,
    promptsResult,
    uploadsResult,
    evaluationsResult,
    messagesResult,
    workflowRunsResult
  ]) {
    if (result.error) throw new Error(result.error.message);
  }
  const currentId = String(campaign.id);
  const currentIdeaRows = (ideasResult.data ?? []).filter(
    (row) => String(row.campaign_id) === currentId
  );
  const currentPromptRows = (promptsResult.data ?? []).filter(
    (row) => String(row.campaign_id) === currentId
  );
  const currentMessageRows = (messagesResult.data ?? []).filter(
    (row) => String(row.campaign_id) === currentId
  );
  const currentRunRows = (workflowRunsResult.data ?? []).filter(
    (row) => String(row.campaign_id) === currentId
  );
  const ideas = currentIdeaRows.map(mapIdea);
  const prompts = currentPromptRows.map(mapPrompt);
  const messages = currentMessageRows.map(mapMessage);
  const workflowRuns = currentRunRows.map(mapWorkflowRun);
  const uploadRow = uploadsResult.data?.[0];
  const evaluationRow = uploadRow
    ? evaluationsResult.data?.find((evaluation) => evaluation.upload_id === uploadRow.id)
    : undefined;
  return {
    dataSource: "live",
    id: campaign.id,
    campaignDate: campaign.campaign_date,
    status: campaign.status as CampaignStatus,
    currentStep: campaign.current_step,
    runVersion: campaign.run_version,
    ideas,
    selectedIdea: ideas.find((idea) => idea.id === campaign.selected_idea_id),
    prompt: prompts[0],
    promptVersions: prompts,
    workflowRuns,
    days: campaigns.map((day) => {
      const dayId = String(day.id);
      return {
        id: dayId,
        campaignDate: String(day.campaign_date),
        status: day.status as CampaignStatus,
        currentStep: String(day.current_step),
        error: day.error ? String(day.error) : undefined,
        ideas: (ideasResult.data ?? [])
          .filter((row) => String(row.campaign_id) === dayId)
          .map(mapIdea),
        prompts: (promptsResult.data ?? [])
          .filter((row) => String(row.campaign_id) === dayId)
          .map(mapPrompt),
        workflowRuns: (workflowRunsResult.data ?? [])
          .filter((row) => String(row.campaign_id) === dayId)
          .map(mapWorkflowRun),
        messages: (messagesResult.data ?? [])
          .filter((row) => String(row.campaign_id) === dayId)
          .map(mapMessage)
      } satisfies CampaignDayLog;
    }),
    telegramDeliveryCount: messages.filter(
      (message) => message.telegramMessageId !== undefined
    ).length,
    lastTelegramDeliveryAt: messages
      .filter((message) => message.telegramMessageId !== undefined)
      .at(-1)?.createdAt,
    upload: uploadRow
      ? {
          id: uploadRow.id,
          fileName: uploadRow.file_name,
          mediaUrl: `/api/media/${uploadRow.id}`,
          createdAt: uploadRow.created_at
        }
      : undefined,
    evaluation: evaluationRow ? mapEvaluation(evaluationRow) : undefined,
    attempts: prompts.map((prompt, index) => ({
      version: prompt.version,
      label:
        (currentPromptRows[index]?.change_request as string | null) ??
        (prompt.version === 1 ? "Initial direction" : `Revision ${prompt.version}`),
      status: index === 0 ? "Current" : "Superseded",
        createdAt: currentPromptRows[index]?.created_at as string
    })),
    messages
  };
}

function mapMessage(row: Row): StudioMessage {
  return {
    id: row.id as string,
    direction: row.direction as StudioMessage["direction"],
    source: row.source as StudioMessage["source"],
    text: row.text as string,
    createdAt: row.created_at as string,
    telegramMessageId:
      row.telegram_message_id === null || row.telegram_message_id === undefined
        ? undefined
        : Number(row.telegram_message_id)
  };
}

function mapWorkflowRun(row: Row): WorkflowRunLog {
  return {
    id: String(row.id),
    eventType: String(row.event_type),
    status: row.status as WorkflowRunLog["status"],
    error: row.error ? String(row.error) : undefined,
    claimedAt: String(row.claimed_at),
    completedAt: row.completed_at ? String(row.completed_at) : undefined
  };
}

function mapIdea(row: Row): TrendIdea {
  return {
    id: row.id as string,
    rank: row.rank as 1 | 2 | 3,
    concept: row.concept as string,
    hook: row.hook as string,
    format: row.format as TrendIdea["format"],
    platform: row.platform as TrendIdea["platform"],
    auraRelevance: row.aura_relevance as string,
    sources: row.sources as TrendIdea["sources"],
    shelfLife: row.shelf_life as TrendIdea["shelfLife"],
    higgsfieldNeeded: row.higgsfield_needed as boolean,
    generationRisk: row.generation_risk as TrendIdea["generationRisk"],
    riskReason: row.risk_reason as string
  };
}

function mapPrompt(row: Row): PromptPackage {
  const stored = row.shots as unknown;
  const clips = Array.isArray(stored) && stored.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "clipNumber" in item &&
      "higgsfieldPrompt" in item
  )
    ? stored as PromptPackage["clips"]
    : legacyClips(row, Array.isArray(stored) ? stored : []);
  return {
    id: row.id as string,
    version: row.version as number,
    finalConcept: row.final_concept as string,
    hook: row.hook as string,
    spokenScript: row.spoken_script as string,
    clips,
    higgsfieldPrompt: row.higgsfield_prompt as string,
    negativeConstraints: row.negative_constraints as string[],
    durationSeconds: row.duration_seconds as number,
    recommendedModel: row.recommended_model as string,
    failurePoints: row.failure_points as string[],
    lockedAttributes: { clipCount: 3 },
    validation: row.validation as PromptPackage["validation"]
  };
}

function legacyClips(row: Row, storedShots: unknown[]): PromptPackage["clips"] {
  const fallbackShot = {
    startSecond: 0,
    endSecond: Number(row.duration_seconds),
    visual: "Legacy production direction",
    dialogue: String(row.spoken_script),
    camera: "Legacy camera direction"
  };
  const source = storedShots.length ? storedShots : [fallbackShot];
  return [0, 1, 2].map((index) => {
    const shot = source[Math.min(index, source.length - 1)] as PromptPackage["clips"][number]["shots"][number];
    const durationSeconds = Math.max(
      1,
      Math.round(Number(shot.endSecond) - Number(shot.startSecond))
    );
    const spokenScript = String(shot.dialogue || row.spoken_script);
    return {
      clipNumber: (index + 1) as 1 | 2 | 3,
      purpose: `Legacy clip ${index + 1}. Regenerate this prompt to use the current 10 to 12 second format.`,
      durationSeconds,
      spokenScript,
      estimatedSpokenSeconds: Math.ceil(
        spokenScript.trim().split(/\s+/).filter(Boolean).length / 2.35
      ),
      wordCount: spokenScript.trim().split(/\s+/).filter(Boolean).length,
      higgsfieldPrompt: `${String(row.higgsfield_prompt)} Clip ${index + 1}: ${String(shot.visual)} Camera: ${String(shot.camera)}`,
      continuityIn:
        index === 0
          ? "Legacy prompt has no start-frame direction."
          : `Continue from legacy clip ${index}.`,
      continuityOut:
        index === 2
          ? "Finish on a clean final frame."
          : `Create a clean final frame for legacy clip ${index + 2}.`,
      shots: [{ ...shot, startSecond: 0, endSecond: durationSeconds }]
    };
  });
}

function mapEvaluation(row: Row): CriticEvaluation {
  return {
    verdict: row.verdict as CriticEvaluation["verdict"],
    summary: row.summary as string,
    issues: row.issues as CriticEvaluation["issues"],
    creditRecommendation: row.credit_recommendation as string,
    worthAnotherGeneration: row.worth_another_generation as boolean,
    cheaperFixes: row.cheaper_fixes as string[],
    regenerateOnly: row.regenerate_only as string[],
    lockedAttributesToPreserve: row.locked_attributes_to_preserve as string[]
  };
}
