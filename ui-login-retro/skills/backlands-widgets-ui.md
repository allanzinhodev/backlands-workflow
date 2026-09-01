---
name: backlands-widgets-ui
description: Vocabulario de widgets da skin pixel-art do cliente Backlands (AstraClient/OTClient) - quais sprites trocar, com que dimensao e image-border, e como vestir Window, MiniWindow, Button, TextEdit, CheckBox, ComboBox, TabBar, ProgressBar, ScrollBar, PopupMenu. Use antes de escrever qualquer .otui novo na skin.
---

# Widgets — a base de tudo

Repositorio: **`client/`** (AstraClient, fork OTClient). Esta skill e a **base**: as skills de
tela (`backlands-characterlist-ui`, `backlands-gamewindows-ui`, `backlands-hud-ui`) assumem
que voce leu esta.

Mock alvo: `Pixel UI Kit.dc.html` (na raiz do projeto). Se algo divergir dele, o mock vence.

## 1. Regra zero

Reskin acontece em **`data/styles/`** e em **PNG**, quase nunca na arvore do modulo.
Se voce esta reescrevendo hierarquia de widget para mudar aparencia, parou no lugar errado.

- Bloco de **2px** para moldura, inset, sombra e regra. Nada de raio, gradiente, antialias.
- Paleta fechada em `ui-login/palette.json`: `#000000`, `#0f0a09`, `#150e0c`, `#231815`,
  `#33231d`, `#4e2f24`, `#9a6651`, `#c68f66`, `#ebbf90`.
  Barras saem dela: vida `#c86a5a`, mana `#5a7fc8`, soul `#3f8f9a`, xp/cap `#c68f66`.
- Pressed **desce 2px e perde a sombra projetada**. Nunca troca de rampa de cor.
- Texto nunca e reescalado. Fonte nova: **nao existe** (atlas 2048x2048 cheio).

## 2. Sprites — dimensao exata, senao o 9-slice quebra

Ja trocados pela tela de login (herdados de graca por qualquer tela nova):

| Sprite | Tamanho | Estilo | image-border |
|---|---|---|---|
| `ui/popupwindow.png` | 236x207 | `MainWindow` / `StaticMainWindow` | 6, top 27 |
| `ui/special_miniwindow.png` | 99x98 | `MiniWindow` | header 28 |
| `ui/buttons.png` | 43x40 | `Button` (normal sobre pressed) | 1 |
| `ui/buttons-blue.png` | 43x40 | `ButtonBlue` | 1 |
| `ui/button.png` | 22x69 | `ComboBox`, `TabButton` | 3 |
| `ui/textedit.png` | 32x32 | `TextEdit` | 3 |
| `ui/checkbox.png` | 12x36 | `CheckBox` (3 estados 12x12) | — |
| `ui/panel_flat.png` | 68x68 | `FlatPanel` | 4 |

Gerados no pacote novo (`ui-login/client-replace/data/images/ui/`):

| Sprite | Tamanho | Estilo | Mapa |
|---|---|---|---|
| `progressbar.png` | 16x16 | `ProgressBar` | centro **transparente** — o `background-color` do widget e o preenchimento |
| `progressbar_thick.png` | 16x22 | `ThickProgressBar` | idem |
| `progressbarhpmana.png` | 16x16 | `HealthBar` (border 3), `ManaBar` (border 4) | 4 aneis pintados |
| `scrollbar.png` | 36x74 | `VerticalScrollBar`, `HorizontalScrollBar` | dec `0,0,12,12`; inc `0,12`; pressed `+12` em x (vertical) / y (horizontal); slider-v `0,24,12,14`; slider-h `12,26,12,12`; trilho-v `24,0,12,74`; trilho-h `0,38,24,12`; dec-h `0,50`; inc-h `12,50` |
| `combobox_square.png` | 98x80 | `ComboBox` (border 3, border-right 21) | linhas de 20: normal `0,0`, checked `0,20`, aberto `0,40`, popup `0,60,98,20` |
| `combobox_rounded.png` | 91x92 | `ComboBoxRounded` | linhas de 23, popup `0,69,91,23` |
| `item.png` | 34x34 | `Item` (padding 1), thumb do `NPCItemBox` | moldura opaca |
| `item66.png` | 66x66 | `BigItem` | moldura opaca |
| `miniborder.png` | 14x14 | canto de resize do `NpcWindow` | — |

Folha de contato: `Pixel Sprite Sheet.dc.html`. Detalhe por arquivo:
`ui-login/client-replace/README.md`.

## 3. Armadilhas do engine (todas ja custaram horas)

1. **`$active`, nao `$focus`.** `FocusState` e relativo ao pai imediato.
2. **Cadeia de foco:** todo contenedor ate a janela precisa de `focusable: true`, senao
   setas e Enter nunca chegam.
3. **Estado so reverte o que a base declara.** Se `$checked`/`$pressed` mexe em
   `image-rect`, `image-source` ou `background-color`, **declare na base tambem**.
4. **9-slice ladrilha, nao estica.** O centro do sprite tem que ser cor chapada.
5. **`placeholder-align: topLeft`** em todo `UITextEdit` — sem isso o placeholder cai no
   fundo por dupla centralizacao.
6. **`image-border` engole aneis e sombras.** Conte os pixels antes de escolher o valor.
7. **OTML:** 2 espacos, tab e erro fatal, comentario `//`, `prev` = irmao anterior.
8. **Som:** `g_sounds.play(...)` no `@onClick`; `setClickSound` e stub neste fork.
9. **Catalogo unico:** estenda com `<`, nunca duplique estilo.

## 4. Loop de verificacao

```bash
node tools/otui-lint.js client/data/styles/<arquivo>.otui
powershell -File tools/ui-shot.ps1 -Out shot.png
node tools/pixelui/probe.js find shot.png "#4e2f24" 6
node tools/pixelui/probe.js at  shot.png <x> <y>
```

### Checklist

- [ ] Sprite novo tem a **mesma dimensao** do que substituiu.
- [ ] Nenhuma cor fora da paleta (`probe.js at` em cada elemento novo).
- [ ] Pressed desce 2px e volta ao soltar.
- [ ] Nenhuma fonte nova registrada.
- [ ] Comparado lado a lado com `Pixel UI Kit.dc.html`.
