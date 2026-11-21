# Editing real screenshots and recordings

`tools/patchlib.py` changes text inside real captures so a promo can follow a rename or drop noise
without rebuilding the UI by hand. It is a scalpel for honest edits, not a mockup tool.

## What is allowed

| Allowed | Example |
|---|---|
| Rename to the current brand | "Buddy" to "Aura" in the chat header and composer |
| Re-time | cut 5 s of "Thinking..." down to 0.6 s |
| Remove noise that is not the product | the alarm-permission nag under a reply |
| Redraw real text larger for legibility | the voice transcript at 2.2x, same words |
| Change an example value the user typed | an alarm at 12:25 AM shown as 7:00 AM |

Never: add a feature, a result, a number, a review, a badge, or UI the shipping app does not show.
Log every edit in the video's README "Pixel edits" table and in `video.json` `pixel_edits`, and add
an `open_items` entry when the edited video shows something the current app does not (for example a
rename that has not shipped yet).

## How it works

1. `ink_bbox` finds the tight box of the old text's dark pixels in a search box you give it.
2. `fit` tries the shared fonts at sizes in 0.5 px steps and picks the one whose ink box matches the old text's height and width (Plus Jakarta Sans for body, Outfit for titles, Geist or JetBrains Mono for mono labels). `tracked=True` also solves letter spacing for spaced uppercase labels.
3. `erase` blends every pixel column between the clean row just above and just below the box, so bubble tints, card gradients and background haze survive. A flat white box would show.
4. The new text is drawn at the same origin and colour (the median of the old text's darkest pixels). `align="right"` keeps a right edge fixed.

## Checklist (each one was a real bug)

- Include descenders in the search box (g, y, p). If the box stops at the baseline, descender stubs survive and the vertical blend smears them into streaks.
- Light glyphs (an ellipsis, light grey hints) may fall under the ink threshold: also erase a little past the old text's right edge.
- Text that moves between frames (a transcript re-centring as lines arrive) needs the union of its rows across every frame, not one frame's box. Measure it with a per-frame scan.
- In recordings, layouts change state (a composer that expands while generating). Detect the line per frame and cache one patch per state; fail the recipe if any frame matches no state, so old text can never leak.
- Paste only a tight crop around the patch. A wide crop copied from one frame onto another drags a stale edge or shadow with it.
- Narrower replacement text: move what follows it (for example "Every day" after the alarm time) so the original gap is kept.
- Verify by looking: crop each patched region at full resolution, and scan every frame of a recording for leftover dark pixels in an erased band.
