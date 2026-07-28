# Aura Content Studio

Aura Content Studio is a private daily marketing workspace for Aura Desktop, the Windows application only. A LangGraph orchestrator researches current trends, asks for idea approval in Telegram, prepares a production-ready Higgsfield direction, and reviews uploaded video with Gemini. Higgsfield generation is always manual.

The owner experience is username and password only. A successful login creates a random opaque session stored in Postgres. The browser receives an HTTP-only, secure, same-site session cookie that disappears when the browser session closes. The database session expires after 12 hours even if the browser remains open.

## Architecture

```text
Vercel Cron (daily)                         Telegram owner
       | CRON_SECRET                        | webhook secret + chat allowlist
       v                                    v
  /api/cron/daily  ---------------->  /api/telegram/webhook
       |                                      |
       +--------------+-----------------------+
                      v
              LangGraph orchestrator
        [route, checkpoint, interrupt, resume]
          |             |                  |
          v             v                  v
    Trend Scout    Prompt Director    Gemini Critic
    Brave Search   Gemini text        Gemini video
    research       direction          evaluation
          \             |                  /
           +------------+-----------------+
                        v
          Supabase Postgres + private Storage
 campaigns, versions, sessions, uploads, messages, checkpoints
                        |
                        v
             Private Next.js dashboard
```

The orchestrator is the only component that sends conversational messages. Specialist agents return structured data to it. `interrupt()` pauses at idea selection and before any recommended paid regeneration. Telegram replies resume the same LangGraph thread through `Command({ resume })`.

```text
Cron retry or duplicate Telegram update
                  |
                  v
      unique workflow idempotency key
          | new                | existing
          v                    v
  claim run + version      return without work
          |
          v
   specialist provider call
          |
          v
 compare campaign.run_version
    | current              | cancelled or changed
    v                      v
 durable write          mark stale, ignore result
    |
    +--> provider error: run = failed, visible in Vercel logs
    +--> process restart: LangGraph reloads checkpoint by thread_id
    +--> duplicate upload: Telegram unique ID + SHA-256 uniqueness rejects it
```

### Happy path

1. `/api/cron/daily` claims the date through `claim_daily_campaign`.
2. Trend Scout searches five current topic groups and stores exactly three cited ideas.
3. LangGraph persists a checkpoint and interrupts for idea selection.
4. A Telegram reply resumes the thread. Prompt Director stores a versioned, validated prompt with locked attributes.
5. The owner generates manually in Higgsfield and uploads the result to Telegram.
6. The upload is hashed, stored privately, evaluated by Gemini, and shown with its verdict in Telegram and the dashboard.

### Duplicate and cancellation path

If Vercel retries a cron or Telegram redelivers an update, `claim_workflow_run` returns `is_new=false`, so no provider call or duplicate reply occurs. If a campaign is cancelled while an agent is running, cancellation increments `run_version`. The late result fails the expected-version write and is marked stale.

## Privacy and authentication

- Dashboard data is rendered only after an opaque database session is validated.
- Login attempts are throttled by a non-reversible IP key after 5 failures and by account after 25 failures. Lockouts last 15 minutes.
- Session tokens contain 256 bits of randomness. Only their SHA-256 hashes are stored.
- Session cookies are HTTP-only, secure in production, same-site strict, and browser-session scoped.
- Videos stay in a private Supabase bucket. The dashboard uses `/api/media/<id>`, which validates the owner session on every request. No signed storage URL is put into the page.
- Dashboard and media responses use `private, no-store`.
- Telegram accepts only the configured chat ID and verified webhook secret.
- Vercel cron requires its bearer secret.
- Database tables and security-definer functions are revoked from anonymous and authenticated Supabase roles.

## Local setup

Requires Node.js 22 or newer.

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without Supabase credentials the code can build and the dashboard data layer has a static development snapshot. A real owner login requires Supabase plus the configured username and password. There is no separate session secret.

## Required credentials

| Variable | Source | Used for |
|---|---|---|
| `STUDIO_USERNAME`, `STUDIO_PASSWORD` | Choose them. Use a password-manager-generated password or five-word passphrase of at least 16 characters | One-owner dashboard login and session key derivation |
| `TELEGRAM_BOT_TOKEN` | Telegram `@BotFather` via `/newbot` | Bot API |
| `TELEGRAM_WEBHOOK_SECRET` | Generate a random 32+ character value | Telegram webhook verification |
| `TELEGRAM_ALLOWED_CHAT_ID` | Send the bot a message, then inspect `getUpdates` | Owner allowlist |
| `GEMINI_API_KEY` | Google AI Studio | Trend synthesis, direction, video critique |
| `BRAVE_SEARCH_API_KEY` | Brave Search API dashboard, API Keys | Current web search |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings | Supabase endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API settings | Server-only database and storage access |
| `DATABASE_URL` | Supabase Connect, Session Pooler | LangGraph Postgres checkpoints |
| `CRON_SECRET` | Generate a random 32+ character value | Vercel cron verification |

There is no session secret. Changing the studio password invalidates existing dashboard sessions.

Keep the service role, database URL, Gemini key, Brave key, bot token, and all secrets server-side.

## Database setup

1. Create a Supabase project.
2. Open SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql). Run the complete file again when upgrading an earlier installation so the session tables, rate-limit functions, and grants are applied.
3. Confirm the private `aura-content-media` bucket exists.
4. Copy the Session Pooler connection string to `DATABASE_URL`. Use a connection with permission to create the `langgraph` schema and checkpoint tables.
5. If you change `SUPABASE_STORAGE_BUCKET`, update the bucket ID in the SQL file before running it.

LangGraph runs its checkpoint migrations on first use. Application tables use RLS with no browser policies. Only the server service role can access them.

## Telegram setup

1. Create a bot with `@BotFather`.
2. Deploy the app or expose local HTTPS.
3. Register the webhook:

```text
POST https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
Content-Type: application/json

{"url":"https://<APP_URL>/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>","allowed_updates":["message"]}
```

4. Send the bot a message and set the resulting chat ID as `TELEGRAM_ALLOWED_CHAT_ID`.
5. Telegram must be able to download uploaded videos through the standard Bot API. Keep clips short enough for both Telegram download and the Vercel function duration.

## Vercel deployment

1. Import the repository into a separate private studio Vercel project. Use a dedicated hostname such as `studio.auravoiceapp.com`, not the public marketing site route tree.
2. Add every value from `.env.example`. Set `SEARCH_PROVIDER=brave`.
3. Set `APP_URL` to the production URL.
4. Deploy. `vercel.json` schedules daily research at `16:00 UTC`, which is 08:00 Pacific Standard Time and 09:00 Pacific Daylight Time.
5. Register the production Telegram webhook after the first deployment.
6. Sign in, close the browser, reopen it, and confirm the studio asks for credentials again.
7. Copy a video request URL from browser developer tools into a private window. It must return `401`.

Vercel cron schedules are UTC. Change the expression if a fixed local hour through daylight saving changes is important.

## LangGraph workflow

The main graph is in `src/lib/workflow/orchestrator.ts`. Specialist subgraphs live in `src/lib/workflow/specialists.ts`.

- Daily event: route to Trend Scout, store ideas, interrupt for selection.
- Idea response: resume checkpoint, select or skip, route to Prompt Director.
- Normal instruction: load the latest idea and prompt, then create a locked revision.
- Video upload: route to Gemini Critic and store a timestamped verdict.
- Surgical regeneration: interrupt for explicit approval. On approval, revise only named defects while preserving locked attributes.
- Cancellation: increment `run_version` so in-flight agent results become stale.
