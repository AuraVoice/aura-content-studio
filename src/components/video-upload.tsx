"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm"
};

export function VideoUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    setStatus("Checking video...");
    try {
      if (file.size > MAX_VIDEO_BYTES) {
        throw new Error("The selected video is larger than 250 MB");
      }
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      const mimeType = file.type || MIME_BY_EXTENSION[extension] || "";
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const sha256 = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const metadata = {
        fileName: file.name,
        mimeType,
        byteSize: file.size,
        sha256
      };
      const prepareResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prepare", ...metadata })
      });
      const prepared = await prepareResponse.json() as {
        error?: string;
        alreadyUploaded?: boolean;
        reviewNeeded?: boolean;
        signedUrl?: string;
        intent?: string;
      };
      if (!prepareResponse.ok) throw new Error(prepared.error || "Could not prepare upload");
      if (!prepared.alreadyUploaded) {
        if (!prepared.signedUrl || !prepared.intent) {
          throw new Error("Upload destination was not returned");
        }
        setStatus("Uploading directly to private storage...");
        const uploadBody = new FormData();
        uploadBody.append("cacheControl", "3600");
        uploadBody.append("", file);
        const storageResponse = await fetch(prepared.signedUrl, {
          method: "PUT",
          headers: { "x-upsert": "false" },
          body: uploadBody
        });
        if (!storageResponse.ok) {
          throw new Error("Private storage rejected the video upload");
        }
      }
      if (!prepared.alreadyUploaded || prepared.reviewNeeded) {
        if (!prepared.intent) throw new Error("Review authorization was not returned");
        setStatus(
          prepared.alreadyUploaded
            ? "Video found. Retrying critic review..."
            : "Upload complete. Starting critic review..."
        );
        const completeResponse = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", intent: prepared.intent })
        });
        const completed = await completeResponse.json() as {
          error?: string;
          reviewStarted?: boolean;
          reviewComplete?: boolean;
        };
        if (!completeResponse.ok) {
          throw new Error(completed.error || "The video uploaded, but review could not start");
        }
        setStatus(
          completed.reviewComplete
            ? "Video and review ready"
            : completed.reviewStarted
              ? "Video ready. Critic review complete."
              : "Video ready. Critic review is already running."
        );
      } else {
        setStatus("Video and review already available");
      }
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="upload-control">
      <input
        ref={inputRef}
        id="dashboard-video-upload"
        type="file"
        accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <button
        className="upload-button"
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud size={15} />
        {busy ? "Uploading..." : "Upload video"}
      </button>
      <small aria-live="polite">{status || "MP4, MOV, M4V, or WebM · up to 250 MB"}</small>
    </div>
  );
}
