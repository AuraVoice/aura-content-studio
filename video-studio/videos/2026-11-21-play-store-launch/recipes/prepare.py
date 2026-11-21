"""Build this video's screen assets from the raw phone captures.

capture/  (raw, straight off the phone over adb)      ->   assets/screens/  (what the scenes play)
  voice-call.mp4           small transcript erased          voice_clean.mp4
  chat-focus-week.mp4      re-cut, "Buddy" -> "Aura"         chat_cut.mp4
  chat-reminders-*.png     merged, 12:25 -> 7:00 AM,         reminders_7am.png
                           permission paragraph removed
  your-aura.png            "Buddy" -> "Aura"                 aura_profile.png

Run through the studio CLI:  python video-studio/tools/studio.py prepare 2026-11-21-play-store-launch
Every edit here is listed in this video's README "Pixel edits" table. Keep the two in sync.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

VIDEO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(VIDEO.parent.parent / "tools"))
from patchlib import JB, MONO, OUT, PJS, erase, ink_bbox, replace_line  # noqa: E402

CAP = VIDEO / "capture"
DST = VIDEO / "assets" / "screens"
FFMPEG = shutil.which("ffmpeg") or sys.exit("ffmpeg is not on PATH (winget install ffmpeg)")
log: list[str] = []
BODY = [PJS["Regular"]]


def run(*args):
    subprocess.run([FFMPEG, "-v", "error", *map(str, args)], check=True)


def extract(src, ss, dur, outdir):
    outdir.mkdir(parents=True, exist_ok=True)
    run("-ss", ss, "-i", src, "-t", dur, "-vf", "fps=30", "-y", outdir / "f%04d.png")
    return sorted(outdir.glob("f*.png"))


def encode(indir, out):
    run("-framerate", 30, "-i", indir / "f%04d.png", "-c:v", "libx264", "-crf", 14,
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", out)


def vblend(a, y0, y1):
    top, bot = a[y0 - 1].astype(float), a[y1 + 1].astype(float)
    n = y1 - y0 + 1
    for i in range(n):
        t = (i + 1) / (n + 1)
        a[y0 + i] = top * (1 - t) + bot * t


# ---------------------------------------------------------------- stills
def reminders():
    """Upper capture down to "...morning brief is on.", lower capture from the alarm card on.
    The "One thing first: turn on Alarms & reminders" paragraph (lower rows 1500-1740) is dropped."""
    top = Image.open(CAP / "chat-reminders-top.png").convert("RGB")
    top, *_ = replace_line(top, (140, 1578, 940, 1625), "Set my daily wake up alarm for 12:25 AM with",
                           "Set my daily wake up alarm for 7:00 AM with", BODY, log=log)
    top, *_ = replace_line(top, (90, 1762, 820, 1810), "Your daily 12:25 AM alarm is set, and your",
                           "Your daily 7:00 AM alarm is set, and your", BODY, log=log)

    bot = Image.open(CAP / "chat-reminders-bottom.png").convert("RGB")
    bold = [PJS["SemiBold"], PJS["Bold"], PJS["ExtraBold"], OUT["SemiBold"], OUT["Bold"]]
    bot, *_ = replace_line(bot, (160, 205, 320, 262), "Buddy", "Aura", bold, log=log)
    bot, *_ = replace_line(bot, (100, 2150, 600, 2210), "Ask Buddy anything…", "Ask Aura anything…", BODY,
                           thr=140, log=log)
    # alarm time, then pull "Every day" left so the gap after the time is unchanged
    time_box = (120, 1922, 393, 1982)
    old_bb = ink_bbox(bot, time_box)
    every_bb = ink_bbox(bot, (396, 1922, 600, 1990))
    gap = every_bb[0] - old_bb[2]
    every = bot.crop((every_bb[0] - 2, every_bb[1] - 2, every_bb[2] + 3, every_bb[3] + 3))
    bot, *_ = replace_line(bot, time_box, "12:25 AM", "7:00 AM", bold, log=log)
    new_right = ink_bbox(bot, (120, 1922, every_bb[0] - 4, 1982))[2]
    bot = erase(bot, every_bb, pad=3)
    bot.paste(every, (new_right + gap - 2, every_bb[1] - 2))
    bot, *_ = replace_line(bot, (700, 1922, 905, 1990), "Next today", "Next tomorrow",
                           [MONO["Regular"], MONO["Medium"], JB], align="right", log=log)

    removed, offset, h = 240, 375, 2404  # upper capture row = lower capture row + 375
    out = Image.new("RGB", (1080, h), "white")
    out.paste(bot.crop((0, 0, 1080, 300)), (0, 0))
    out.paste(top.crop((0, 300 - removed + offset, 1080, 1740 - removed + offset)), (0, 300))
    out.paste(bot.crop((0, 1740, 1080, h)), (0, 1740))
    out.save(DST / "reminders_7am.png")


def your_aura():
    aura = Image.open(CAP / "your-aura.png").convert("RGB")
    aura, *_ = replace_line(aura, (180, 404, 760, 452), "Buddy remembers what matters to",
                            "Aura remembers what matters to", BODY, thr=200, log=log, pad=2)
    aura, *_ = replace_line(aura, (130, 1494, 560, 1530), "GOALS BUDDY HAS NOTICED", "GOALS AURA HAS NOTICED",
                            [PJS["Medium"], PJS["SemiBold"], PJS["Regular"]], thr=200, tracked=True, log=log)
    aura.save(DST / "aura_profile.png")


# ---------------------------------------------------------------- recordings
def voice(work):
    """Erase the app's small transcript: across the clip it moves between rows 460 and 625."""
    frames = extract(CAP / "voice-call.mp4", 3.3, 4.0, work / "voice")
    for p in frames:
        a = np.asarray(Image.open(p).convert("RGB")).copy()
        vblend(a, 440, 650)
        Image.fromarray(a).save(p)
    encode(work / "voice", DST / "voice_clean.mp4")


