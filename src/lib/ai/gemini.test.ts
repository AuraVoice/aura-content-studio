import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn()
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mocks.generateContent
    };
  }
}));

vi.mock("@/lib/env", () => ({
  env: () => ({
    GEMINI_API_KEY: "test-key",
    GEMINI_TEXT_MODEL: "test-model"
  })
}));

import { generateStructured, StructuredOutputError } from "./gemini";

describe("generateStructured", () => {
  beforeEach(() => {
    mocks.generateContent.mockReset();
  });

  it("retries a schema-invalid response with validation guidance", async () => {
    mocks.generateContent
      .mockResolvedValueOnce({ text: JSON.stringify({ evidenceIndex: 0 }) })
      .mockResolvedValueOnce({ text: JSON.stringify({ evidenceIndex: 1 }) });

    const result = await generateStructured(
      z.object({ evidenceIndex: z.number().int().positive() }),
      "Return an evidence index.",
      { maxAttempts: 2 }
    );

    expect(result.evidenceIndex).toBe(1);
    expect(mocks.generateContent).toHaveBeenCalledTimes(2);
    expect(mocks.generateContent.mock.calls[1]?.[0].contents).toContain(
      "previous response was rejected"
    );
  });

  it("returns a stable workflow error after retries are exhausted", async () => {
    mocks.generateContent.mockResolvedValue({
      text: JSON.stringify({ evidenceIndex: 0 })
    });

    await expect(
      generateStructured(
        z.object({ evidenceIndex: z.number().int().positive() }),
        "Return an evidence index.",
        { maxAttempts: 2 }
      )
    ).rejects.toBeInstanceOf(StructuredOutputError);
  });
});
