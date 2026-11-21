"""Aura video studio CLI.

Every video lives in video-studio/videos/<YYYY-MM-DD-slug>/ and is described by its video.json.
This script assembles a throwaway HyperFrames project per format under video-studio/.build/ (so
one set of scene files serves 16:9, 9:16 and the feature graphic), then runs the pinned
HyperFrames CLI against it.

  python video-studio/tools/studio.py new <slug> --from <existing-slug>
  python video-studio/tools/studio.py prepare <slug>            # raw captures -> assets/screens
  python video-studio/tools/studio.py check <slug> [--format F]
  python video-studio/tools/studio.py snapshot <slug> --format F --at 0,2.5,6
  python video-studio/tools/studio.py preview <slug> --format F
  python video-studio/tools/studio.py render <slug> [--format F] [--silent]
  python video-studio/tools/studio.py catalog                   # regenerate CATALOG.md

F is one of the formats declared in video.json (landscape, vertical, feature-graphic) or "all".
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

STUDIO = Path(__file__).resolve().parent.parent
VIDEOS = STUDIO / "videos"
SHARED = STUDIO / "shared"
BUILD = STUDIO / ".build"
CONFIG = json.loads((STUDIO / "studio.json").read_text(encoding="utf-8"))
SLUG_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$")
REQUIRED_KEYS = ("slug", "title", "status", "app", "formats", "duration_s", "music", "deliverables")


def die(msg: str) -> None:
    sys.exit(f"studio: {msg}")


# ------------------------------------------------------------------------------- video.json
def load_video(slug: str) -> tuple[Path, dict]:
    vdir = VIDEOS / slug
    meta_path = vdir / "video.json"
    if not meta_path.exists():
        die(f"no video at {vdir} (expected video.json). Existing: {', '.join(list_slugs()) or 'none'}")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    missing = [k for k in REQUIRED_KEYS if k not in meta]
    if missing:
        die(f"{meta_path} is missing {missing}")
    if meta["slug"] != slug:
        die(f"{meta_path}: slug '{meta['slug']}' does not match its folder '{slug}'")
    for name, fmt in meta["formats"].items():
        root = vdir / fmt["root"]
        if not root.exists():
            die(f"format '{name}' points at {fmt['root']}, which does not exist")
    return vdir, meta


def list_slugs() -> list[str]:
    return sorted(p.name for p in VIDEOS.iterdir() if (p / "video.json").exists()) if VIDEOS.exists() else []


def pick_formats(meta: dict, fmt: str | None) -> list[str]:
    names = list(meta["formats"])
    if fmt in (None, "all"):
        return names
    if fmt not in names:
        die(f"unknown format '{fmt}'. This video has: {', '.join(names)}")
    return [fmt]


# ------------------------------------------------------------------------------- build
def reset_dir(path: Path) -> None:
    """Empty a build folder. On Windows a just-finished HyperFrames/Chrome process can hold the
    folder handle for a moment, so retry, then fall back to clearing its contents in place."""
    for _ in range(6):
        try:
            if path.exists():
                shutil.rmtree(path)
            path.mkdir(parents=True)
            return
        except PermissionError:
            time.sleep(0.5)
    for child in path.iterdir():
        shutil.rmtree(child) if child.is_dir() else child.unlink()


def build(slug: str, fmt: str, silent: bool = False) -> Path:
    """Assemble .build/<slug>-<fmt>/ : the format's root as index.html plus scenes and assets."""
    vdir, meta = load_video(slug)
    spec = meta["formats"][fmt]
    out = BUILD / f"{slug}-{fmt}"
    reset_dir(out)

    html = (vdir / spec["root"]).read_text(encoding="utf-8")
    if (vdir / "compositions").exists() and spec.get("kind") != "still":
        shutil.copytree(vdir / "compositions", out / "compositions")
    assets = out / "assets"
    if (vdir / "assets").exists():
        shutil.copytree(vdir / "assets", assets)
    else:
        assets.mkdir()
    shutil.copytree(SHARED / "fonts", assets / "fonts", dirs_exist_ok=True)
    for f in (SHARED / "brand").iterdir():
        shutil.copy2(f, assets / f.name)

    if 'id="music"' in html:
        music = meta["music"]
        src = (vdir / music["file"]) if music.get("file") else None
        if src and src.exists():
            shutil.copy2(src, assets / "music.mp3")
        elif silent:
            html = re.sub(r'\s*<audio id="music"[^>]*></audio>', "", html)
            print(f"studio: building {fmt} WITHOUT music (--silent)")
        else:
            die(f"music file '{music.get('file')}' is missing. Music is never committed (license per track); "
                f"put the track at {vdir / (music.get('file') or 'assets/music/<track>.mp3')} or pass --silent.")

    (out / "index.html").write_text(html, encoding="utf-8")
    (out / "hyperframes.json").write_text(json.dumps({
        "$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
        "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
        "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
        "media": {"autoProxy": True},
        "authoringSkill": "hyperframes",
    }, indent=2), encoding="utf-8")
    (out / "meta.json").write_text(json.dumps({"id": f"{slug}-{fmt}", "name": f"{slug}-{fmt}"}), encoding="utf-8")
    (out / "package.json").write_text(json.dumps({"name": f"{slug}-{fmt}", "private": True, "type": "module"}),
                                      encoding="utf-8")
    return out


