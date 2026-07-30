import { describe, expect, it } from "vitest";
import { MockSearchProvider, dailyTrendResearch } from "@/lib/search/provider";

describe("search provider abstraction", () => {
  it("returns normalized mock research without network access", async () => {
    const results = await dailyTrendResearch(new MockSearchProvider());
    expect(results.length).toBe(10);
    expect(results.every((result) => result.url.startsWith("https://"))).toBe(true);
  });

  it("preserves provider errors when every research query fails", async () => {
    const provider = {
      search: async () => {
        throw new Error("Brave Search failed with 429");
      }
    };

    await expect(dailyTrendResearch(provider)).rejects.toThrow(
      "Provider errors: Brave Search failed with 429"
    );
  });
});
