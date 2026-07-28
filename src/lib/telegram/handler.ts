import { env } from "@/lib/env";
import {
  cancelCampaign,
  claimDailyCampaign,
  claimWorkflowRun,
  completeWorkflowRun,
  getActiveCampaign,
  getLatestPrompt,
  saveMessage,
  saveUpload
} from "@/lib/repository";
import { invokeWorkflow } from "@/lib/workflow/service";
import {
  downloadTelegramFile,
  getTelegramFile,
  sendTelegramMessage
} from "./client";

interface TelegramMedia {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    caption?: string;
    video?: TelegramMedia;
    document?: TelegramMedia;
  };
}

function videoFrom(update: TelegramUpdate): TelegramMedia | undefined {
  const message = update.message;
  if (!message) return undefined;
  if (message.video) return message.video;
  if (message.document?.mime_type?.startsWith("video/")) return message.document;
  return undefined;
}

async function sendAndStore(campaignId: string, chatId: string, messages: string[]) {
  for (const text of messages) {
    const sent = await sendTelegramMessage(chatId, text);
    for (const message of sent) {
      await saveMessage({
        campaignId,
        telegramMessageId: message.message_id,
        direction: "outbound",
        source: "orchestrator",
        text
      });
    }
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message) return;
  const chatId = String(message.chat.id);
  if (chatId !== env().TELEGRAM_ALLOWED_CHAT_ID) {
    return;
  }

  let campaign = await getActiveCampaign();
  if (!campaign) campaign = await claimDailyCampaign();
  const campaignId = campaign.id as string;
  const accepted = await saveMessage({
    campaignId,
    telegramUpdateId: update.update_id,
    telegramMessageId: message.message_id,
    direction: "inbound",
    source: "telegram",
    text: message.text ?? message.caption ?? "[video upload]",
    payload: update
  });
  if (!accepted) return;

  const media = videoFrom(update);
  const eventType = media ? "video_uploaded" : "instruction";
  const idempotencyKey = `telegram:${update.update_id}`;
  const run = await claimWorkflowRun({
    key: idempotencyKey,
    campaignId,
    runVersion: Number(campaign.run_version),
    eventType
  });
  if (!run.is_new) return;

  try {
    const ownerText = message.text ?? message.caption ?? "";
    if (/\bcancel\b/i.test(ownerText) && !/\bskip\b/i.test(ownerText)) {
      await cancelCampaign(campaignId);
      await sendAndStore(campaignId, chatId, [
        "Campaign cancelled. Any agent result still in flight will be ignored."
      ]);
      await completeWorkflowRun(run.id, "completed", { status: "cancelled" });
      return;
    }
    let uploadId: string | undefined;
    if (media) {
      const prompt = await getLatestPrompt(campaignId);
      if (!prompt) {
        await sendAndStore(campaignId, chatId, [
          "I received the video, but there is no approved prompt to evaluate yet."
        ]);
        await completeWorkflowRun(run.id, "failed", undefined, "No prompt for upload");
        return;
      }
      const telegramFile = await getTelegramFile(media.file_id);
      const bytes = await downloadTelegramFile(telegramFile.file_path);
      const upload = await saveUpload({
        campaignId,
        promptVersion: prompt.version,
        telegramFileId: media.file_id,
        telegramFileUniqueId: media.file_unique_id,
        fileName: media.file_name ?? telegramFile.file_path.split("/").at(-1) ?? "upload.mp4",
        mimeType: media.mime_type ?? "video/mp4",
        bytes
      });
      uploadId = upload.id as string;
    }

    const result = await invokeWorkflow({
      campaignId,
      campaignDate: campaign.campaign_date as string,
      threadId: campaign.thread_id as string,
      runVersion: Number(campaign.run_version),
      eventType,
      ownerInstruction: message.text ?? message.caption ?? "",
      uploadId
    });
    await sendAndStore(campaignId, chatId, result.messages);
    await completeWorkflowRun(run.id, result.state.stale ? "stale" : "completed", {
      status: result.state.status,
      interrupted: result.interrupted
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Unknown Telegram workflow error";
    await completeWorkflowRun(run.id, "failed", undefined, text);
    await sendAndStore(campaignId, chatId, [
      "I hit a workflow error and did not spend any Higgsfield credits. Check the dashboard or Vercel logs, then send the instruction again."
    ]);
    throw error;
  }
}
