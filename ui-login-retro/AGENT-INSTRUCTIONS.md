# Rebuild the Astra client login module — instructions

You are rebuilding a login screen for the Astra Minecraft client from the assets in
this `ui-login` folder. Follow the spec exactly; do not invent new colors, fonts or spacing.

## Non-negotiables

- **Pixel art discipline.** Every sprite is drawn on a 4px grid. Render at integer scale
  with nearest-neighbour filtering. Never antialias, never blur, never round corners.
- **Palette** — use only `palette.json`:
  bg #080504 · panel #231815 · panel highlight #33231d · panel shadow #150e0c ·
  field #0f0a09 · ink #000000 · gold-hi #ebbf90 · gold #c68f66 · gold-mid #9a6651 ·
  gold-dark #4e2f24 · text #ebbf90 · dim #a87f68 · placeholder #6b4d40. Placeholders are the literal words `login` and `password`, live text in silkscreen-16 — not baked PNGs.
- **Fonts** — `Press Start 2P` (labels, buttons) and `Silkscreen` (body, links, input),
  as the bitmap sheets in `fonts/`. No other typefaces, no smoothing.

## Two scales — read this first

The package ships the art twice:

- **Root folders** (`panel/`, `widgets/`, `buttons/`) — the design source, on a **4px block grid**.
- **`derived-2px/`** — the same chrome **re-emitted** on a **2px block grid**, already at the sizes
  the client's styles expect. **This is what the client ships.**

Chrome is block art: it can be re-emitted at any block size losslessly. **Text is not** — the
labels in `text/` and the sheets in `fonts/` are 1px-grid typography and are always **1:1**.
That is why the client's proportions don't match `layout.json`: chrome measurements are halved,
text measurements are not. Before rescaling anything, run
`node tools/pixelui/blockscale.js detect <file>` — `1px (irregular)` means it is text: leave it alone.

Buttons are never stretched. To change a button's width, rebuild the **plate** band by band at the
new block thickness and re-paste the baked **label at 1:1**, centred. `derived-2px/` was built that
way (316px source → 296px client).

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

Source (4px): `panel/panel-frame.png` 160x160 border **40**; `widgets/input-field.png` 120x60 border **12**.
Client (2px): `derived-2px/panel-frame.png` 80x80 border **20**; `derived-2px/input-field.png` 60x30 border **8**.

The engine **tiles** the 9-slice centre (`addRepeatedRects`), it does not stretch it. The field's
border must be wide enough to swallow the top inner shadow — border 8 does, border 6 lets the
shadow band into the centre where it repeats down the field.

## Checklist before you call it done

- [ ] No fractional positions anywhere — every sprite lands on a whole pixel.
- [ ] Field order and the 3 checkboxes match the list above.
- [ ] Both eye toggles work independently and default to masked.
- [ ] Hover and pressed states present on both buttons and both links.
- [ ] Compare against `reference/login-module.png` side by side.


---

# Next screen — character list

`reference/character-list.png` is the mock; `reference/character-list.dc.html` is its source.
It reuses the login vocabulary with **no new sprites** beyond what is listed here.

Structure (4px source scale — halve the chrome for the client):

1. Header row: `CHARACTERS` (Press Start 2P 11) flush left, account line
   (`PREMIUM · N DAYS` / `FREE ACCOUNT`, Silkscreen 15, dim) flush right.
2. List box: the field 9-slice, 12px inner padding, max height 296, vertical scroll.
   Each row: 10px vertical padding, 28px left padding (reserved for the selection arrow),
   name (Silkscreen 18, gold-hi) over detail (`LEVEL n · VOCATION`, Silkscreen 14, dim),
   world right-aligned (Silkscreen 14, gold-mid).
3. Selected row: 4px gold inset ring + `rgba(198,143,102,.14)` fill + a 12x20 gold-hi
   pixel arrow at left 8px. The whole row is the hit area.
4. Footer: `BACK` (secondary) and `ENTER GAME` (primary), equal width, 20px gap.

Scrollbar must be skinned, never the OS one: 16px wide, track `#0a0605` with a 4px black
inner edge, thumb `gold-mid` (`gold` on hover) with 4px black side borders, no arrow buttons.

New text sprites needed if you bake labels: `CHARACTERS`, `BACK`, `ENTER GAME`, and the
account line — but the account line and every row are **live text**, so they must use the
`silkscreen-16` bitmap font, not baked PNGs.


## Telas seguintes (ja desenhadas)

Depois do login e da character list, o pacote cobre o resto da UI em duas folhas:

- **`Pixel UI Kit.dc.html`** — vocabulario de widgets. Cada bloco nomeia o sprite
  (`popupwindow.png`, `special_miniwindow.png`, `buttons.png`, `textedit.png`, `checkbox.png`,
  `button.png`) e o `image-border` correspondente. Use-a como referencia ao escrever qualquer
  `.otui` novo: se um widget nao aparece ali, ele nao existe no reskin.
- **`Pixel Game UI.dc.html`** — 7 telas in-game, lidas da arvore real:
  `game_healthinfo`, `game_skills`, `game_inventory`, `game_hotkeys/hotkeys_manager`,
  `client_entergame/waitinglist`, `client_options` (JSON em `/settings/clientoptions.json`),
  `game_console` (canais, say modes, Chat On/Off) e `game_npctrade` (`NPCItemBox` 35px,
  fundo `#404040` / `#585858` quando marcado).

Regras que valem para todas:

1. Chrome em blocos de **2px**; nada de raio, gradiente ou antialias.
2. Pressed desce 2px e perde a sombra projetada — nunca troca de rampa de cor.
3. Painel dockado = `MiniWindow` (header 28px no cliente, 44px em 2x) com minimise/close 12x12.
4. Barras: trilho `#0f0a09` com inset preto, preenchimento com **uma** linha de realce no topo.
   Vida `#c86a5a`, mana `#5a7fc8`, soul ciano `#3f8f9a`, xp/capacidade ouro `#c68f66`.
5. Sprites novos entram em `client-replace/` nas dimensoes exatas dos existentes.
