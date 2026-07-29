import { describe, expect, it } from "vitest";
import { StructuredOutputError } from "@/lib/ai/gemini";
import { describeWorkflowFailure } from "./errors";

describe("workflow failure descriptions", () => {
  it("turns model evidence failures into a readable retryable record", () => {
    const failure = describeWorkflowFailure(
      new StructuredOutputError(3, new Error("evidenceIndex must be positive"))
    );

    expect(failure.code).toBe("RESEARCH_EVIDENCE_VALIDATION");
    expect(failure.retryable).toBe(true);
    expect(failure.message).not.toContain("evidenceIndex");
    expect(failure.technicalDetail).toContain("failed validation");
  });
});