def hyperframes(project: Path, *args: str) -> int:
    npx = shutil.which("npx") or die("npx not found; install Node.js 22+")
    cmd = [npx, "--yes", f"hyperframes@{CONFIG['hyperframes_version']}", *args]
    print("studio: $", " ".join(cmd[1:]), f"  (in {project.relative_to(STUDIO.parent)})")
    return subprocess.call(cmd, cwd=project)


# ------------------------------------------------------------------------------- commands
def cmd_new(a):
    if not SLUG_RE.match(a.slug):
        die("slug must be YYYY-MM-DD-kebab-name, e.g. 2026-12-03-reels-memory")
    dst = VIDEOS / a.slug
    if dst.exists():
        die(f"{dst} already exists")
    src_dir, src_meta = load_video(a.from_slug)
    keep = ["index.html", "vertical.html", "compositions", "feature-graphic", "recipes"]
    dst.mkdir(parents=True)
    for name in keep:
        p = src_dir / name
        if p.is_dir():
            shutil.copytree(p, dst / name)
        elif p.exists():
            shutil.copy2(p, dst / name)
    for d in ("capture", "assets/screens", "assets/music", "renders"):
        (dst / d).mkdir(parents=True, exist_ok=True)
    meta = {**src_meta, "slug": a.slug, "title": a.title or a.slug, "status": "draft",
            "created": date.today().isoformat(), "deliverables": {}, "pixel_edits": []}
    (dst / "video.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    (dst / "README.md").write_text(
        f"# {meta['title']}\n\nStatus: draft. Copied from `{a.from_slug}`.\n\n"
        "## Brief\n\n## Beat table\n\n| Time | Real screen | Caption |\n|---|---|---|\n\n"
        "## Pixel edits\n\n| Screen | Edit | Why |\n|---|---|---|\n\n## Decisions\n", encoding="utf-8")
    print(f"studio: created {dst}\n  next: capture raw screens into capture/, adapt recipes/prepare.py, "
          f"then `studio.py prepare {a.slug}`")


def cmd_prepare(a):
    vdir, _ = load_video(a.slug)
    recipe = vdir / "recipes" / "prepare.py"
    if not recipe.exists():
        die(f"{recipe} not found")
    sys.exit(subprocess.call([sys.executable, str(recipe)]))


def cmd_check(a):
    _, meta = load_video(a.slug)
    worst = 0
    for f in pick_formats(meta, a.format):
        worst = max(worst, hyperframes(build(a.slug, f, silent=True), "check"))
    sys.exit(worst)


def cmd_snapshot(a):
    _, meta = load_video(a.slug)
    vdir = VIDEOS / a.slug
    for f in pick_formats(meta, a.format):
        out = vdir / ".snapshots" / f
        project = build(a.slug, f, silent=True)
        args = ["snapshot", "--no-end", "-o", str(out)] + (["--at", a.at] if a.at else ["--review"])
        hyperframes(project, *args)
        print(f"studio: stills in {out}")


