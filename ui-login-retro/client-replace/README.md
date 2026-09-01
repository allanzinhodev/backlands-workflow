# client-replace — sprites de substituicao

Copie por cima dos arquivos existentes no cliente. **Nenhum OTUI ou Lua muda**: cada PNG tem as
dimensoes exatas do original e respeita os `image-border` / `image-clip` que os estilos já leem.

Destino: `D:\backlands\client\data\images\...` (mesma arvore que aqui dentro de `data/`).

## Ja existiam no cliente (medidos do repo)

| Arquivo | Tamanho | Estilo que consome |
|---|---|---|
| `ui/popupwindow.png` | 236x207 | `MainWindow` — image-border 6, top 27 |
| `ui/special_miniwindow.png` | 99x98 | `MiniWindow` — header 28 |
| `ui/buttons.png` | 43x40 | `Button` — normal sobre pressed, image-border 1 |
| `ui/buttons-blue.png` | 43x40 | `ButtonBlue` |
| `ui/button.png` | 22x69 | `ComboBox` / `TabButton` — image-border 3 |
| `ui/textedit.png` | 32x32 | `TextEdit` — image-border 3 |
| `ui/checkbox.png` | 12x36 | `CheckBox` — tres estados 12x12 empilhados |
| `ui/panel_flat.png` | 68x68 | `FlatPanel` |
| `ui/hidden-button.png` / `-down.png` | 18x18 | olho do campo de senha |
| `ui/pin-button.png` | 12x24 | pin da character list |
| `ui/separator_horizontal.png` | 189x2 | `HorizontalSeparator` |
| `ui/separator_vertical.png` / `66.png` | 2x32 / 2x66 | `VerticalSeparator` |
| `game/entergame/premium.png` | 22x19 | icone premium |
| `game/entergame/hidden.png` | 11x19 | icone hidden |
| `game/entergame/dailyreward_collected.png` | 11x19 | recompensa diaria |
| `game/entergame/maincharacter.png` | 9x8 | estrela do personagem principal |
| `game/entergame/sort-button.png` | 7x8 | seta de ordenacao |

## Novos neste pacote

| Arquivo | Tamanho | Estilo | Mapa |
|---|---|---|---|
| `ui/progressbar.png` | 16x16 | `ProgressBar` (image-border 2) | centro **transparente** — o `background-color` do widget e o preenchimento |
| `ui/progressbar_thick.png` | 16x22 | `ThickProgressBar` | idem, mais alto |
| `ui/progressbarhpmana.png` | 16x16 | `HealthBar` (border 3) e `ManaBar` (border 4) | 4 aneis pintados para os dois borders caírem em pixel desenhado |
| `ui/scrollbar.png` | 36x74 | `VerticalScrollBar`, `HorizontalScrollBar` | dec `0,0,12,12` · inc `0,12` · pressed = `+12` em x (vertical) / `+12` em y (horizontal) · slider vertical `0,24,12,14` · slider horizontal `12,26,12,12` · trilho vertical `24,0,12,74` · trilho horizontal `0,38,24,12` · dec-h `0,50` · inc-h `12,50` |
| `ui/combobox_square.png` | 98x80 | `ComboBox` (border 3, border-right 21) e `ComboBoxPopupMenu` | linhas de 20: normal `0,0` · checked `0,20` · aberto `0,40` · moldura do popup `0,60,98,20` |
| `ui/combobox_rounded.png` | 91x92 | `ComboBoxRounded` | linhas de 23, popup em `0,69,91,23` |
| `ui/item.png` | 34x34 | `Item` (padding 1) e o thumb do `NPCItemBox` | moldura opaca — o sprite do item desenha por cima |
| `ui/item66.png` | 66x66 | `BigItem` | idem, slot grande |
| `ui/miniborder.png` | 14x14 | canto de resize do `NpcWindow` | tres degraus dourados |

## Regras de desenho

1. Bloco de **2px** para moldura, inset, sombra e regra. Nada de raio, gradiente ou antialias.
2. Paleta travada em `../palette.json`: `#000000`, `#0f0a09`, `#150e0c`, `#231815`, `#33231d`,
   `#4e2f24`, `#9a6651`, `#c68f66`, `#ebbf90`.
3. Barras: vida `#c86a5a`, mana `#5a7fc8`, soul `#3f8f9a` (ciano), xp/capacidade `#c68f66`.
4. Pressed desce 1px na arte (2px na tela em 2x) e perde a sombra — nunca troca de rampa.
5. Onde o engine desenha o preenchimento por `background-color`, o centro do PNG fica
   **transparente**; onde o sprite e a moldura de fundo (slots de item), o centro e opaco.

Folha de contato: `../../Pixel Sprite Sheet.dc.html` (cada PNG em 1x e ampliado, com o clip map).
