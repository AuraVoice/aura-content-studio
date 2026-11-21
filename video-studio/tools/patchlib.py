"""Pixel patch helpers for real app screenshots and screen recordings.

Erase a line of text by blending each pixel column between the clean rows just above and below
it (keeps bubble tints, card gradients and background haze intact), then redraw the replacement
text in whichever shared font and size best matches the original glyphs.

Rules for using this (see docs/pixel-patching.md): only rename, re-time or remove UI that the
shipping app really shows. Never draw a feature, number or claim the app does not have.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONTS = str(Path(__file__).resolve().parent.parent / "shared" / "fonts") + "/"
PJS = {w: FONTS + f"PlusJakartaSans-{w}.ttf" for w in ("Regular", "Medium", "SemiBold", "Bold", "ExtraBold")}
OUT = {w: FONTS + f"Outfit-{w}.ttf" for w in ("Medium", "SemiBold", "Bold")}
MONO = {w: FONTS + f"GeistMono-{w}.ttf" for w in ("Regular", "Medium")}
JB = FONTS + "JetBrainsMono-Regular.ttf"


def ink_bbox(img, box, thr=150, dark=True):
    x0, y0, x1, y1 = box
    a = np.asarray(img.convert("L")).astype(int)[y0:y1, x0:x1]
    m = a < thr if dark else a > thr
    ys, xs = np.where(m)
    return (int(xs.min()) + x0, int(ys.min()) + y0, int(xs.max()) + x0, int(ys.max()) + y0)


def ink_color(img, bb):
    x0, y0, x1, y1 = bb
    a = np.asarray(img.convert("RGB")).astype(int)[y0:y1 + 1, x0:x1 + 1].reshape(-1, 3)
    lum = a.sum(1)
    k = max(1, len(a) // 12)
    idx = np.argsort(lum)[:k]
    return tuple(int(v) for v in np.median(a[idx], axis=0))


def erase(img, bb, pad=4):
    """Replace rows inside bb with a per-column linear blend of the clean rows just above and below."""
    a = np.asarray(img.convert("RGB")).astype(float).copy()
    x0, y0, x1, y1 = bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad
    top = a[y0 - 1, x0:x1 + 1]
    bot = a[y1 + 1, x0:x1 + 1]
    n = y1 - y0 + 1
    for i in range(n):
        t = (i + 1) / (n + 1)
        a[y0 + i, x0:x1 + 1] = top * (1 - t) + bot * t
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def tracked_width(font, text, sp):
    return sum(font.getlength(c) for c in text) + sp * (len(text) - 1)


def fit(text, bb, candidates, tracked=False):
    """Pick the font and size whose ink box matches bb in height and width."""
    tw, th = bb[2] - bb[0] + 1, bb[3] - bb[1] + 1
    best = None
    for path in candidates:
        for size10 in range(100, 1400, 5):
            size = size10 / 10
            f = ImageFont.truetype(path, size)
            g = f.getbbox(text)
            h = g[3] - g[1]
            if abs(h - th) > 1.5:
                continue
            if tracked:
                sp = (tw - (g[2] - g[0]) + 0.0) / max(1, len(text) - 1)
                score = abs(h - th)
            else:
                sp = 0
                score = abs((g[2] - g[0]) - tw) + abs(h - th) * 2
            if best is None or score < best[0]:
                best = (score, path, size, sp)
    if best is None:
        raise ValueError(f"no candidate font renders {text!r} at the measured ink height {th}px; "
                         "check the box or add the right font to shared/fonts")
    return best


def draw_text(img, text, origin, font, color, sp=0):
    d = ImageDraw.Draw(img)
    if not sp:
        d.text(origin, text, font=font, fill=color)
        return
    x, y = origin
    for c in text:
        d.text((x, y), c, font=font, fill=color)
        x += font.getlength(c) + sp


def replace_line(img, box, old, new, candidates, thr=150, tracked=False, align="left", log=None, pad=4):
    bb = ink_bbox(img, box, thr)
    color = ink_color(img, bb)
    score, path, size, sp = fit(old, bb, candidates, tracked)
    f = ImageFont.truetype(path, size)
    g = f.getbbox(old)
    oy = bb[1] - g[1]
    if align == "left":
        ox = bb[0] - g[0]
    else:  # right: keep the right ink edge
        gn = f.getbbox(new)
        wn = (gn[2] - gn[0]) if not sp else tracked_width(f, new, sp)
        ox = bb[2] - wn - gn[0]
    img = erase(img, bb, pad)
    draw_text(img, new, (ox, oy), f, color, sp)
    if log is not None:
        log.append(f"{old!r} -> {new!r}: {path.split('/')[-1]} {size}px sp={sp:.2f} fitscore={score:.1f} bb={bb} color={color}")
    return img, bb, f, (ox, oy)
