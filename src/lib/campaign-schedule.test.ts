import { describe, expect, it } from "vitest";
import {
  campaignScheduleStatus,
  DAILY_CAMPAIGN_END_DATE,
  DAILY_CAMPAIGN_START_DATE
} from "./campaign-schedule";

describe("daily campaign schedule", () => {
  it("runs from July 29 through August 27, 2026", () => {
    expect(campaignScheduleStatus("2026-07-28")).toBe("before_campaign_window");
    expect(campaignScheduleStatus(DAILY_CAMPAIGN_START_DATE)).toBe("active");
    expect(campaignScheduleStatus(DAILY_CAMPAIGN_END_DATE)).toBe("active");
    expect(campaignScheduleStatus("2026-08-28")).toBe("after_campaign_window");
  });

  it("contains exactly 30 active calendar dates", () => {
    const firstDay = Date.parse(`${DAILY_CAMPAIGN_START_DATE}T00:00:00Z`);
    const dates = Array.from({ length: 32 }, (_, index) =>
      new Date(firstDay + index * 86_400_000).toISOString().slice(0, 10)
    );

    expect(dates.filter((date) => campaignScheduleStatus(date) === "active")).toHaveLength(
      30
    );
  });
});
