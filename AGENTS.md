# Aura Content Studio Agent Guide

## Product boundary

This repository produces marketing content only for Aura Desktop, the Windows application.

- Keep every concept, script, visual, and claim on the Windows desktop product.
- Never claim Aura autonomously clicks, controls, or operates a computer.
- Describe screen understanding only when screen access is enabled.
- Describe screen frames as ephemeral for assistance, not permanently stored.
- Read `src/lib/product.ts` before changing prompts or product copy.

## Architecture invariants

- The LangGraph orchestrator is the only conversational agent.
- Trend Scout, Prompt Director, and Gemini Critic are specialist subgraphs that return structured state.
- Higgsfield is manual. No code may call Higgsfield or initiate a paid generation.
- A recommended paid regeneration must pass through `interrupt()` and a Telegram resume.
- Every long-running agent write must compare `campaigns.run_version`.
- Every cron and Telegram event must claim an idempotency key before provider calls.
- Every upload must retain both Telegram file uniqueness and SHA-256 deduplication.
- Supabase service credentials must remain server-only.
- Never put a Supabase signed media URL into dashboard state or markup.
- Every media response must validate an opaque Postgres session and use `private, no-store`.
- Anonymous and authenticated Supabase roles must not execute application RPC functions.

## Main files

- `src/lib/workflow/orchestrator.ts`: parent LangGraph and human approval points
- `src/lib/workflow/specialists.ts`: three specialist subgraphs
- `src/lib/agents/`: agent prompts, validation, and locked revision behavior
- `src/lib/telegram/`: Bot API client and update handling
- `src/lib/search/provider.ts`: Brave Search integration and local search mock
- `src/lib/repository.ts`: all durable application writes
- `supabase/schema.sql`: database, locks, idempotency functions, and private bucket
- `src/components/dashboard.tsx`: private campaign dashboard
- `DESIGN.md`: visual source of truth

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run all four before handing off changes. Do not run `npm run dev` without asking first.

## Editing rules

- Follow the existing `CLAUDE.md` working style.
- Never use em dashes in copy, code comments, or docs.
- Preserve locked prompt attributes when an instruction asks for one change.
- Keep dependencies and architecture lightweight.
- Do not push to GitHub without explicit approval.
