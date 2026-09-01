---
name: backlands-hud-ui
description: Reskin do HUD do cliente Backlands - game_interface (GameSidePanel, GameMapPanel, paineis de acao), game_actionbar, game_minimap e game_battle. Dimensoes reais dos widgets e o que o engine ja resolve. Use ao vestir o enquadramento do jogo na skin pixel-art.
---

# HUD

Estende **`backlands-widgets-ui`**. Mock alvo: `Pixel Game HUD.dc.html`.
O HUD e a **ultima** etapa: ele so parece certo quando as janelas dockadas ja estao vestidas.

## Dimensoes reais (cliente 1x — o mock desenha em 2x)

| Widget | Tamanho | Modulo |
|---|---|---|
| `GameSidePanel` | largura **178** | gameinterface.otui |
| `gameLeftActionPanel` / `gameRightActionPanel` | largura **36** | gameinterface.otui |
| lock dos paineis laterais | 38x16 / 34x16 | gameinterface.otui |
| `addRightPanelButton` / `removeRightPanelButton` | 9x27 | gameinterface.otui |
| `ActionButton` | **34x34** | actionbar.otui |
| `LeftSliders` / `RightSliders` | 17x34 | actionbar.otui |
| `lockPanel` da action bar | largura 12 | actionbar.otui |
| `glass` (bussola do minimapa) | 47x46 | minimap.otui |
| `floorPosition` (tira de andares) | 14x67 | minimap.otui |
| zoom in/out, cyclopedia | 20x20 | minimap.otui |
| `Download Map` | 80x18 | minimap.otui |
| `BattleIcon` | 20x20, grid 7 col, spacing 6 | battle.otui |
| `BattleWindow` | `MiniWindow` altura 166 | battle.otui |

Nove action bars no total: 3 embaixo, 3 esquerda, 3 direita — cada uma com par
visible/locked proprio nas Options.

## O que o engine ja faz

- **Cooldown** e overlay `#101010aa` sobre o slot inteiro com o numero em branco —
  nao e barrinha. So troque a cor se quiser sair do padrao.
- **Spell ativo** desenha borda propria; declare a cor no estilo, nao no Lua.
- Drag-and-drop de slot, lock, sliders de paginacao: tudo pronto.
- `game_healthcircle` **nao tem `.otui`** neste fork. Se quiser o circulo, e feature nova,
  nao reskin — trate como projeto separado.

## Ordem

1. `GameMapPanel` (moldura do viewport) — muda o enquadramento inteiro de uma vez.
2. `GameSidePanel` + os dois paineis de acao laterais.
3. `game_actionbar` — slot, sliders, lock.
4. `game_minimap` — bussola, tira de andares, botoes.
5. `game_battle` — os 12 `BattleIcon` e os dois `ComboBox` de ordenacao.

## Checklist

- [ ] Slot de action bar em 34x34 exatos; hotkey no canto superior direito.
- [ ] Cooldown como overlay, nao barra.
- [ ] Os 12 filtros do battle em grid de 7 colunas.
- [ ] Tira de andares com 8 degraus, o atual destacado.
- [ ] Comparado com `Pixel Game HUD.dc.html`.
