## Working style

- Never use em-dashes anywhere, in UI copy or in code/comments. Use plain human phrasing, not AI-sounding wording.
- Never ship the default OS scrollbar. The dashboard hides scrollbars app-wide via `.db-app *::-webkit-scrollbar` (`dashboard.css`); any new scroll container must either hide its scrollbar or use a slim custom-styled one. Watch portaled elements: anything rendered outside `.db-app` (e.g. a `createPortal` to `document.body`) loses both that scrollbar rule and the `--db-*` tokens, so it falls back to raw chrome and a transparent background. Portal into `.db-app` instead.
- Ask before running long-running or launching commands (`npm run tauri dev`, etc.) - the user runs those themselves and reports back, since they iterate faster than a tool-call round trip and Claude can't visually verify a GUI window anyway. Fast, silent checks (`cargo check`, `tsc --noEmit`) are fine to run directly.
- Only change what was asked. Don't refactor, rename, reorganize, or reformat anything else in the same pass; mention other issues noticed at the end instead of touching them.
- Before deleting a file, dropping generated assets, or removing a dependency, say what will be affected before doing it.
- End a task with a brief status update: what changed, what was left untouched, what needs the user's attention next.
- Log in [`lessons-learnt.txt`](./lessons-learnt.txt) at the repo root ONLY when a real problem was overcome: a bug, a silent failure, a non-obvious constraint that broke (or would have broken) something, or a review finding - with problem, issue, solution, justification, date. Do NOT log routine feature work, additive changes, or design decisions that shipped without a problem being solved; a task producing working code is not a lesson. If nothing failed or surprised you, add nothing.
- when explaining a plan: potray in examples and user data flow rather than lengthy text.
- NEVER Push code to github without me explicitly saying, this doesn't include a plan where you propose to push commits to git. Always advice me to push. 

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming -> invoke office-hours
- Bugs, errors, "why is this broken", 500 errors -> invoke investigate
- Ship, deploy, push, create PR -> invoke ship
- QA, test the site, find bugs -> invoke qa
- Code review, check my diff -> invoke review
- Update docs after shipping -> invoke document-release
- Weekly retro -> invoke retro
- Design system, brand -> invoke design-consultation
- Visual audit, design polish -> invoke design-review
- Architecture review -> invoke plan-eng-review
- Save progress, checkpoint, resume -> invoke checkpoint
- Code quality, health check -> invoke health

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Aura Content Studio

- This repository is only for Aura Desktop marketing on Windows.
- Aura Desktop is a Windows AI voice companion. Read `src/lib/product.ts` before changing product claims.
- Never claim autonomous clicking, computer control, or permanent screen-frame storage.
- Higgsfield generation is manual. No implementation may spend a Higgsfield credit.
- The LangGraph orchestrator is the only conversational agent. Specialist agents return structured state.
- Human approval uses LangGraph `interrupt()` and resumes from Telegram.
- Preserve prompt locked attributes during surgical revisions.
- Use Supabase application records and LangGraph checkpoints as the durable source of truth.

## Design System

Always read DESIGN.md before making visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that does not match DESIGN.md.
