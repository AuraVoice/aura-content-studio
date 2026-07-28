import { env } from "@/lib/env";

const TELEGRAM_API = "https://api.telegram.org";

interface TelegramResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

async function telegram<T>(method: string, body?: unknown): Promise<T> {
  const response = await fetch(`${TELEGRAM_API}/bot${env().TELEGRAM_BOT_TOKEN}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000)
  });
  const payload = (await response.json()) as TelegramResponse<T>;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? `Telegram ${method} failed`);
  }
  return payload.result;
}

function splitMessage(text: string, max = 3900): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf("\n", max);
    if (cut < max * 0.6) cut = remaining.lastIndexOf(" ", max);
    if (cut < max * 0.6) cut = max;
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const sent = [];
  for (const part of splitMessage(text)) {
    sent.push(
      await telegram<{ message_id: number }>("sendMessage", {
        chat_id: chatId,
        text: part,
        link_preview_options: { is_disabled: true }
      })
    );
  }
  return sent;
}

export async function getTelegramFile(fileId: string): Promise<{
  file_path: string;
  file_size?: number;
}> {
  return telegram("getFile", { file_id: fileId });
}

export async function downloadTelegramFile(filePath: string): Promise<Uint8Array> {
  const response = await fetch(
    `${TELEGRAM_API}/file/bot${env().TELEGRAM_BOT_TOKEN}/${filePath}`,
    { signal: AbortSignal.timeout(120_000) }
  );
  if (!response.ok) throw new Error(`Telegram file download failed with ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function setTelegramWebhook() {
  const config = env();
  return telegram("setWebhook", {
    url: `${config.APP_URL}/api/telegram/webhook`,
    secret_token: config.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message"],
    drop_pending_updates: false
  });
}

