import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`))?.[1] ?? "";
}

describe("dashboard scrolling", () => {
  it("uses document scrolling instead of clipping a viewport-height shell", () => {
    expect(rule(".db-app")).toContain("min-height: 100dvh");
    expect(rule(".db-app")).not.toContain("height: 100vh");
    expect(rule(".db-app")).not.toContain("overflow: hidden");
    expect(rule(".workspace")).not.toContain("overflow: hidden");
    expect(rule(".content-scroll")).not.toContain("overflow-y: auto");
  });

  it("keeps the dashboard header accessible while the document scrolls", () => {
    expect(rule(".topbar")).toContain("position: sticky");
    expect(rule(".topbar")).toContain("top: 0");
  });
});
