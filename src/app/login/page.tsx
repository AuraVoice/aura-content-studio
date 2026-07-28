import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await verifySession()) redirect("/dashboard");
  const params = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="brand-lockup brand-lockup-light">
          <span className="aura-mark" aria-hidden="true">
            A
          </span>
          <span>Aura Content Studio</span>
        </div>
        <div className="login-statement">
          <p className="eyebrow eyebrow-light">Daily content operations</p>
          <h1>One clear idea.<br />Made ready to ship.</h1>
          <p>
            Trend research, production direction, and a ruthless credit-conscious review
            loop for Aura Desktop.
          </p>
        </div>
        <div className="login-note">
          <span className="signal-dot" />
          <span>Windows only. Private workspace.</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">Owner access</p>
          <h2>Welcome back.</h2>
          <p className="muted">Sign in to open today’s campaign desk.</p>
          <form action="/api/auth/login" method="post" className="login-form">
            <label>
              Username
              <input name="username" autoComplete="username" required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {params.error ? (
              <p className="form-error" role="alert">
                Sign-in failed. Wait a few minutes before trying again.
              </p>
            ) : null}
            <button type="submit" className="primary-button">
              Open the studio
              <span aria-hidden="true">↗</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
