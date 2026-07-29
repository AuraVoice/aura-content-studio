import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "./dashboard";
import { demoSnapshot } from "@/lib/demo";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

describe("Dashboard production handoff", () => {
  it("renders three separately copyable prompts and a real video input", () => {
    const html = renderToStaticMarkup(<Dashboard snapshot={demoSnapshot} />);

    expect(html.match(/Copy clip [123]/g)).toHaveLength(3);
    expect(html).toContain('id="dashboard-video-upload"');
    expect(html).toContain("Upload video");
    expect(html).toContain("Only the three-clip structure is fixed");
    expect(html).toContain("Chat from the dashboard or Telegram");
    expect(html).toContain("Today’s cron");
    expect(html).toContain("Run research now");
    expect(html).toContain("Run as often as needed");
    expect(html).toContain("Windows productivity conversation");
    expect(html).toContain("Research and production log");
    expect(html).not.toContain("Studio sections");
    expect(html).not.toContain(">Private<");
    expect(html).not.toContain("South Asian");
  });

  it("shows a failed daily run instead of an unexplained empty dashboard", () => {
    const failed = {
      ...demoSnapshot,
      dataSource: "live" as const,
      status: "researching" as const,
      currentStep: "created",
      ideas: [],
      prompt: undefined,
      promptVersions: [],
      workflowRuns: [
        {
          id: "failed-run",
          eventType: "daily",
          status: "failed" as const,
          error: "Trend research failed",
          claimedAt: new Date().toISOString()
        }
      ]
    };
    const html = renderToStaticMarkup(<Dashboard snapshot={failed} />);
    expect(html).toContain("Trend research failed");
    expect(html).toContain("No research was finalized today");
    expect(html).toContain("No finalized prompt exists for today");
  });
});
