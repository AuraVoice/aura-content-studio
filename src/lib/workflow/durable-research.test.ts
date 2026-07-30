import { describe, expect, it } from "vitest";
import {
  CLAIM_LEASE_MS,
  claimLeaseIsCurrent,
  researchRetryDelayMs
} from "../../../workflows/research-delivery";

describe("durable research retry timing", () => {
  it("backs off from 30 seconds and caps retries at one hour", () => {
    expect(researchRetryDelayMs(1)).toBe(30_000);
    expect(researchRetryDelayMs(2)).toBe(60_000);
    expect(researchRetryDelayMs(8)).toBe(3_600_000);
    expect(researchRetryDelayMs(100)).toBe(3_600_000);
  });

  it("abandons an orphaned claim after its lease expires", () => {
    const now = Date.parse("2026-07-29T20:00:00.000Z");
    expect(
      claimLeaseIsCurrent(new Date(now - CLAIM_LEASE_MS + 1).toISOString(), now)
    ).toBe(true);
    expect(
      claimLeaseIsCurrent(new Date(now - CLAIM_LEASE_MS).toISOString(), now)
    ).toBe(false);
    expect(claimLeaseIsCurrent(undefined, now)).toBe(false);
  });
});
