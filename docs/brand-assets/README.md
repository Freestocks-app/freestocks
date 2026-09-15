# Brand assets archive

Source artwork for the Freestocks logo, kept at original resolution so
future crops/resizes don't need to be regenerated from scratch. These
are **not** referenced by the app — production-ready derivatives live
under `public/brand/` and `public/favicon.png` / `public/apple-touch-icon.png`.

| File | Description |
|---|---|
| `icon-only.png` | Ticket-shaped icon mark alone, transparent bg, 1254x1254. Source for favicon/apple-touch-icon and any square icon use. |
| `wordmark-white-text.png` | Icon + "Freestocks" in white text, transparent bg, 1774x887. Only legible on dark backgrounds. |
| `wordmark-black-text.png` | Icon + "Freestocks" in black text, transparent bg, 2172x724. Legible on light/white backgrounds — use this for anything embedded in a light UI (e.g. Privy's login card). |

## Where derivatives are used

- `public/brand/freestocks-logo.png` — site header/footer logo (dark background, white text variant)
- `public/favicon.png`, `public/apple-touch-icon.png` — padded crops of `icon-only.png`
- `public/brand/privy-logo.png` — 180x90 (2:1) padded crop of `wordmark-black-text.png`, used for Privy Dashboard's login-screen "Logo" field: `https://www.freestocks.app/brand/privy-logo.png`

## Regenerating a padded icon/logo crop

`scripts/` doesn't have a helper for this yet; the pattern used so far:
1. Load the source PNG, crop to its actual non-transparent bounding box (`Image.getbbox()`).
2. Resize to fit within the target canvas minus ~8-14% padding on each side.
3. Paste centered onto a transparent canvas of the target size.

This keeps the mark from touching the edges (the original favicon bug
this fixed: the icon was clipped edge-to-edge with no margin).
