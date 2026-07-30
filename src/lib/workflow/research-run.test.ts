import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimWorkflowRun: vi.fn(),
  completeWorkflowRun: vi.fn(),
  saveMessage: vi.fn(),
  updateCampaign: vi.fn(),
  sendTelegramMessage: vi.fn(),
  invokeWorkflow: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  env: () => ({ TELEGRAM_ALLOWED_CHAT_ID: "owner-chat" })
}));

vi.mock("@/lib/repository", () => ({
  claimWorkflowRun: mocks.claimWorkflowRun,
  completeWorkflowRun: mocks.completeWorkflowRun,
  saveMessage: mocks.saveMessage,
  updateCampaign: mocks.updateCampaign
}));

vi.mock("@/lib/telegram/client", () => ({
  sendTelegramMessage: mocks.sendTelegramMessage
}));

vi.mock("./service", () => ({
  invokeWorkflow: mocks.invokeWorkflow
}));

import { executeResearchRun, manualResearchKey } from "./research-run";

const campaign = {
  id: "campaign-1",
  campaign_date: "2026-07-29",
  thread_id: "thread-1",
  run_version: 1
};

describe("research run delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claimWorkflowRun.mockResolvedValue({
      id: "run-1",
      status: "claimed",
      claimed_at: new Date().toISOString(),
      is_new: true
    });
    mocks.completeWorkflowRun.mockResolvedValue(undefined);
    mocks.saveMessage.mockResolvedValue(undefined);
    mocks.updateCampaign.mockResolvedValue(true);
  });

  it("creates a unique workflow key for each button request", () => {
    expect(manualResearchKey("campaign-1", "request-a")).toBe(
      "manual-research:campaign-1:request-a"
    );
    expect(manualResearchKey("campaign-1", "request-b")).not.toBe(
      manualResearchKey("campaign-1", "request-a")
    );
  });

  it("suppresses transient failure messages and reports no Telegram delivery", async () => {
    mocks.invokeWorkflow.mockResolvedValue({
      state: {
        status: "failed",
        error: "No current web research was available.",
        stale: false
      },
      messages: ["Research failed"],
      interrupted: false
    });

    const result = await executeResearchRun({
      campaign,
      idempotencyKey: "daily:2026-07-29:attempt:1",
      workflowEventType: "daily",
      suppressFailureMessages: true
    });

    expect(result.telegramDelivered).toBe(false);
    expect(result.status).toBe("failed");
    expect(mocks.sendTelegramMessage).not.toHaveBeenCalled();
    expect(mocks.completeWorkflowRun).toHaveBeenCalledWith(
      "run-1",
      "failed",
      expect.objectContaining({ failure: expect.any(Object) }),
      expect.any(String)
    );
  });

  it("completes only after Telegram confirms delivery", async () => {
    mocks.invokeWorkflow.mockResolvedValue({
      state: { status: "awaiting_idea", error: "", stale: false },
      messages: ["Three cited ideas"],
      interrupted: true
    });
    mocks.sendTelegramMessage.mockResolvedValue([{ message_id: 42 }]);

    const result = await executeResearchRun({
      campaign,
      idempotencyKey: "daily:2026-07-29:attempt:2",
      workflowEventType: "daily"
    });

    expect(result.telegramDelivered).toBe(true);
    expect(mocks.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ telegramMessageId: 42 })
    );
    expect(mocks.completeWorkflowRun).toHaveBeenCalledWith(
      "run-1",
      "completed",
      expect.objectContaining({ interrupted: true })
    );
  });

  it("rejects when Telegram delivery fails so the durable workflow can retry", async () => {
    mocks.invokeWorkflow.mockResolvedValue({
      state: { status: "awaiting_idea", error: "", stale: false },
      messages: ["Three cited ideas"],
      interrupted: true
    });
    mocks.sendTelegramMessage.mockRejectedValue(new Error("Telegram sendMessage failed"));

    await expect(
      executeResearchRun({
        campaign,
        idempotencyKey: "daily:2026-07-29:attempt:3",
        workflowEventType: "daily"
      })
    ).rejects.toThrow("workflow stopped before completion");
    expect(mocks.completeWorkflowRun).toHaveBeenCalledWith(
      "run-1",
      "failed",
      expect.objectContaining({ failure: expect.any(Object) }),
      expect.any(String)
    );
  });

  it("does not treat a duplicate failed claim as delivered", async () => {
    mocks.claimWorkflowRun.mockResolvedValue({
      id: "run-1",
      status: "failed",
      claimed_at: new Date().toISOString(),
      is_new: false
    });

    const result = await executeResearchRun({
      campaign,
      idempotencyKey: "daily:2026-07-29:attempt:4",
      workflowEventType: "daily"
    });

    expect(result.duplicate).toBe(true);
    expect(result.telegramDelivered).toBe(false);
    expect(mocks.invokeWorkflow).not.toHaveBeenCalled();
  });

  it("treats only a duplicate completed claim as already delivered", async () => {
    mocks.claimWorkflowRun.mockResolvedValue({
      id: "run-1",
      status: "completed",
      claimed_at: new Date().toISOString(),
      is_new: false
    });

    const result = await executeResearchRun({
      campaign,
      idempotencyKey: "daily:2026-07-29:attempt:5",
      workflowEventType: "daily"
    });

    expect(result.duplicate).toBe(true);
    expect(result.telegramDelivered).toBe(true);
    expect(mocks.invokeWorkflow).not.toHaveBeenCalled();
  });
});
