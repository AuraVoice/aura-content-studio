import { MemorySaver } from "@langchain/langgraph";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  trendScoutInvoke: vi.fn(),
  updateCampaign: vi.fn()
}));

vi.mock("./specialists", () => ({
  trendScoutSubgraph: { invoke: mocks.trendScoutInvoke },
  promptDirectorSubgraph: { invoke: vi.fn() },
  geminiCriticSubgraph: { invoke: vi.fn() }
}));

vi.mock("@/lib/repository", () => ({
  getLatestPrompt: vi.fn(),
  listIdeas: vi.fn(),
  listRecentHooks: vi.fn(),
  saveEvaluation: vi.fn(),
  savePrompt: vi.fn(),
  saveTrendIdeas: vi.fn(),
  updateCampaign: mocks.updateCampaign
}));

import { createOrchestrator } from "./orchestrator";

describe("orchestrator research failure handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateCampaign.mockResolvedValue(true);
  });

  it("turns a Trend Scout failure into a failed state and owner message", async () => {
    mocks.trendScoutInvoke.mockRejectedValue(
      new Error(
        "No current web research was available. Provider errors: Brave Search failed with 401"
      )
    );
    const graph = await createOrchestrator(new MemorySaver());

    const state = await graph.invoke(
      {
        campaignId: "campaign-1",
        campaignDate: "2026-07-29",
        threadId: "thread-1",
        runVersion: 1,
        eventType: "daily",
        ownerInstruction: "",
        outboundMessages: []
      },
      { configurable: { thread_id: "thread-1" } }
    );

    expect(state.status).toBe("failed");
    expect(state.error).toContain("Brave Search failed with 401");
    expect(state.outboundMessages).toEqual([
      expect.stringContaining("Aura research failed before any ideas were saved.")
    ]);
    expect(mocks.updateCampaign).toHaveBeenCalledWith(
      "campaign-1",
      expect.objectContaining({
        status: "failed",
        current_step: "Research failed"
      }),
      1
    );
  });
});
