---
name: aura-promo-video
description: Make an Aura promo video or store art from real phone screens with the video-studio pipeline in this repo (HyperFrames, 16:9 + 9:16 + Play feature graphic). Use when asked for a promo video, app ad, Play Store video, Reels/Shorts/TikTok cut, feature graphic, store listing art, or to edit, re-time, re-brand or re-render an existing video in video-studio/videos/.
---

# Aura promo video

You are producing marketing video for Aura from the real app. The pipeline lives in
`video-studio/` (read its `README.md` first: folder structure, CLI, non-negotiables). HyperFrames
is the renderer; load the `hyperframes` skill (plugin `hyperframes@hyperframes`, marketplace
`heygen-com/hyperframes`) for its composition contract before writing scene HTML.

Every command below runs from the repo root. On Windows give the user PowerShell syntax.

## 0. Decide: new video or edit

- Edit an existing video: work inside its folder in `video-studio/videos/<slug>/`. Read its `README.md` (beats, pixel edits, decisions) and `video.json` before touching anything.
- New video: `python video-studio/tools/studio.py new <YYYY-MM-DD-kebab-name> --from <closest-existing-slug> --title "..."`. This copies scenes, roots, feature graphic and recipe, never captures, screens, renders or music.

## 1. Understand the campaign before designing

1. Read the brief: store keywords, listing copy, target platform. Note which formats are needed (Play promo = 16:9 on YouTube; Reels/Shorts/TikTok = 9:16; Play feature graphic = 1024x500).
2. Read `video-studio/docs/store-rules.md`. If the campaign is on a platform not covered there, research its current official rules and add them to that file with source URLs.
3. Stand in the user's shoes: what do people searching these keywords want, and what do they doubt? For Aura: being remembered (doubt: is the memory real, is it private). The film must show the answer on a real screen, not claim it.
4. Product truth: lead with what the app really does on that platform. Never show a desktop-only feature in a phone video. Check the app's code or the phone, never memory.

## 2. Capture real screens (docs/capture.md)

Connect the phone over adb, demo account signed in, Do Not Disturb on. Drive the app with
`adb shell input` and record with `adb shell screenrecord` / `adb exec-out screencap -p`.
Save raw files into `capture/` with descriptive names (`voice-call.mp4`, `chat-reminders-top.png`).
Never commit a capture showing personal data (real notifications, wallpaper, contacts, real memories).

## 3. Prepare screens (docs/pixel-patching.md)

Write or adapt `recipes/prepare.py` to turn `capture/` into `assets/screens/`: trim and re-time
recordings with ffmpeg, erase or rename text with `tools/patchlib.py`. Then:
`python video-studio/tools/studio.py prepare <slug>`.
Allowed: rename (brand changes), re-time (cut waiting), remove noise (a permission nag), redraw text
larger. Forbidden: inventing UI, features, numbers or results. Log every edit in the video's
README "Pixel edits" table and `video.json` `pixel_edits`. Verify each patched frame visually
(crop and look); a patch is not done until no old text, descender or dot survives in any frame.

## 4. Beat table, then build

Write the beat table in the video's README (time, real screen, caption of 5 words or fewer). Hook
in the first 1.5 s with real UI, one benefit per beat, end card held 2 s or more with the URL.
If a human is driving the session, show the beat table and wait for approval before building.

Scenes follow `docs/scene-authoring.md`: one scene set in `compositions/` read by both roots
through the `layout` variable; sequential transitions (out 150 ms, 50 ms empty, next in); zoom
into the screen region a caption talks about and hold it readable about 2 s; type at least 28 px.

## 5. Verify before rendering

```powershell
python video-studio/tools/studio.py check <slug>
python video-studio/tools/studio.py snapshot <slug> --format landscape --at <one time per beat, plus gap frames>
python video-studio/tools/studio.py snapshot <slug> --format vertical --at <same>
```

`check` must pass for every format (contrast, layout, safe areas). Look at every still: nothing
cramped, cut off or overlapping, no ghosting in the 50 ms gaps, no leftover old brand text,
key text inside the vertical safe area. Fix and repeat. Never report done from reasoning alone.

## 6. Render and record

```powershell
python video-studio/tools/studio.py render <slug>
python video-studio/tools/studio.py catalog
```

Then sample the rendered MP4s (ffmpeg contact sheet at 1 fps) and look. Update `video.json`
(`status`, `deliverables`, `open_items`) and the README. Deliver to the user with exact paths.
Commit only when asked; renders go through Git LFS, music never goes to git.

## Hard rules

- Real app, real captures, honest patches. A promo that shows UI the shipping app does not have is a store policy risk; flag it in `open_items` and to the user.
- Music: record source and license in `video.json`; unverified license means "do not publish" until confirmed.
- Feature graphic: no device frames, badges, "#1/Best/Top/New/Free", no pure white, black or dark gray ground; key content centred, clear of edges; 24-bit, no alpha.
- Promo video: real app within 10 s, no finger close-ups, no "Download/Try now" text, captions on every beat.
- No em dashes anywhere. No Indian names. Lead Aura descriptions with what Aura does, never reduce it to a reminder app.
