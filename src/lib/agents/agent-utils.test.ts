import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: () => ({
    BRAVE_SEARCH_API_KEY: "test-brave-key",
    SEARCH_PROVIDER: "brave"
  })
}));

import {
  BraveSearchProvider,
  MockSearchProvider,
  dailyTrendResearch
} from "@/lib/search/provider";
import { runTrendScout } from "./trend-scout";

describe("search provider abstraction", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns normalized mock research without network access", async () => {
    const results = await dailyTrendResearch(new MockSearchProvider());
    expect(results.length).toBe(10);
    expect(results.every((result) => result.url.startsWith("https://"))).toBe(true);
  });

  it("returns no research instead of aborting when every query is rate limited", async () => {
    const provider = {
      search: async () => {
        throw new Error("Brave Search failed with 429");
      }
    };

    await expect(dailyTrendResearch(provider)).resolves.toEqual([]);
  });

  it("continues with safe evergreen ideas when search is unavailable", async () => {
    const provider = {
      search: async () => {
        throw new Error("Brave Search failed with 429");
      }
    };

    const ideas = await runTrendScout(provider, "Keep it creator-led");
    expect(ideas).toHaveLength(3);
    expect(ideas.map((idea) => idea.rank)).toEqual([1, 2, 3]);
    expect(ideas.every((idea) => idea.sources.length === 0)).toBe(true);
    expect(ideas.every((idea) => idea.auraRelevance.includes("Windows"))).toBe(true);
  });

  it("paces Brave requests and retries a 429 response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("", {
          status: 429,
          headers: { "retry-after": "0" }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            web: {
              results: [
                {
                  title: "Current result",
                  url: "https://example.com/current",
                  description: "Useful current evidence"
                }
              ]
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const resultPromise = new BraveSearchProvider().search("Aura Windows");
    await vi.runAllTimersAsync();
    const results = await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(1);
  });
});
