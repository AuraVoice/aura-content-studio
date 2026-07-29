import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export interface UploadIntent {
  campaignId: string;
  runVersion: number;
  promptVersion: number;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  expiresAt: number;
  existingUploadId?: string;
}

function secret(): string {
  return `aura-content-studio/upload-intent/v1/${env().STUDIO_PASSWORD}`;
}

export function signUploadIntent(
  payload: UploadIntent,
  signingSecret = secret()
): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", signingSecret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyUploadIntent(
  token: string,
  signingSecret = secret()
): UploadIntent {
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) {
    throw new Error("Upload authorization is invalid");
  }
  const expectedSignature = createHmac("sha256", signingSecret)
    .update(encoded)
    .digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error("Upload authorization is invalid");
  }
  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8")
  ) as UploadIntent;
  if (!payload.expiresAt || payload.expiresAt < Date.now()) {
    throw new Error("Upload authorization expired. Choose the video again.");
  }
  return payload;
}
