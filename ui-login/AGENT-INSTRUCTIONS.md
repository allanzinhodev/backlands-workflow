# Rebuild the Astra client login module — instructions

You are rebuilding a login screen for the Astra Minecraft client from the assets in
this `ui-login` folder. Follow the spec exactly; do not invent new colors, fonts or spacing.

## Non-negotiables

- **Pixel art discipline.** Every sprite is drawn on a 4px grid. Render at integer scale
  with nearest-neighbour filtering. Never antialias, never blur, never round corners.
- **Palette** — use only `palette.json`:
  bg #080504 · panel #231815 · panel highlight #33231d · panel shadow #150e0c ·
  field #0f0a09 · ink #000000 · gold-hi #ebbf90 · gold #c68f66 · gold-mid #9a6651 ·
  gold-dark #4e2f24 · text #ebbf90 · dim #a87f68 · placeholder #6b4d40.
- **Fonts** — `Press Start 2P` (labels, buttons) and `Silkscreen` (body, links, input),
  as the bitmap sheets in `fonts/`. No other typefaces, no smoothing.

## Structure (see layout.json)

Panel 520px wide, 44px side padding, 26px between groups, frame drawn 16px outside the
panel box, ornament centered on the top edge:

1. `LOGIN` label (small) — `text/label-login.png`
2. Login field — `widgets/input-field.png` (9-slice, border 12, height 52) with the
   eye toggle at the right, 8px inset, 52x36 hit area
3. `PASSWORD` label — `text/label-password.png`
4. Password field — same field + eye toggle
5. Checkbox `Remember email` (default ON)
6. Checkbox `Remember password` (default off)
7. Checkbox `Auto login` (default off)
8. Link `Forgot password?`
9. Link `Forgot email?`
10. Button `CREATE NEW ACCOUNT` (secondary, dark fill)
11. Button `LOGIN` (primary, gold fill) — always last

## Behaviour

- Both fields start **masked**; the eye toggle reveals each independently
  (`eye-closed.png` = masked/default, `eye-open.png` = revealed).
- Checkboxes: `checkbox-off.png` / `checkbox-on.png`, 36x36, 14px gap to the label,
  14px between rows. The whole row is clickable.
- Buttons: swap to the `-hover` sprite on hover; on press use `btn-login-pressed.png`
  drawn 6px lower (its drop shadow is already removed).
- Links: swap to the `-hover` PNG; the underline is 3px, gold-dark normal / gold-hi hover.
- Focus: 4px gold-hi ring around the focused field — no OS focus ring.
- Optional: a scanline overlay over the panel (4px transparent / 4px rgba(0,0,0,0.14)).

## 9-slice notes

- `panel/panel-frame.png` — 160x160, slice border **40** (keeps the corner brackets intact),
  tile/stretch the center.
- `widgets/input-field.png` — 120x60, slice border **12**.

## Checklist before you call it done

- [ ] No fractional positions anywhere — every sprite lands on a whole pixel.
- [ ] Field order and the 3 checkboxes match the list above.
- [ ] Both eye toggles work independently and default to masked.
- [ ] Hover and pressed states present on both buttons and both links.
- [ ] Compare against `reference/login-module.png` side by side.