def cmd_preview(a):
    _, meta = load_video(a.slug)
    f = pick_formats(meta, a.format)[0]
    sys.exit(hyperframes(build(a.slug, f, silent=a.silent), "preview"))


def cmd_render(a):
    vdir, meta = load_video(a.slug)
    renders = vdir / "renders"
    renders.mkdir(exist_ok=True)
    for f in pick_formats(meta, a.format):
        spec = meta["formats"][f]
        project = build(a.slug, f, silent=a.silent)
        if spec.get("kind") == "still":
            shot = project / "_still"
            if hyperframes(project, "snapshot", "--at", "0", "--no-end", "-o", str(shot)):
                die(f"{f}: snapshot failed")
            png = sorted(shot.glob("*.png"))[0]
            from PIL import Image  # local import: only stills need Pillow
            im = Image.open(png).convert("RGB")  # store art must be 24-bit, no alpha
            w, h = spec["size"]
            if im.size != (w, h):
                die(f"{f}: rendered {im.size}, expected {w}x{h}")
            stem = renders / spec["output"]
            im.save(stem.with_suffix(".png"))
            im.save(stem.with_suffix(".jpg"), quality=95)
            print(f"studio: wrote {stem.with_suffix('.png').name} and .jpg")
        else:
            out = renders / spec["output"]
            code = hyperframes(project, "render", "-q", "delivery", "--video-frame-format", "png",
                               "--skill=hyperframes", "-o", str(out))
            if code:
                die(f"{f}: render failed ({code})")
    print("studio: done. Update video.json deliverables/status, then `studio.py catalog`.")


def cmd_catalog(_args):  # noqa: ARG001
    rows = []
    for slug in list_slugs():
        _, m = load_video(slug)
        fmts = ", ".join(f"{n} {'x'.join(map(str, s['size']))}" for n, s in m["formats"].items())
        files = "<br>".join(f"[`{Path(p).name}`](videos/{slug}/{p})" for p in m["deliverables"].values()) or "none yet"
        rows.append(f"| [`{slug}`](videos/{slug}/README.md) | {m['title']} | {m['status']} | "
                    f"{m['app']['name']} {m['app']['version']} | {m['duration_s']} s | {fmts} | {files} |")
    text = ("# Video catalog\n\nGenerated by `python video-studio/tools/studio.py catalog` from each "
            "`videos/*/video.json`. Do not edit by hand.\n\n"
            "| Video | Title | Status | App build | Length | Formats | Deliverables |\n"
            "|---|---|---|---|---|---|---|\n" + "\n".join(rows) + "\n")
    (STUDIO / "CATALOG.md").write_text(text, encoding="utf-8")
    print(f"studio: CATALOG.md lists {len(rows)} video(s)")


def main():
    ap = argparse.ArgumentParser(prog="studio.py", description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("new"); p.add_argument("slug"); p.add_argument("--from", dest="from_slug", required=True)
    p.add_argument("--title"); p.set_defaults(fn=cmd_new)
    p = sub.add_parser("prepare"); p.add_argument("slug"); p.set_defaults(fn=cmd_prepare)
    p = sub.add_parser("check"); p.add_argument("slug"); p.add_argument("--format"); p.set_defaults(fn=cmd_check)
    p = sub.add_parser("snapshot"); p.add_argument("slug"); p.add_argument("--format"); p.add_argument("--at")
    p.set_defaults(fn=cmd_snapshot)
    p = sub.add_parser("preview"); p.add_argument("slug"); p.add_argument("--format", default="landscape")
    p.add_argument("--silent", action="store_true"); p.set_defaults(fn=cmd_preview)
    p = sub.add_parser("render"); p.add_argument("slug"); p.add_argument("--format")
    p.add_argument("--silent", action="store_true", help="render without music when the track is absent")
    p.set_defaults(fn=cmd_render)
    p = sub.add_parser("catalog"); p.set_defaults(fn=cmd_catalog)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
