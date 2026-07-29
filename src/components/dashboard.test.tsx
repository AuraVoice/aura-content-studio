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
    expect(html).not.toContain("South Asian");
  });
});
