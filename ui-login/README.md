# ui-login — retro pixel-art RPG login module

Asset + spec package for rebuilding the Astra client login screen.
Everything here is authored on a **4px pixel grid**. Scale by **integer factors with
nearest-neighbour** only — never bilinear, never fractional.

## Folders

- `panel/` — the window frame (9-slice) and the top ornament.
- `widgets/` — input field (9-slice), checkbox on/off, eye toggle open/closed.
- `buttons/` — LOGIN and CREATE NEW ACCOUNT with normal / hover / pressed states, text baked in.
- `text/` — every label and link as a PNG, with hover variants for the links.
- `fonts/` — bitmap font sheets + metadata (drop into `client/data/fonts`).
- `reference/` — the full rendered module (PNG) and the HTML source it came from.
- `atlas.json`, `layout.json`, `palette.json`, `palette.png` — machine-readable spec.
- `AGENT-INSTRUCTIONS.md` — paste this to Claude when asking for the rebuild.

## Two ways to render the text

1. **Baked PNGs** (`text/`) — pixel-exact, zero font work. Use for the fixed labels.
2. **Bitmap fonts** (`fonts/`) — needed for user-typed input. Two sheets:
   - `press-start-2p-16.png` — headings/labels/buttons (monospaced, 16px advance).
   - `silkscreen-16.png` — body text, checkbox labels, links, field input.
   Both are a 16x16-cell grid, 16 columns x 6 rows, ASCII 32..126, glyphs drawn white
   so they can be tinted. Per-character advances are in the matching `.json`.

## Fonts directory

Copy `fonts/*` into `D:\backlands\client\data\fonts\`. Each sheet ships with a JSON
descriptor (cell grid, first/last char, line height, ascent, per-char advance) so the
client can register it as a bitmap font and tint it with the palette colors.
