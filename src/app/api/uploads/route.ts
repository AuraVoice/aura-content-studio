import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  claimWorkflowRun,
  completeWorkflowRun,
  createBrowserUploadToken,
  findUploadBySha,
  getActiveCampaign,
  getCampaign,
  getEvaluationByUploadId,
  getLatestPrompt,
  getPromptVersion,
  nextUploadReviewKey,
  saveBrowserUpload,
  saveMessage
} from "@/lib/repository";
import { signUploadIntent, verifyUploadIntent } from "@/lib/upload-intent";
import { invokeWorkflow } from "@/lib/workflow/service";

export const maxDuration = 300;

const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v"
};

interface UploadRequest {
  action?: string;
  fileName?: string;
  mimeType?: string;
  byteSize?: number;
  sha256?: string;
  intent?: string;
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function validate(body: UploadRequest): string | null {
  if (!body.fileName || body.fileName.length > 240) return "Choose a video file";
  if (!body.mimeType || !MIME_EXTENSIONS[body.mimeType]) {
    return "Upload an MP4, MOV, M4V, or WebM video";
  }
  if (!Number.isInteger(body.byteSize) || Number(body.byteSize) <= 0) {
    return "The selected video is empty";
  }
  if (Number(body.byteSize) > MAX_VIDEO_BYTES) {
    return "The selected video is larger than 250 MB";
  }
  if (!body.sha256 || !/^[a-f0-9]{64}$/.test(body.sha256)) {
    return "The video checksum is invalid";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    await requireSession();
  } catch {
    return invalid("Your studio session expired. Sign in again.", 401);
  }

  let body: UploadRequest;
  try {
    body = await request.json() as UploadRequest;
  } catch {
    return invalid("Invalid upload request");
  }
  const validationError = validate(body);
  if (body.action === "prepare") {
    if (validationError) return invalid(validationError);
    const campaign = await getActiveCampaign();
    if (!campaign) return invalid("There is no active campaign for this upload", 409);
    const campaignId = String(campaign.id);
    const prompt = await getLatestPrompt(campaignId);
    if (!prompt) return invalid("Create a prompt before uploading a video", 409);
    const existing = await findUploadBySha(campaignId, body.sha256!);
    if (existing) {
      const evaluated = await getEvaluationByUploadId(String(existing.id));
      if (evaluated) {
        return NextResponse.json({
          alreadyUploaded: true,
          reviewNeeded: false,
          uploadId: existing.id
        });
      }
      const intent = signUploadIntent({
        campaignId,
        runVersion: Number(campaign.run_version),
        promptVersion: Number(existing.prompt_version),
        storagePath: String(existing.storage_path),
        fileName: String(existing.file_name),
        mimeType: String(existing.mime_type),
        byteSize: Number(existing.byte_size),
        sha256: String(existing.sha256),
        expiresAt: Date.now() + 30 * 60 * 1000,
        existingUploadId: String(existing.id)
      });
      return NextResponse.json({
        alreadyUploaded: true,
        reviewNeeded: true,
        uploadId: existing.id,
        intent
      });
    }
    const extension = MIME_EXTENSIONS[body.mimeType!];
    const storagePath = `${campaignId}/browser/${randomUUID()}.${extension}`;
    const signed = await createBrowserUploadToken(storagePath);
    const intent = signUploadIntent({
      campaignId,
      runVersion: Number(campaign.run_version),
      promptVersion: prompt.version,
      storagePath,
      fileName: body.fileName!,
      mimeType: body.mimeType!,
      byteSize: body.byteSize!,
      sha256: body.sha256!,
      expiresAt: Date.now() + 30 * 60 * 1000
    });
    return NextResponse.json({
      alreadyUploaded: false,
      signedUrl: signed.signedUrl,
      intent
    });
  }

  if (body.action !== "complete") return invalid("Unknown upload action");
  if (!body.intent) return invalid("Upload authorization is missing");
  let intent;
  try {
    intent = verifyUploadIntent(body.intent);
  } catch (error) {
    return invalid(error instanceof Error ? error.message : "Upload authorization is invalid", 401);
  }
  const campaign = await getCampaign(intent.campaignId);
  if (
    Number(campaign.run_version) !== intent.runVersion ||
    campaign.cancelled_at
  ) {
    return invalid("The campaign changed while this video was uploading. Choose it again.", 409);
  }
  const prompt = await getPromptVersion(intent.campaignId, intent.promptVersion);
  if (!prompt) return invalid("The prompt used for this video no longer exists", 409);
  let upload = await findUploadBySha(intent.campaignId, intent.sha256);
  if (intent.existingUploadId) {
    if (!upload || String(upload.id) !== intent.existingUploadId) {
      return invalid("The original upload can no longer be reviewed", 409);
    }
  } else {
    upload = await saveBrowserUpload({
      campaignId: intent.campaignId,
      promptVersion: intent.promptVersion,
      storagePath: intent.storagePath,
      fileName: intent.fileName,
      mimeType: intent.mimeType,
      byteSize: intent.byteSize,
      sha256: intent.sha256
    });
  }
  if (!upload) return invalid("Uploaded video could not be found", 409);
  if (await getEvaluationByUploadId(String(upload.id))) {
    return NextResponse.json({ uploadId: upload.id, reviewStarted: false, reviewComplete: true });
  }
  const campaignId = intent.campaignId;
  const idempotencyKey = await nextUploadReviewKey(
    campaignId,
    intent.sha256,
    intent.promptVersion
  );
  const run = await claimWorkflowRun({
    key: idempotencyKey,
    campaignId,
    runVersion: intent.runVersion,
    eventType: "video_uploaded"
  });
  if (!run.is_new) {
    return NextResponse.json({ uploadId: upload.id, reviewStarted: false });
  }

  await saveMessage({
    campaignId,
    direction: "inbound",
    source: "dashboard",
    text: `Uploaded ${intent.fileName} from the dashboard for review.`
  });

  try {
    const result = await invokeWorkflow({
      campaignId,
      campaignDate: String(campaign.campaign_date),
      threadId: String(campaign.thread_id),
      runVersion: intent.runVersion,
      eventType: "video_uploaded",
      ownerInstruction: "Review this dashboard upload.",
      uploadId: String(upload.id)
    });
    for (const text of result.messages) {
      await saveMessage({
        campaignId,
        direction: "outbound",
        source: "orchestrator",
        text
      });
    }
    await completeWorkflowRun(run.id, result.state.stale ? "stale" : "completed", {
      status: result.state.status,
      interrupted: result.interrupted
    });
    return NextResponse.json({ uploadId: upload.id, reviewStarted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video review failed";
    await completeWorkflowRun(run.id, "failed", undefined, message);
    return NextResponse.json(
      {
        error: "The video was uploaded, but the critic could not finish. Refresh to see the upload.",
        uploadId: upload.id
      },
      { status: 500 }
    );
  }
}
