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

> **Nao existe mock desta tela.** `ui-login/reference/` so tem `login-module.png` e
> `login-module.dc.html`. A referencia visual e a propria tela de login mais a
> especificacao escrita abaixo, que e detalhada o bastante para construir sem mock.

---

## 1. Regra zero — nenhum sprite novo de chrome

A tela inteira sai dos sprites que ja existem em `client/data/images/ui/login/` (grid de
2px, os tamanhos que `data/styles/40-entergame.otui` espera):

| Sprite | Tamanho | 9-slice | Usa em |
|---|---|---|---|
| `panel-frame.png` | 80x80 | `image-border: 20` | janela da lista |
| `input-field.png` | 60x30 | `image-border: 8` | a **caixa da lista** |
| `ornament-crest.png` | 60x25 | — | crest no topo, `phantom` |
| `scanlines.png` | 4x4 | `image-repeated` | overlay, `phantom` |
| `btn-login.png` / `-hover` | 296x42 | — | base do **ENTER GAME** |
| `btn-login-pressed.png` | 296x40 | — | estado pressionado |
| `btn-create-account.png` / `-hover` | 296x34 | — | base do **BACK** |

Os botoes de 296px sao largos demais para o par lado a lado. Nao estique: **reconstrua a
placa faixa por faixa** na largura nova e **recole o rotulo em 1:1**, centralizado — o
pipeline da secao 4 da skill base. Rotulos novos necessarios: `BACK`, `ENTER GAME`,
`CHARACTERS`.

Bandas do primario, de cima para baixo: `gold-dk` 2, `ink` 2, `gold-hi` 2, `gold` 28,
`gold-mid` 2, `ink` 2, `gold-dk` 2, sombra projetada 2 (recuada 4px de cada lado, so na
variante normal). Total 42; a variante `-pressed` e igual sem a sombra, 40.

**Texto vivo** — nome do personagem, level, vocacao, mundo, linha da conta — nao pode ser
PNG assado. Tudo isso usa a fonte bitmap `silkscreen-16`. So rotulo fixo pode ser assado.

---

## 2. Estrutura

Medidas abaixo estao na escala **do cliente (blocos de 2px)**.

```
CharacterListWindow (352 de largura, mesma do EnterGameWindow, &static, centrada)
  CharacterListCrest         60x25, phantom, centrado na borda de cima
  CharacterListPanel         painel 9-slice, padding 16, focusable
    header (linha)
      LoginSprite  CHARACTERS        Press Start 2P, gold-hi, flush left
      UILabel      linha da conta    silkscreen-16, dim, flush right
    CharacterListBox           caixa da lista, 9-slice do campo, padding 6
      UIScrollArea + CharacterListScroll
        CharacterRow (repetido)
    footer (linha)
      CharacterListButtonBack     secundario, metade da largura
      CharacterListButtonPlay     primario, metade da largura, 10 de gap
  CharacterListScanlines      overlay, phantom, ultimo filho
```

### Header

- `CHARACTERS` — Press Start 2P, `#ebbf90`, alinhado a esquerda, sombra 1px `#000`.
- Linha da conta a direita, `silkscreen-16` `#a87f68`:
  `PREMIUM · N DAYS` quando ha dias, senao `FREE ACCOUNT`. Maiuscula sempre.
- Baseline compartilhada; 8 de gap minimo entre os dois.

### Caixa da lista

- 9-slice de `input-field.png` com `image-border: 8`. Padding interno 6.
- Altura maxima 148 (mostra 4 linhas inteiras); acima disso rola.
- A sombra interna do topo (4px no sprite de 2px) fica **dentro** da borda do 9-slice —
  e por isso que a borda e 8 e nao 6. Com 6 o engine repete a faixa de sombra pela caixa
  toda, porque `drawImage` **ladrilha** o centro.

### Linha (`CharacterRow`)

- Altura livre, padding vertical 5, padding esquerdo **14** (reservado para a seta de
  selecao), padding direito 7.
- Nome: `silkscreen-16`, `#ebbf90`, elipse quando nao cabe.
- Detalhe embaixo: `LEVEL n · VOCACAO` em maiuscula, `silkscreen-16`, `#a87f68`, 3 de gap.
- Mundo: `silkscreen-16`, `#9a6651`, alinhado a direita, largura fixa, nao encolhe.
- **A linha inteira e a area de clique**, nao so o nome.

### Selecao

Tres coisas juntas, nunca so uma:

1. anel de 2px `#c68f66` por dentro da linha (recuo 1);
2. preenchimento `rgba(198,143,102,.14)`;
3. seta em pixel 6x10 `#ebbf90` no padding esquerdo, colada a 4 da borda, centrada na vertical
   (blocos, de cima para baixo: 2x2, 4x2, 6x2, 4x2, 2x2).

