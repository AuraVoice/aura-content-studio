import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { handleTelegramUpdate } from "@/lib/telegram/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (
    request.headers.get("x-telegram-bot-api-secret-token") !==
    env().TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = await request.json();
  await handleTelegramUpdate(update);
  return NextResponse.json({ ok: true });
}

