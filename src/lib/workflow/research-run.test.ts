import { describe, expect, it } from "vitest";
import { manualResearchKey } from "./research-run";

describe("manual research idempotency", () => {
  it("creates a unique workflow key for each button request", () => {
    expect(manualResearchKey("campaign-1", "request-a")).toBe(
      "manual-research:campaign-1:request-a"
    );
    expect(manualResearchKey("campaign-1", "request-b")).not.toBe(
      manualResearchKey("campaign-1", "request-a")
    );
  });
});
