import { describe, expect, it } from "vitest";
import {
  signUploadIntent,
  verifyUploadIntent,
  type UploadIntent
} from "./upload-intent";

const payload: UploadIntent = {
  campaignId: "campaign",
  runVersion: 4,
  promptVersion: 2,
  storagePath: "campaign/browser/random.mp4",
  fileName: "video.mp4",
  mimeType: "video/mp4",
  byteSize: 123,
  sha256: "a".repeat(64),
  expiresAt: Date.now() + 60_000
};

describe("upload intent", () => {
  it("round trips pinned upload metadata", () => {
    const token = signUploadIntent(payload, "test-secret");
    expect(verifyUploadIntent(token, "test-secret")).toEqual(payload);
  });

  it("rejects tampering", () => {
    const token = signUploadIntent(payload, "test-secret");
    expect(() => verifyUploadIntent(`${token}x`, "test-secret")).toThrow(
      "Upload authorization is invalid"
    );
  });

  it("rejects expired authorization", () => {
    const token = signUploadIntent(
      { ...payload, expiresAt: Date.now() - 1 },
      "test-secret"
    );
    expect(() => verifyUploadIntent(token, "test-secret")).toThrow(
      "Upload authorization expired"
    );
  });
});
