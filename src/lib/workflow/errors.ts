import { StructuredOutputError } from "@/lib/ai/gemini";

export interface WorkflowFailure {
  code: string;
  message: string;
  technicalDetail: string;
  retryable: boolean;
}

export function describeWorkflowFailure(error: unknown): WorkflowFailure {
  const technicalDetail =
    error instanceof Error ? error.message : "Unknown workflow failure";

  if (
    error instanceof StructuredOutputError ||
    technicalDetail.includes("evidence index") ||
    technicalDetail.includes("evidenceIndex") ||
    technicalDetail.includes("source URL")
  ) {
    return {
      code: "RESEARCH_EVIDENCE_VALIDATION",
      message:
        "Trend Scout could not validate its source references. The run was stopped before saving unreliable research.",
      technicalDetail,
      retryable: true
    };
  }

  if (technicalDetail.includes("No current web research")) {
    return {
      code: "RESEARCH_UNAVAILABLE",
      message: technicalDetail,
      technicalDetail,
      retryable: true
    };
  }

  return {
    code: "WORKFLOW_FAILED",
    message: "The workflow stopped before completion. Open technical details for the recorded cause.",
    technicalDetail,
    retryable: true
  };
}
