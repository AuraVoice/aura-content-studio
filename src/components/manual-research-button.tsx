"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function ManualResearchButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function runResearch() {
    if (busy) return;
    setBusy(true);
    setStatus("Researching current signals...");
    try {
      const response = await fetch("/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: crypto.randomUUID() })
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Research run failed");
      setStatus("Research queued. It will retry until the result reaches Telegram.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Research run failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="manual-research">
      <button type="button" disabled={busy} onClick={() => void runResearch()}>
        <RefreshCw size={14} className={busy ? "spin" : ""} />
        {busy ? "Running research..." : "Run research now"}
      </button>
      <small aria-live="polite">
        {status || "Run as often as needed. A new pass replaces today’s ranked research ideas."}
      </small>
    </div>
  );
}