Hover de linha nao selecionada: `rgba(198,143,102,.10)`, sem anel.

### Footer

`BACK` (secundario) e `ENTER GAME` (primario), mesma largura, 10 de gap. O primario e
sempre o ultimo elemento da tela, a direita.

### Scrollbar — obrigatoriamente skinada

A barra do OTClient padrao denuncia a skin antiga. 8 de largura, trilha `#0a0605` com
aresta interna preta de 2, polegar `#9a6651` (`#c68f66` no hover) com bordas laterais
pretas de 2, **sem botoes de flecha**.

---

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

- **Selecao da linha e `$focus`, nao `$active`** (correcao a esta spec, aprendida na
  implementacao). A regra "`$active`, nao `$focus`" vem da tela de login, onde cada campo e
  filho unico focavel do seu proprio contêiner e por isso os dois reportam foco ao mesmo
  tempo. Na lista **todas as linhas dividem o mesmo pai**, entao `FocusState` ("sou o filho
  focado da lista") identifica exatamente uma - que e a definicao de selecionada. `$active`
  seria errado aqui: exige a cadeia inteira focada, entao o realce sumiria assim que o
  jogador clicasse em BACK ou ENTER GAME.
- **`getChildById` nao e recursivo.** Na skin nova a lista fica dentro do painel e da caixa,
  dois niveis abaixo da janela. `charactersWindow:getChildById('characters')` devolve nil -
  use `recursiveGetChildById`. Mesma coisa para `accountStatusLabel`.
- **Cadeia de foco.** `recursiveFocus()` so sobe por ancestrais `focavel`. Se a caixa da
  lista ou o painel nao forem focaveis, teclado (setas, Enter) nunca chega.
- **`UIScrollBar` exige os botoes de flecha.** `corelib/ui/uiscrollbar.lua` chama
  `:getHeight()` em `decrementButton` e `incrementButton` sem checar nil. Para uma barra sem
  flechas, declare os dois com `size: 8 0` em vez de omitir.
- **Sprite de 9-slice precisa ser maior que 2x a borda.** Um sprite de trilha 8x4 com
  `image-border: 2` deixa o centro com altura zero e a trilha simplesmente nao desenha entre
  os cantos. 8x8 resolve. Vale para qualquer peca 9-slice fina.
- **Largura manda no texto.** Com painel de 352 a coluna de conteudo e 304. O titulo
  `CHARACTERS` (Press Start 2P 16px) come 160, sobrando 136 para a linha da conta -
  `PREMIUM - 23 DAYS` mede 188 e escreve por cima do titulo. Meca antes
  (`ui-login/fonts/silkscreen-16.json` tem os avancos) e encurte o texto, nao o contrario.
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

Chegar na tela: a lista vem **depois** do login. Tres rotas, da mais completa a mais rapida:

- **Stack local** — `tools/run-local.ps1` sobe MariaDB, servidor e cliente; logar leva a
  lista de verdade. Conta semeada em `server/schema.sql`: nome `1`, senha `1`. E a unica
  verificacao completa, mas depende do servidor subir.
- **Mod de preview descartavel** — a rota que funciona sem servidor e exercita o Lua de
  verdade. Crie `client/mods/zz_charlist_preview/` com `sandboxed: false` (o
  `client_entergame` nao e sandboxed, entao `CharacterList` e global) e um `init()` que
  **espera em loop** por `rawget(_G,'CharacterList')` antes de chamar `CL.create(...)` com
  dados falsos — a ordem de carga dos modulos nao e garantida. Apague a pasta depois.
- **`dev_otui`** (`autoload: false`) — editor com preview nativo de `.otui`. So layout e
  sprites; nao exercita o Lua nem a selecao.

Localize por pixel antes de clicar — 2px de erro ja perde o widget.

> `tools/ui-shot.ps1` reposiciona a janela antes de capturar: o cliente restaura a ultima
> posicao salva, e uma janela fora da tela sai preta no screenshot.

### Checklist

- [ ] Nenhuma posicao fracionaria; todo sprite em pixel inteiro.
- [ ] Anel + preenchimento + seta aparecem juntos na linha selecionada, e so nela.
- [ ] Linha inteira clicavel; duplo clique entra no jogo.
- [ ] Setas do teclado movem a selecao e rolam a lista.
- [ ] Scrollbar skinada, sem botoes de flecha, sem barra do OS.
- [ ] Nenhuma cor fora da paleta fechada (`probe.js at` em cada elemento novo).
- [ ] Nenhuma fonte nova registrada.
- [ ] Comparado lado a lado com a tela de login (mesma largura, mesmo crest, mesmo footer).
