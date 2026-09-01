---
name: backlands-gamewindows-ui
description: Reskin das janelas in-game do cliente Backlands - healthinfo, inventory, skills, hotkeys manager, waitinglist, client_options, game_console e game_npctrade. Estrutura real de cada modulo, o que trocar e o que nao tocar. Use ao vestir qualquer janela do jogo na skin pixel-art.
---

# Janelas in-game

Estende **`backlands-widgets-ui`** — paleta, sprites, armadilhas e loop valem todos.
Mock alvo: `Pixel Game UI.dc.html` (seletor de tela no topo). O mock vence em divergencia.

## Ordem sugerida

Do mais barato ao mais caro. Cada uma so depende dos widgets ja trocados:

1. **`game_healthinfo`** — `NonClosableMiniWindow` altura 122. So barras e icones de
   condicao. Melhor primeira tela: valida `progressbarhpmana.png` inteiro.
2. **`game_skills`** — `MiniWindow` altura 150, `verticalBox` rolavel. Valida o
   `scrollbar.png` novo e as barras verdes (`#00c000`) das skills.
3. **`game_inventory`** — `NonClosableMiniWindow` altura 170. Slots `slot1`..`slot10`
   usam `item.png`/`item66.png`. Fight/chase mode sao `UIButton` com `$checked`.
4. **`client_entergame/waitinglist`** — janela pequena, so `MainWindow` + `ProgressBar`.
5. **`game_hotkeys/hotkeys_manager`** — `MainWindow` grande: `TextList`, `ComboBox`,
   `TextEdit`, `CheckBox`, `Item` preview. Primeira tela que usa **todos** os widgets.
6. **`client_options`** — abas + perfis. Os valores vivem em
   `/settings/clientoptions.json`; **nao mexa no schema**, so na aparencia.
7. **`game_console`** — canais, say modes, Chat On/Off. `chatOptions.chatModeOn` ja existe.
8. **`game_npctrade`** — `NPCItemBox` com fundo `#404040` e `#585858` quando marcado;
   esses dois cinzas sao do modulo, **nao** da paleta: troque-os junto.

## Regras por tipo de painel

- **Painel dockado** = `MiniWindow`. Header 28 no cliente, minimise/close 12x12.
  Nao invente header proprio: o sprite `special_miniwindow.png` ja desenha.
- **Barras**: trilho `#0f0a09` com inset preto, preenchimento com **uma** linha de realce
  no topo. Cores no item 1 da skill base.
- **Listas** (`TextList`): `background-color` `#0f0a09`, selecao por `$on`/`$active`,
  nunca por anel desenhado a mao.
- **Item slots**: `item.png` 34x34 / `item66.png` 66x66. O sprite do item desenha por cima —
  a moldura e opaca de proposito.

## O que **nao** tocar

- `UICreature` (bonecos) — desenhado pelo engine.
- Schema do `clientoptions.json`, ids de canal, ordem dos slots de equipamento.
- Logica de cooldown, AP, ordenacao — tudo ja existe no `.lua`.

## Checklist

- [ ] Cada janela comparada com sua tela no `Pixel Game UI.dc.html`.
- [ ] Barras nas cores certas (vida/mana/soul/xp).
- [ ] Scroll skinado, sem botao de flecha do OS.
- [ ] `#404040`/`#585858` do npctrade trocados.
- [ ] Nenhuma fonte nova, nenhuma cor fora da paleta.
