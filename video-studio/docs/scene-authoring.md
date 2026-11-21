# Writing scenes

Scenes are HyperFrames compositions (HTML plus a paused GSAP timeline). Read the `hyperframes`
skill for the full contract; this file holds the conventions specific to this studio.

## One scene set, two layouts

```
index.html (1920x1080)  ----mounts---->  compositions/phone.html   <----mounts----  vertical.html (1080x1920)
  data-variable-values none (landscape)  compositions/copy.html       data-variable-values='{"layout":"vertical"}'
                                         compositions/endcard.html
```

- Each scene declares a `layout` enum variable on its `#root` and reads it once:
  `const V = window.__hyperframes.getVariables().layout === "vertical";` then adds class `v` to its
  own uniquely named wrapper (`#ph-layout`, `#cp-layout`, `#ec-layout`). CSS under `.v` re-lays out.
- Never put `data-width`/`data-height` on a scene's `#root`. A scene that declares 1920x1080 stays
  1920x1080 inside a 1080x1920 host (cut off at y=1080, centred at x=960). Let it take the host size.
- One project may have only one root, so each format is assembled into its own `.build/<slug>-<format>/`
  by `studio.py`. Never commit junctions or symlinks to share files.

## Timing

- Timed elements are `class="clip"` with `data-start`/`data-duration`. Clip windows of consecutive
  screens must not overlap.
- Sequential transitions, no crossfades: the current screen fades out in 150 ms, the frame stays
  empty for 50 ms, then the next screen comes in (300 ms fade and rise). Headlines follow the same
  rhythm. Snapshot a frame inside each 50 ms gap to prove there is no ghosting.
- A `fromTo` that must hide something before its start time needs `immediateRender` left on (the
  default); later tweens on the same element use `immediateRender: false` so stacked tweens do not
  fight on seek.
- Hold anything the viewer must read for about 2 s after it is fully visible. The closing line
  needs 0.5 s + 0.3 s per word and at least 2 s before the film ends (`check` enforces it).

## The phone and the camera

- The device body is drawn in CSS around the real screen (420 x 935 screen inside a 444 x 959 body).
  The feature graphic never shows a device (Google Play rule).
- Zooms ("punches") scale the phone about a transform origin at the point of interest (a % of the
  phone height), so that point stays put on screen. Pan between two points by animating
  `transformOrigin` at constant scale.
- 16:9: scale about 1.6x, shift x by -40 px.
- 9:16: the stage is already 1.27x; use a gentler zoom (`1 + (s - 1) * 0.55`) and shift y so the
  point of interest lands at y = 1180, inside the safe area. The phone sits in a clip box that
  starts under the headline with a 52 px soft top edge, so a zoomed phone slides under the copy.

## Type and colour

- Fonts: Outfit (headlines), Plus Jakarta Sans (body), Geist Mono (labels), from `shared/fonts`
  via `@font-face` to `assets/fonts/...`. Colours: ink `#1a1a1a`, secondary `#3f3f44`, teal
  `#1ec8b0`, dark teal `#148474` (use `#0e6e61` for small text on mint to pass 4.5:1), amber `#e8a020`.
- Every reading size is at least 28 px at 1080p. Headlines 5 words or fewer.
- Ground: `#f5f8f7` with soft teal (top left) and amber (bottom right) haze. Not pure white.
