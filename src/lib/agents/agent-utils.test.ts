import { describe, expect, it } from "vitest";
import { MockSearchProvider, dailyTrendResearch } from "@/lib/search/provider";

describe("search provider abstraction", () => {
  it("returns normalized mock research without network access", async () => {
    const results = await dailyTrendResearch(new MockSearchProvider());
    expect(results.length).toBe(10);
    expect(results.every((result) => result.url.startsWith("https://"))).toBe(true);
  });
});

