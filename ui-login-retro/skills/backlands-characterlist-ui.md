---
name: backlands-characterlist-ui
description: Especificacao pixel-art da tela de character list do cliente Backlands (AstraClient/OTClient) - estrutura, widgets OTUI, sprites derivados, comportamento e loop de verificacao. Use ao reconstruir modules/client_entergame/characterlist.otui na skin nova, ou ao criar qualquer lista rolavel de itens selecionaveis na UI do cliente.
---

# Character list — skin pixel art

Repositorio: **`client/`** (AstraClient, fork OTClient, protocolo 8.60).
Esta skill **estende** `backlands-client-ui`: paleta, grid de blocos, pipeline de sprites,
armadilhas do engine e loop de verificacao valem todos. Leia aquela primeiro.

Objetivo: trocar a skin antiga do Tibia em
`client/modules/client_entergame/characterlist.otui` pela mesma linguagem da tela de login,
que ja esta pronta e verificada. A tela de login e a referencia viva — se algo aqui divergir
dela, a login vence.

Mock alvo: `ui-login/reference/character-list.png` (2x da escala do cliente: 745x429 -> 1490x858)
Fonte do mock: `ui-login/reference/character-list.dc.html`

---

## 1. O que a tela real tem (lido de characterlist.otui, 16 KB)

A tela **nao** e uma lista simples. `StaticMainWindow` `charactersWindow`, titulo
`Select Character`, `size: 745 429`. Reaproveite estes widgets — nao invente equivalente:

| Widget real | Estilo | O que e |
|---|---|---|
| `characters` | `TextList`, altura 278, `background-color: #565656` | a lista, com `vertical-scrollbar: characterListScrollBar` e `auto-focus: first` |
| `characterListScrollBar` | `VerticalScrollBar`, `step: 14`, `pixels-scroll: true` | a barra |
| `characterTable` | `UIWidget` 713x17 com `border-color-*` | o cabecalho, desenhado com **bordas**, nao sprite |
| `characterSort` / `statusSort` / `levelSort` / `vocationSort` / `worldSort` | `UIButton` | colunas ordenaveis, larguras **277 / 53 / 48 / 113 / 211** |
| `CharacterWidgetOn` | altura **66** | linha com outfit |
| `CharacterWidgetOff` | altura **29** | linha sem outfit |
| `outfit` | `UICreature` 64x64, `idle-animate: true` | o boneco — **animado, nao e sprite estatico** |
| `pin` | `UIButton` 12x12, `/images/ui/pin-button` | fixa no topo, `visible: false` por padrao |
| `main` | 9x8, `/images/game/entergame/maincharacter` | marca do personagem principal |
| `statusDailyReward` / `statusHidden` | 11x19 | icones de status |
| `separator_vertical66` | `UIWidget` | os divisores de coluna, em `margin-left` **fixo**: 277, 332, 382, 497 |
| `accountStatusIcon` | 22x20, `/images/game/entergame/premium` | selo da conta |
| `buttonHidden` / `buttonOutfit` / `recordPanel` | `FlatLabel` + `CheckBox` | as tres caixas do rodape |
| `buttonOk` / `buttonCancel` | `Button` 43x20 | **Ok** e **Cancel** — nao "ENTER GAME"/"BACK" |

Comportamentos que ja existem e voce **nao** deve reimplementar:

- `@onSetup` liga `Up`/`Down` a `focusPreviousChild`/`focusNextChild` do `characters`.
- `@onEnter: CharacterList.doLogin()`, `@onEscape: CharacterList.hide(true)`.
- `onUpdateOnStates(self)` no `@onFocusChange` e `@onSetup` de cada linha — **e assim que
  a selecao pinta**, via estado `$on`, nao com anel desenhado por voce.
- `setupSortButton(self, "level", 3)` faz a ordenacao. `onPinCharacter(self)` fixa.
- `onShowOutfits(self, checked)` troca `CharacterWidgetOn` por `Off` — e por isso que
  existem **dois** estilos de linha.
- `checkBoxHidden` esta `enabled: false` e `checked: true`: decorativo hoje.

## 2. Regra zero — reskin por estilo, nao por arvore

A arvore ja faz tudo. O trabalho e **vestir**:

1. `characters`: `background-color: #565656` -> `#0f0a09`.
2. `characterTable`: `background-color: #363636` -> `#150e0c`; `border-color-top/left`
   `#1B1B1A` -> `#000000`; `border-color-right/bottom` `#6b6b6b` -> `#9a6651`.
3. Todo `color: \$var-text-cip-color` das `Label` de linha -> `#ebbf90`; a segunda linha do
   `worldName` (`&baseText: '%s\n(%s)'`) fica `#a87f68`.
4. `$on` de cada `Label` hoje repete a mesma cor (no-op). Use-o: `color: #ebbf90` no `$on`
   e `#a87f68` na base — a selecao passa a ler sem voce desenhar anel nenhum.
5. Sprites a substituir **nas dimensoes exatas** (ver `ui-login/client-replace/`):
   `separator_vertical66`, `separator_vertical`, `separator_horizontal`, `pin-button`
   (12x24, dois estados), `sort-button` (7x8, dois estados de 7x4),
   `entergame/premium` (22x20), `entergame/dailyreward_collected` (11x19),
   `entergame/hidden` (11x19), `entergame/maincharacter` (9x8).
   `popupwindow`, `checkbox`, `buttons` e `panel_flat` **ja** foram trocados pela login —
   esta tela herda de graca.
