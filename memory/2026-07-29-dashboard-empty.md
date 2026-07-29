# Dashboard empty-state investigation

## Symptom

The authenticated dashboard appeared static and empty. It did not show daily research,
final prompts, cron status, Telegram delivery, or a usable website conversation.

## Root cause

The live Supabase project contained one campaign and one failed daily workflow run.
The run failed before persistence with:

`Trend Scout returned a source URL that was not in web research`

There were zero trend ideas, zero prompt versions, and zero studio messages. The Trend
Scout trusted the model to reproduce source URLs byte-for-byte, so harmless URL rewriting
could fail the entire daily run.

The dashboard queried only the latest campaign's ideas, prompts, uploads, evaluations, and
messages. It did not query workflow runs or prior campaigns. Source evidence was stored
inside ideas but not rendered. Telegram connection text was hardcoded. The sidebar linked
only to anchors on the same page. There was no dashboard chat endpoint.

## Fix

- The Trend Scout now asks for evidence indexes and resolves exact researched URLs in code.
- The dashboard snapshot includes 30 campaign days, workflow runs, all prompt versions,
  source evidence, messages, and Telegram delivery identifiers.
- The dashboard renders cron failures and explicit empty states.
- An authenticated dashboard chat route sends instructions through the same LangGraph
  orchestrator and mirrors orchestrator responses to Telegram.
- The sidebar, hardcoded connection claim, Private badge, and overflow control were removed.

## Evidence

- Live read-only database query confirmed the failed daily run and empty artifact tables.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed with 20 tests.
- `npm run build` passed and includes `/api/chat`.

## Regression tests

- `src/lib/agents/trend-scout.test.ts`
- `src/components/dashboard.test.tsx`

## Status

DONE_WITH_CONCERNS: Browser-level visual inspection was unavailable because no controllable
browser was connected. Server rendering, compilation, and production build verification passed.
