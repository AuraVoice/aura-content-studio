"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export function DashboardChat() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setStatus("Sending to Aura Studio...");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          requestId: crypto.randomUUID()
        })
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Chat request failed");
      setMessage("");
      setStatus("Delivered to the orchestrator and mirrored to Telegram");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Chat request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-chat">
      <textarea
        value={message}
        disabled={busy}
        maxLength={4000}
        placeholder="Ask for research, choose an idea, revise a prompt, or give the orchestrator an instruction..."
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
      />
      <div>
        <small aria-live="polite">{status || "Ctrl or Cmd + Enter to send"}</small>
        <button type="button" disabled={busy || !message.trim()} onClick={() => void submit()}>
          <Send size={15} />
          {busy ? "Working..." : "Send"}
        </button>
      </div>
    </div>
  );
}
