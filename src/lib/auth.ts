import "server-only";
import { cookies } from "next/headers";
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";
import { SESSION_COOKIE } from "@/lib/auth-constants";

const SESSION_HOURS = 12;

function authKey(): Uint8Array {
  return scryptSync(
    env().STUDIO_PASSWORD,
    "aura-content-studio/auth-key/v2",
    32
  );
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function credentialFingerprint(): string {
  return createHash("sha256").update(authKey()).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function credentialsAreValid(username: string, password: string): boolean {
  const config = env();
  return (
    safeEqual(username, config.STUDIO_USERNAME) &&
    safeEqual(password, config.STUDIO_PASSWORD)
  );
}

export function loginThrottleKey(kind: "ip" | "account", value: string): string {
  return createHmac("sha256", authKey())
    .update(`${kind}:${value.toLowerCase()}`)
    .digest("hex");
}

export async function loginIsAllowed(keyHash: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("login_is_allowed", {
    p_key_hash: keyHash
  });
  if (error) throw new Error(error.message);
  return data === true;
}

export async function recordLoginAttempt(
  keyHash: string,
  success: boolean,
  limit: number
): Promise<void> {
  const { error } = await supabaseAdmin().rpc("record_login_attempt", {
    p_key_hash: keyHash,
    p_success: success,
    p_limit: limit,
    p_lock_minutes: 15
  });
  if (error) throw new Error(error.message);
}

export async function createSession(input: {
  ipHash: string;
  userAgent: string;
}): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await supabaseAdmin()
    .from("studio_sessions")
    .delete()
    .or(`expires_at.lt.${new Date().toISOString()},revoked_at.not.is.null`);
  const { error } = await supabaseAdmin().from("studio_sessions").insert({
    token_hash: tokenHash(token),
    username: env().STUDIO_USERNAME,
    credential_fingerprint: credentialFingerprint(),
    ip_hash: input.ipHash,
    user_agent: input.userAgent.slice(0, 500),
    expires_at: expiresAt.toISOString()
  });
  if (error) throw new Error(error.message);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await supabaseAdmin()
      .from("studio_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", tokenHash(token))
      .is("revoked_at", null);
  }
  store.delete(SESSION_COOKIE);
}

export async function verifySession(): Promise<boolean> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return false;
    const { data, error } = await supabaseAdmin()
      .from("studio_sessions")
      .select("id")
      .eq("token_hash", tokenHash(token))
      .eq("username", env().STUDIO_USERNAME)
      .eq("credential_fingerprint", credentialFingerprint())
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}

export async function requireSession(): Promise<void> {
  if (!(await verifySession())) {
    throw new Error("UNAUTHORIZED");
  }
}
