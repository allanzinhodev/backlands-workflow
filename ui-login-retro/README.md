# ui-login — retro pixel-art RPG login module

Asset + spec package for rebuilding the Astra client login screen.
Everything here is authored on a **4px pixel grid**. Scale by **integer factors with
nearest-neighbour** only — never bilinear, never fractional.

**O chrome como o cliente desenha:** as telas HTML (`Pixel *.dc.html`) usam bloco de **2px** para
moldura, insets, sombras, regras e scanlines — o mesmo peso do cliente em `derived-2px/`. Texto
nunca e reescalado.

## Folders

- `panel/` — the window frame (9-slice) and the top ornament.
- `widgets/` — input field (9-slice), checkbox on/off, eye toggle open/closed.
- `buttons/` — LOGIN and CREATE NEW ACCOUNT with normal / hover / pressed states, text baked in.
- `text/` — every label and link as a PNG, with hover variants for the links.
- `fonts/` — bitmap font sheets + metadata (drop into `client/data/fonts`).
- `derived-2px/` — the same chrome re-emitted on a 2px block grid, at the sizes `40-entergame.otui`
  expects (panel 80x80/border 20, field 60x30/border 8, checkbox 18x18, crest 60x25, buttons 296px).
  This is what the client ships; the root folders are the 4px design source. Text is never rescaled.
- `reference/` — rendered mocks (PNG) and the HTML they came from: the login module and the
  character list (`character-list.png`, next screen in the queue).
- `atlas.json`, `layout.json`, `palette.json`, `palette.png` — machine-readable spec.
- `client-files/` — os arquivos do cliente prontos para substituir os existentes
  (`40-entergame.otui`, `entergame.otui`, `entergame.lua`, `silkscreen-16.otfont`),
  com o mapa de destino e as adaptacoes de engine no seu README.
- `client-replace/` — sprites de substituicao nas **dimensoes exatas** dos existentes no
  cliente: copie por cima e a UI reskina sem tocar em OTUI/Lua.
- `AUDITORIA-CLIENTE.md` — o que existe no cliente real, o que este pacote assumia, e o diff.
- `../Pixel UI Kit.dc.html` — folha de widgets do cliente (window, mini window, botoes, fields,
  checkbox/radio, combo, tabs, barras, message box, menu, tooltip, tags), cada bloco anotado com
  o sprite e o `image-border` que o engine espera.
- `../Pixel Game UI.dc.html` — 7 telas in-game desenhadas sobre a arvore real do repo:
  paineis dockados (health, inventory, skills), hotkeys manager, waiting list / connecting / caixas
  de erro, options com abas e perfis, chat/console com canais, set outfit, npc trade.
- `skills/` — skills para enviar ao Claude (`backlands-characterlist-ui.md`).
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
