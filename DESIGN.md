# Design System: Aura Content Studio

## Product Context

- **What this is:** A private daily campaign dashboard for Aura Desktop marketing.
- **Who it is for:** One owner managing trend research, manual generation, and content review.
- **Space:** AI companion and creator operations software.
- **Project type:** Internal single-page dashboard with a private login.

## Aesthetic Direction

- **Direction:** Warm editorial production desk.
- **Decoration level:** Intentional.
- **Mood:** Focused enough for daily operations, warm enough to feel like Aura. Product state is treated as editorial material, not enterprise telemetry.
- **References:** `https://auravoiceapp.com` for companion warmth and `https://heyclicky.com` for playful desktop storytelling.

## Typography

- **Display:** Newsreader Variable. Editorial, human, and expressive without becoming ornamental.
- **Body and UI:** Manrope Variable. Compact, highly legible, and distinct from default AI dashboard typography.
- **Data:** Manrope Variable with tabular numerals where required.
- **Code and prompts:** Manrope Variable to keep production instructions plain and readable.
- **Loading:** Self-hosted npm font packages. No runtime font CDN.
- **Scale:** 8, 9, 10, 11, 12, 15, 18, 21, 26, 28, 48, and 92 px.

## Color

- **Approach:** Restrained with one expressive signal color.
- **Ink:** `#171612` for navigation and strong text.
- **Soft ink:** `#292720` for campaign state surfaces.
- **Paper:** `#F3F0E8` for the workspace.
- **Surface:** `#FFFDF8` for cards.
- **Coral:** `#F06449` for active state, selection, and primary action.
- **Lime:** `#C9F36B` for online and successful status.
- **Warning:** `#F7CF5A`.
- **Success:** `#357A52`.
- **Info:** `#4F6BD8`.

## Spacing

- **Base unit:** 4 px.
- **Density:** Comfortable at the campaign level, compact inside production records.
- **Scale:** 4, 8, 12, 16, 18, 20, 22, 24, 28, 32, 38, 48, and 60 px.

## Layout

- **Approach:** Hybrid. A strict operational grid with editorial hierarchy.
- **Desktop grid:** 224 px navigation plus a fluid workspace. Content uses three, two, and asymmetric columns by task.
- **Tablet grid:** 74 px icon navigation and a fluid workspace.
- **Compact grid:** One column with navigation removed.
- **Radius:** 7 px for data items, 11 px for controls, 15 px for idea cards, 18 px for campaign surfaces, and 9999 px only for status pills.
- **Scrollbars:** All `.db-app` scroll containers hide native scrollbars.

## Motion

- **Approach:** Minimal functional.
- **Easing:** Ease for hover and focus transitions.
- **Duration:** 150 to 160 ms for micro-interactions.
- **Rule:** No decorative choreography that delays campaign work.

## Safe Choices

- Persistent left navigation keeps a dense private dashboard familiar.
- Status pills and a five-step workflow make durable state legible.
- Private video playback uses a conventional player rather than custom controls.

## Deliberate Risks

- Editorial serif headlines replace the typical geometric AI dashboard voice.
- Warm paper and coral replace blue-purple AI gradients.
- Campaign state gets a single poster-like dark surface while the rest of the dashboard remains quiet.

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-28 | Initial system created | Derived from Aura public warmth, Windows positioning, and the need for a credible internal production tool |