def row_runs(rows: np.ndarray, gap: int = 2) -> list[tuple[int, int]]:
    """Group sorted row indices into (first, last) runs, allowing small gaps."""
    runs: list[tuple[int, int]] = []
    for r in map(int, rows):
        if runs and r <= runs[-1][1] + gap:
            runs[-1] = (runs[-1][0], r)
        else:
            runs.append((r, r))
    return runs


def placeholder_box(a: np.ndarray) -> tuple[int, int] | None:
    """The composer's placeholder line: the widest grey text row run in the composer area."""
    y0, x0 = 1960, 60
    g = a[y0:2320, x0:720].mean(2)
    best = None
    for s, e in row_runs(np.where((g < 140).sum(1) > 12)[0]):
        if not 28 <= e - s + 1 <= 50:
            continue
        cols = np.where((g[s:e + 1] < 140).sum(0) > 0)[0]
        if cols.min() < 90 and cols.max() - cols.min() > 300:
            best = (s + y0, e + y0)
    return best


def chat(work):
    """Dots 0.5 s, "Thinking..." exactly 0.6 s, then the reply streams in and holds."""
    segments = [(1.5, 0.5), (5.4, 0.6), (6.25, 3.9)]
    out_dir = work / "chat"
    out_dir.mkdir(parents=True)
    i = 1
    for k, (ss, dur) in enumerate(segments):
        for p in extract(CAP / "chat-focus-week.mp4", ss, dur, work / f"seg{k}"):
            shutil.move(p, out_dir / f"f{i:04d}.png")
            i += 1
    bold = [OUT["SemiBold"], PJS["SemiBold"], PJS["Bold"]]
    header, cache, unmatched = None, {}, 0
    for p in sorted(out_dir.glob("f*.png")):
        im = Image.open(p).convert("RGB")
        if header is None:
            patched, *_ = replace_line(im.copy(), (160, 205, 320, 262), "Buddy", "Aura", bold, log=log)
            header = patched.crop((150, 196, 340, 270))
        im.paste(header, (150, 196))
        box = placeholder_box(np.asarray(im))
        if box is None:
            unmatched += 1
        else:
            if box not in cache:
                patched, bb, *_ = replace_line(im.copy(), (70, box[0] - 4, 720, box[1] + 16),
                                               "Ask Buddy anything…", "Ask Aura anything…", BODY, thr=140, log=log)
                # the old ellipsis' last dots are lighter than the ink threshold: clear past the old edge
                patched = erase(patched, (bb[2] + 2, bb[1], bb[2] + 30, bb[3]), pad=3)
                region = (bb[0] - 10, bb[1] - 8, bb[2] + 36, bb[3] + 8)
                cache[box] = (patched.crop(region), region[:2])
            crop, at = cache[box]
            im.paste(crop, at)
        im.save(p)
    if unmatched:
        sys.exit(f"chat: {unmatched} frame(s) had no recognisable composer; 'Buddy' would leak. Fix placeholder_box.")
    encode(out_dir, DST / "chat_cut.mp4")


if __name__ == "__main__":
    DST.mkdir(parents=True, exist_ok=True)
    reminders()
    your_aura()
    with tempfile.TemporaryDirectory() as tmp:
        voice(Path(tmp))
        chat(Path(tmp))
    print("\n".join(log))
    print(f"assets written to {DST}")
