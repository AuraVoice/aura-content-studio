import { describe, expect, it } from "vitest";
import { nextConfig } from "../next.config";

describe("security headers", () => {
  it("blocks indexing, framing, MIME sniffing, and browser feature access", async () => {
    const groups = await nextConfig.headers?.();
    const global = groups?.find((group) => group.source === "/(.*)");
    const headers = new Map(
      global?.headers.map((header) => [header.key, header.value])
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Robots-Tag")).toContain("noindex");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=");
  });

  it("prevents dashboard and media caching", async () => {
    const groups = await nextConfig.headers?.();
    for (const source of ["/dashboard/:path*", "/api/media/:path*"]) {
      const group = groups?.find((item) => item.source === source);
      expect(group?.headers).toContainEqual({
        key: "Cache-Control",
        value: "private, no-store, max-age=0"
      });
    }
  });
});
