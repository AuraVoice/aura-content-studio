# Aura video studio

Code-built promo videos for Aura: Play Store promo videos, Reels/Shorts/TikTok cuts and store art,
made from real screens captured on a phone and rendered deterministically with
[HyperFrames](https://github.com/heygen-com/hyperframes) (HTML in, MP4 out). The same source
renders 16:9, 9:16 and the 1024x500 feature graphic, and re-renders byte-identically.

This folder is independent of the Next.js app in `src/`. Nothing here is linted, type-checked or
deployed by the app (`.vercelignore` excludes it).

- Every video and its deliverables: [`CATALOG.md`](CATALOG.md)
- How to make one (the skill agents follow): [`.claude/skills/aura-promo-video/SKILL.md`](../.claude/skills/aura-promo-video/SKILL.md)
- Store and platform rules: [`docs/store-rules.md`](docs/store-rules.md)
- Capturing from the phone: [`docs/capture.md`](docs/capture.md)
- Editing real screenshots honestly: [`docs/pixel-patching.md`](docs/pixel-patching.md)
- Writing scenes (timing, layouts, safe areas): [`docs/scene-authoring.md`](docs/scene-authoring.md)

## How a video gets made

```
 phone (adb)             recipes/prepare.py           compositions/*.html          renders/
 screencap, screenrecord  erase, re-cut, rename        one scene set, two layouts   16:9 mp4
        |                        |                              |                    9:16 mp4
        v                        v                              v                    1024x500 png/jpg
   capture/  ----------->  assets/screens/  ---------->  studio.py build  ------>  studio.py render
   (raw, never edited)     (what scenes play)            .build/<slug>-<format>/   (pinned HyperFrames)
```

## Strict folder structure

Names and places are fixed. `studio.py` refuses a video that does not follow this.

```
video-studio/
  README.md                     this file
  CATALOG.md                    generated list of every video (studio.py catalog), never hand-edited
  studio.json                   pinned HyperFrames version, format sizes, safe areas, type floor
  tools/
    studio.py                   the only entry point: new, prepare, check, snapshot, preview, render, catalog
    patchlib.py                 erase-and-redraw text in real screenshots and recordings
  shared/
    fonts/                      Aura's fonts (Outfit, Plus Jakarta Sans, Geist Mono, JetBrains Mono) + OFL texts
    brand/                      aura-icon.png, orb.png (copied into every build's assets/)
  docs/                         rules every video follows
  videos/
    YYYY-MM-DD-kebab-name/      one folder per video, dated by creation day
      video.json                REQUIRED. title, status, app build, formats, music, deliverables, pixel edits
      README.md                 REQUIRED. brief, beat table, pixel edits table, decisions
      index.html                16:9 root (1920x1080). Mounts scenes with layout=landscape
      vertical.html             9:16 root (1080x1920). Mounts the same scenes with layout=vertical
      compositions/             scene files shared by both roots (phone.html, copy.html, endcard.html, ...)
      feature-graphic/index.html  1024x500 still for the Play listing
      capture/                  raw adb screenshots and screen recordings, exactly as captured
      recipes/prepare.py        turns capture/ into assets/screens/; every edit is in README "Pixel edits"
      assets/screens/           prepared screens the scenes play (committed, so a render needs no recipe run)
      assets/music/             licensed music, NEVER committed (gitignored); path set in video.json
      renders/                  final deliverables, committed through Git LFS
  .build/                       generated per-format HyperFrames projects (gitignored)
```

Rules that keep this sane:

1. One video, one folder, one `video.json`. A slug is `YYYY-MM-DD-kebab-name` and never changes.
2. `capture/` holds raw captures only. Edits happen in `recipes/prepare.py`, never by hand in an image editor, so every pixel change is reviewable and repeatable.
3. Scene files live once, in `compositions/`. The 16:9 and 9:16 roots differ only in size and the `layout` they pass; never fork a scene per format.
4. Shared fonts and brand art live in `shared/`; `studio.py` copies them into each build. Do not copy them into a video folder.
5. Renders are committed (LFS). Music is not (license per track); `video.json` records the source and license status.
6. After a render, update `video.json` (`status`, `deliverables`) and run `studio.py catalog`.

## Quick start

Requirements: Node.js 22+ (for `npx`), Python 3.11+ with `numpy` and `pillow`, `ffmpeg` on PATH,
`adb` for capture, Git LFS. Claude Code users also install the HyperFrames plugin:
`/plugin marketplace add heygen-com/hyperframes`, then `/plugin install hyperframes@hyperframes`.

```powershell
git lfs install; git lfs pull                       # fetch media after cloning
pip install -r video-studio/tools/requirements.txt

# re-render an existing video (put its music at the path in video.json, or add --silent)
python video-studio/tools/studio.py check  2026-11-21-play-store-launch
python video-studio/tools/studio.py render 2026-11-21-play-store-launch

# start a new one from the closest existing video
python video-studio/tools/studio.py new 2026-12-03-reels-memory --from 2026-11-21-play-store-launch --title "Memory, for Reels"
#   capture into capture/, adapt recipes/prepare.py, then:
python video-studio/tools/studio.py prepare  2026-12-03-reels-memory
python video-studio/tools/studio.py preview  2026-12-03-reels-memory --format vertical
python video-studio/tools/studio.py snapshot 2026-12-03-reels-memory --format landscape --at 0,2.5,6,10
python video-studio/tools/studio.py render   2026-12-03-reels-memory
python video-studio/tools/studio.py catalog
```

`--format` takes `landscape`, `vertical`, `feature-graphic` or `all` (default).

## Non-negotiables

- Real app only. Every screen comes from the phone. Patching may rename, re-time or remove UI the app really shows; it may never draw a feature, number, review or claim the app does not have.
- No device frames, store badges, "#1/Best/Free", or pure white/black/dark gray backgrounds on the feature graphic (Google Play rules).
- No tapping fingers in a Play promo video; captions carry it with sound off (it autoplays muted).
- Text at least 28 px; key text inside the vertical safe area (y 270 to 1536).
- No personal data in a capture: use the demo account, Do Not Disturb on, no real notifications.
- No em dashes in copy, docs or code. No Indian names in copy or examples.
