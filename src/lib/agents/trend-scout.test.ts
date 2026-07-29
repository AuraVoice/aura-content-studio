import { describe, expect, it } from "vitest";
import { resolveEvidenceSources } from "./trend-scout";

const research = [
  {
    title: "Original title",
    url: "https://example.com/story?source=research",
    content: "Evidence",
    publishedAt: "2026-07-29"
  }
];

describe("Trend Scout evidence attribution", () => {
  it("uses the exact researched URL instead of trusting a model-written URL", () => {
    expect(
      resolveEvidenceSources(
        [{ evidenceIndex: 1, note: "Useful current signal" }],
        research
      )
    ).toEqual([
      {
        title: "Original title",
        url: "https://example.com/story?source=research",
        publishedAt: "2026-07-29",
        note: "Useful current signal"
      }
    ]);
  });

  it("rejects an evidence index that was not researched", () => {
    expect(() =>
      resolveEvidenceSources([{ evidenceIndex: 2, note: "Invented" }], research)
    ).toThrow("invalid or duplicate evidence index");
  });
});
