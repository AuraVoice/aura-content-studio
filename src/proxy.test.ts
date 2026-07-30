import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { proxy } from "./proxy";

describe("private route boundary", () => {
  it("redirects dashboard requests without a session cookie", () => {
    const response = proxy(new NextRequest("https://studio.example.com/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://studio.example.com/login"
    );
  });

  it("allows a cookie-bearing request through to secure server validation", () => {
    const request = new NextRequest("https://studio.example.com/dashboard", {
      headers: { cookie: `${SESSION_COOKIE}=opaque-session-token` }
    });
    const response = proxy(request);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows only the authenticated machine entry points without a browser cookie", () => {
    const cron = proxy(
      new NextRequest("https://studio.example.com/api/cron/daily")
    );
    const telegram = proxy(
      new NextRequest("https://studio.example.com/api/telegram/webhook")
    );
    const workflow = proxy(
      new NextRequest("https://studio.example.com/.well-known/workflow/v1/step")
    );
    expect(cron.headers.get("x-middleware-next")).toBe("1");
    expect(telegram.headers.get("x-middleware-next")).toBe("1");
    expect(workflow.headers.get("x-middleware-next")).toBe("1");
  });
});