6. `VerticalScrollBar`: skinar pelo estilo dela em `data/styles/`, sem botoes de flecha.

**Nao** troque `UICreature` por sprite: o boneco e animado (`idle-animate`) e desenhado
pelo engine a partir do outfit do personagem.

## 3. Comportamento (`characterlist.lua`)

- Um personagem sempre selecionado; ao abrir, o ultimo jogado, senao o primeiro.
- Duplo clique na linha entra no jogo. `Enter` entra com o selecionado. `Esc` = BACK.
- Setas cima/baixo movem a selecao e **rolam a lista para manter a selecao visivel**.
- `ENTER GAME` desabilitado quando a lista esta vazia (opacidade 45%, sem hover).
- Auto login, quando armado pela tela de login, dispara **uma vez** e entra direto — nao
  repete se o jogador voltar para esta tela.
- Som de clique via `g_sounds.play(...)` no `@onClick`. `setClickSound` e no-op neste fork.

---

## 4. Armadilhas que esta tela vai encostar

Todas ja custaram horas na tela de login:

- **`$active`, nao `$focus`.** `FocusState` e relativo ao pai imediato; a linha selecionada
  dentro do scroll area reporta foco errado. Use `ActiveState`.
- **Cadeia de foco.** `recursiveFocus()` so sobe por ancestrais `focusable`. Se a caixa da
  lista ou o painel nao forem focaveis, teclado (setas, Enter) nunca chega.
- **Estado so reverte o que a base declara.** Se `$checked`/`$pressed` mexe em `image-rect`,
  `background-color` ou `image-source`, **declare a propriedade na base tambem**, senao
  `updateStyle()` nao volta atras.
- **9-slice ladrilha, nao estica.** Vale para a caixa da lista e para a linha selecionada.
- **Orcamento de fonte.** O atlas de texto (2048x2048, sem `BIG_FONTS`) esta cheio. Esta tela
  **nao pede fonte nova** — usa `silkscreen-16`, ja registrada. Se voce achar que precisa de
  outra, esta errado: reveja a hierarquia por tamanho e cor.
- **OTML.** Indentacao de 2 espacos, tab e erro fatal, comentario e `//`, `prev` e o irmao
  anterior, ancora para `parent` usa o padding rect.

---

## 4.5 O que a tela de login precisou no cliente (herde, nao redescubra)

Estas adaptacoes ja estao aplicadas em `ui-login/client-files/` e valem para esta tela
tambem. Leia `ui-login/client-files/README.md` antes de escrever OTUI.

1. Anel de foco por `$active`, nunca `$focus`.
2. Todo contenedor no caminho ate a janela com `focusable: true` — inclui a caixa da lista
   e o scroll area, senao setas e Enter nao chegam.
3. Campo 9-slice com `image-border: 8` (sprite 60x30): a borda engole os aneis **e** a
   sombra interna do topo. Vale igual para a caixa da lista.
4. Toda propriedade mexida por `$estado` declarada tambem na **base** — `image-rect`,
   `image-source`, `background-color`. Senao `updateStyle()` nao reverte.
5. `placeholder-align: topLeft` em qualquer `UITextEdit`.
6. Som de clique com `g_sounds`; `setClickSound` e stub neste fork.
7. `setTextHidden` depende do fix em `src/framework/ui/uitextedit.cpp` — mexer em `src/`
   exige recompilar.
8. Nenhuma fonte nova: o atlas 2048x2048 esta cheio (a `silkscreen-16` entrou no lugar da
   `Verdana-11px-italic`, desativada).
9. Rotulo fixo = `LoginSprite` `phantom` filho do widget clicavel; texto vivo =
   `silkscreen-16`.
10. `40-entergame.otui` e o catalogo unico: **estenda com `<`**, nunca duplique estilo.
    Alterar um estilo base afeta login e background junto — e intencional.

---

## 5. Loop de verificacao — obrigatorio

Mesmo loop da skill base, sem atalho:

```bash
node tools/otui-lint.js client/data/styles/40-entergame.otui \
  client/modules/client_entergame/characterlist.otui
vcpkg/packages/luajit_x64-windows-static/tools/luajit/luajit.exe \
  tools/lua-syntax.lua client/modules/client_entergame/characterlist.lua
powershell -File tools/ui-shot.ps1 -Out shot.png
node tools/pixelui/probe.js find shot.png "#4e2f24" 6
node tools/pixelui/probe.js crop shot.png zoom.png 560 120 400 520 2
node tools/pixelui/probe.js at  shot.png 900 369
```

Chegar na tela: a lista vem **depois** do login, entao `ui-shot.ps1` precisa autenticar
antes de fotografar (credencial salva + auto login, ou `SetCursorPos`/`SendKeys` como na
secao 6.5 da skill base). Localize por pixel antes de clicar — 2px de erro ja perde o widget.

### Checklist

- [ ] Nenhuma posicao fracionaria; todo sprite em pixel inteiro.
- [ ] Anel + preenchimento + seta aparecem juntos na linha selecionada, e so nela.
- [ ] Linha inteira clicavel; duplo clique entra no jogo.
- [ ] Setas do teclado movem a selecao e rolam a lista.
- [ ] Scrollbar skinada, sem botoes de flecha, sem barra do OS.
- [ ] Nenhuma cor fora da paleta fechada (`probe.js at` em cada elemento novo).
- [ ] Nenhuma fonte nova registrada.
- [ ] Comparado lado a lado com `ui-login/reference/character-list.png`.
