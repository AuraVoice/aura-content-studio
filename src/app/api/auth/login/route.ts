import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  credentialsAreValid,
  loginIsAllowed,
  loginThrottleKey,
  recordLoginAttempt
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const ipKey = loginThrottleKey("ip", ip);
  const accountKey = loginThrottleKey("account", username || "empty");
  const [ipAllowed, accountAllowed] = await Promise.all([
    loginIsAllowed(ipKey),
    loginIsAllowed(accountKey)
  ]);
  const allowed = ipAllowed && accountAllowed;
  const valid = allowed && credentialsAreValid(username, password);

  await new Promise((resolve) => setTimeout(resolve, 350));
  if (allowed) {
    await Promise.all([
      recordLoginAttempt(ipKey, valid, 5),
      recordLoginAttempt(accountKey, valid, 25)
    ]);
  }
  if (!valid) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }
  await createSession({
    ipHash: ipKey,
    userAgent: request.headers.get("user-agent") ?? "unknown"
  });
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
