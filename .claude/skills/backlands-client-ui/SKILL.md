---
name: backlands-client-ui
description: Design system pixel-art da UI do cliente Backlands (AstraClient/OTClient) - paleta, grid de blocos, catálogo de widgets OTUI, pipeline de geração de sprites e armadilhas do engine. Use sempre que a tarefa for criar, alterar ou revisar qualquer tela do cliente (login, character list, janelas do jogo, HUD, diálogos), montar novos widgets OTUI, gerar/redimensionar sprites de UI, ou mexer em data/styles/*.otui, modules/client_*/*.otui e data/images/ui/. Traz também o loop obrigatório de verificação (build, screenshot, medição por pixel) e o estado atual de cada tela.
---

# UI do cliente Backlands — design system pixel art

Repositório: **`client/`** (AstraClient, fork OTClient, protocolo 8.60). Diga isso na
primeira frase da resposta quando esta skill estiver ativa.

A tela de login já foi construída neste sistema e é a **referência viva**: qualquer tela
nova deve sair consistente com ela. Leia a seção 3 antes de inventar widget.

---

## 1. Onde as coisas estão

| O quê | Caminho |
|---|---|
| Estilos dos widgets pixel | `client/data/styles/40-entergame.otui` |
| Sprites da UI pixel | `client/data/images/ui/login/` |
| Fonte bitmap dos textos vivos | `client/data/fonts/silkscreen-16.otfont` + `.png` |
| Árvore da tela de login | `client/modules/client_entergame/entergame.otui` |
| Lógica do login | `client/modules/client_entergame/entergame.lua` |
| Fundo + toggles da tela de login | `client/modules/client_background/background.otui` |
| **Pacote-fonte do design** (spec + arte original 2x) | `ui-login/` na raiz do workspace |
| Ferramentas de sprite | `tools/pixelui/` (`blockscale.js`, `probe.js`, `pngcodec.js`) |
| Screenshot do cliente | `tools/ui-shot.ps1` |
| Lint de OTML / Lua | `tools/otui-lint.js`, `tools/lua-syntax.lua` |

`ui-login/` é a **fonte**, não o destino: `atlas.json`, `layout.json`, `palette.json` e
`AGENT-INSTRUCTIONS.md` descrevem a arte original em 2x. O que está em
`client/data/images/ui/login/` é derivado dela. Ao precisar de um sprite novo, derive de
`ui-login/` com as ferramentas da seção 4 — não redesenhe à mão.

---

## 2. As duas leis

### Lei 1 — chrome tem grid de blocos, texto não

Toda a moldura (painel, campo, checkbox, olho, crest) é desenhada sobre um **grid de
blocos**: a arte original de `ui-login/` está em blocos de 4px. Isso pode ser
**reemitido** em qualquer outro tamanho de bloco sem perda — é redesenho, não resample.

O texto **não**. Os rótulos (`label-login.png`, `remember-email.png`, os nomes dentro dos
botões) e as folhas de fonte são tipografia rasterizada em grid de 1px. Reduzir vira
mingau.

**Consequência prática:** a UI atual roda com o **chrome em blocos de 2px** (metade do
pacote original) e **todo texto em 1:1**. É por isso que as proporções não batem com
`ui-login/layout.json` — as medidas de chrome são a metade, as de texto não.

Antes de rescalar qualquer sprite:

```bash
node tools/pixelui/blockscale.js detect <arquivo.png>
```

Se responder `block grid: 1px (irregular)`, **não rescale**.

### Lei 2 — paleta fechada

Só estas cores. Nada de inventar tom intermediário.

| Papel | Hex | Uso |
|---|---|---|
| bg | `#080504` | fundo geral |
| panel | `#231815` | preenchimento do painel |
| panel-hi | `#33231d` | realce 2px no topo do painel |
| panel-dk | `#150e0c` | sombra 2px na base / fundo de botão secundário |
| field | `#0f0a09` | interior de campo e checkbox |
| ink | `#000000` | anel interno de tudo |
| gold-hi | `#ebbf90` | texto, tick, anel de foco, realce do botão primário |
| gold | `#c68f66` | preenchimento do botão primário, cantoneiras |
| gold-mid | `#9a6651` | anel externo em repouso |
| gold-dk | `#4e2f24` | anel mais externo |
| dim | `#a87f68` | texto secundário |
| placeholder | `#6b4d40` | placeholder de campo |

---

## 3. Catálogo de widgets (`data/styles/40-entergame.otui`)

Reutilize. Só crie estilo novo quando nenhum destes servir, e nesse caso derive de um
existente com `<`.

| Estilo | Base | Tamanho | Observação |
|---|---|---|---|
| `EnterGameWindow` | `UIWindow` | 352x489 | janela raiz, `&static`, centrada |
| `LoginPanel` | `UIWidget` | 352x466 | moldura 9-slice, `image-border: 20`, padding 32 |
| `LoginCrest` | `UIWidget` | 60x25 | ornamento no topo, `phantom` |
| `LoginScanlines` | `UIWidget` | 336x450 | overlay 2px/2px, `image-repeated`, `phantom` |
| `LoginSprite` | `UIWidget` | por instância | rótulo de texto assado, `phantom` |
| `LoginField` | `UIWidget` | altura 34 | 9-slice `image-border: 8`, `$active` = anel dourado |
| `LoginInput` | `UITextEdit` | preenche o pai | silkscreen-16, mascarado por padrão |
| `LoginEyeToggle` | `UICheckBox` | 29x21 | olho revelar/mascarar, `$checked` = revelado |
| `LoginCheckBox` | `UICheckBox` | altura 18 | caixa 18x18 fixada à esquerda por `image-rect` |
| `LoginLinkForgotPassword` / `...Email` | `UIButton` | 186x19 / 140x19 | link com sublinhado, `$hover` troca sprite |
| `LoginButtonSecondary` | `UIButton` | altura 34 | botão escuro, afunda 2px em `$pressed` |
| `LoginButtonPrimary` | `UIButton` | altura 42 | botão dourado, sprite `-pressed` desenhado 3px abaixo |

### Checkbox com legenda: dois padrões

- **Legenda fixa** (as três opções do login): `LoginCheckBox` com um `LoginSprite`
  `phantom` filho, `margin-left: 23`, `margin-top: 4`. A linha inteira fica clicável
  porque o widget é a linha, não a caixa.
- **Legenda viva / traduzível** (os toggles Sound e Animation do background):
  `LoginCheckBox` + um `UILabel` irmão em `silkscreen-16` `#ebbf90`, ancorado
  `anchors.right: <caixa>.left` com `margin-right: 12`. É o padrão vigente em
  `background.otui`.

> `PixelCheckBox` (linha 141 do arquivo de estilos) ficou **órfão** quando o segundo
> padrão foi adotado. Ou use-o, ou remova — hoje ninguém referencia.

---

## 4. Pipeline de sprites

### Rescalar chrome

```bash
node tools/pixelui/blockscale.js detect ui-login/widgets/input-field.png
node tools/pixelui/blockscale.js scale ui-login/widgets/input-field.png out.png 4 2
```

`4 2` = blocos de 4px viram 2px (metade). `4 5` = 1.25x. A ferramenta **recusa** rescalar
arte que não seja uniforme no grid informado, o que é a proteção contra estragar texto.

### 9-slice: o engine **ladrilha**, não estica

`UIWidget::drawImage` usa `addRepeatedRects`. A região central é repetida em ladrilho, o
que é perfeito para pixel art — e é uma armadilha quando a região central não é uniforme:

- **`LoginField`** usa `image-border: 8` num sprite 60x30. Com borda 8 o anel dourado, o
  anel preto **e toda a sombra interna do topo** ficam dentro da borda, deixando o centro
  como preenchimento liso. Aí a altura fica livre. Com `image-border: 6` a faixa de sombra
  entra no centro e se **repete** ao esticar. Se criar campo novo, respeite isso.
- **`LoginPanel`** usa `image-border: 20` num sprite 80x80: preserva anéis, realce, sombra
  e as cantoneiras douradas.

### Botões: a placa é reconstruída, o rótulo é recolado

O rótulo é tipografia assada no sprite, então o botão não pode ser esticado nem rescalado.
Para gerar um botão de outra largura: reconstrua a **placa** faixa por faixa (as bandas
horizontais de cor, cada uma na espessura do novo grid) e **recole o rótulo em 1:1**
centralizado, copiando só os pixels que diferem da cor lisa daquela linha. Foi assim que
os botões de 296px foram feitos a partir dos originais de 316px.

Bandas do botão primário, de cima para baixo: `gold-dk`, `ink`, realce `gold-hi`,
preenchimento `gold`, sombra `gold-mid`, `ink`, `gold-dk`, e por fim a sombra projetada
(preta, recuada 4px de cada lado) só na variante normal — a variante `-pressed` não tem
sombra e é desenhada mais abaixo para o botão parecer afundar.

### Texto vivo

Quem precisa de texto que muda (input do jogador, rótulo traduzível) usa a fonte bitmap
`silkscreen-16`. Quem tem texto fixo pode usar PNG assado de `ui-login/text/`.

---

## 5. Armadilhas do engine (todas custaram horas)

**Atlas de fontes está no limite.** O atlas de texto é fixo em 2048x2048
(`Atlas::init`, sem `BIG_FONTS`) e já estava cheio. Registrar **uma** fonte a mais aborta
o cliente com `[Atlas] Out of space for new fonts`. Para caber a `silkscreen-16` foi
preciso desativar `Verdana-11px-italic.otfont` (renomeada para `.otfont.disabled`, sem
referências no projeto). Precisa de outra fonte? Desative mais uma, ou recompile com
`-DBIG_FONTS`. Fonte ausente **não** derruba o cliente: loga `font 'x' not found` e cai no
default.

**Cadeia de foco.** `recursiveFocus()` só sobe por ancestrais `focusable`. Um `UITextEdit`
dentro de contêineres com `focusable: false` **nunca recebe teclado**. Todo contêiner no
caminho até a janela precisa de `focusable: true`. Foi por isso que `LoginPanel` e
`LoginField` são focáveis.

**`$active`, não `$focus`, para "tem o cursor".** `FocusState` é relativo ao pai imediato,
então dois campos, cada um filho único focável do seu contêiner, reportam ambos "focado".
`ActiveState` percorre a cadeia inteira. O anel dourado do campo usa `$active`.

**Estilo de estado só reverte o que a base declara.** `updateStyle()` restaura uma
propriedade lendo o valor da **base**. Se `$pressed` define `image-rect` e a base não
define, ao soltar o botão a propriedade **não volta**. Sempre declare na base toda
propriedade que algum `$estado` altera.

**Placeholder de `UITextEdit` centraliza duas vezes.** O placeholder é desenhado dentro de
uma área que `text-align` já centralizou, e é centralizado de novo — cai no fundo do
campo. Use `placeholder-align: topLeft`.

**`setClickSound` é no-op.** `corelib/globals.lua` faz
`UIWidget.setClickSound or function(self, sound) return self end` e a função não existe no
C++ deste fork. O `setClickSound(2774)` do `uibutton.lua` não toca nada. Som de clique tem
que ser `g_sounds.play(...)` no `@onClick`.

**`setTextHidden` estava quebrado** (ignorava o argumento e sempre mascarava). Corrigido em
`src/framework/ui/uitextedit.cpp`. **Qualquer mudança em `src/` exige recompilar** — ver
seção 6.

**OTML.** Indentação de exatamente 2 espaços, tab é erro fatal, comentário é `//`.
`prev` = **widget irmão anterior** (comentários não contam). Âncoras para `parent` usam o
**padding rect** do pai, não o rect completo.

**Áudio.** Só **Ogg Vorbis**. `SoundFile::loadSoundFile` valida pelos magic bytes `OggS` e
o decoder é libvorbisfile — Opus em container Ogg passa no magic e falha no decode. WAV e
MP3 não existem. `SoundChannel::enqueue` faz `std::shuffle` na fila: várias faixas tocam
em ordem aleatória.

---

## 6. Loop de verificação — obrigatório

Nada de "deve estar certo". O cliente é a única coisa que renderiza OTUI.

**1. Lint antes de rodar** — barato e pega o que derruba o cliente na carga.

```bash
# OTML: indentação de 2, sem tabs, sem salto de profundidade, sintaxe de nó
node tools/otui-lint.js client/data/styles/40-entergame.otui client/modules/.../tela.otui

# Lua: só compila, não executa
vcpkg/packages/luajit_x64-windows-static/tools/luajit/luajit.exe \
  tools/lua-syntax.lua client/modules/.../arquivo.lua
```

Não tente checar Lua com `luajit -e '...' arquivo.lua`: o luajit roda o `-e` **e depois
executa o arquivo**, que num módulo do cliente estoura no primeiro global que só existe em
runtime. Use `tools/lua-syntax.lua`.

**2. Recompilar (só se mexeu em `src/`)**

```bash
"/c/Program Files/Microsoft Visual Studio/18/Enterprise/MSBuild/Current/Bin/MSBuild.exe" \
  client/vc23/otclient.sln -p:Configuration=OpenGL -p:Platform=x64 -m -v:minimal
```

Se o link falhar com `LNK1104: cannot open file otclient_gl_x64.exe`, há um cliente
rodando segurando o binário. Mate o processo e relinke. O `.exe` está no `.gitignore`.

**3. Rodar e fotografar**

```bash
powershell -File tools/ui-shot.ps1 -Out shot.png
```

Sobe o cliente, espera a tela de login, fotografa a janela, mata o processo e imprime
qualquer `ERROR`/`FATAL` do log (ignorando os de áudio, esperados em máquina sem
dispositivo de som). A imagem é **relativa à janela**: pixel (0,0) é o canto da janela.

**4. Medir, não olhar**

```bash
node tools/pixelui/probe.js find shot.png "#4e2f24" 6     # localizar o painel
node tools/pixelui/probe.js crop shot.png zoom.png 560 120 400 520 2
node tools/pixelui/probe.js col  shot.png 900 360 400     # dump de uma coluna
node tools/pixelui/probe.js at   shot.png 900 369         # um pixel
```

"O anel está `#ebbf90` ou `#9a6651`?" tem resposta exata. Use-a — foi assim que se
descobriu que o anel de foco não acendia e que o mascaramento não revertia.

**5. Testar interação de verdade.** Clique e digite via `SetCursorPos` + `mouse_event` +
`SendKeys` do PowerShell, fotografando entre os passos. Cuidado: coordenada errada por 2px
já erra o widget — localize por pixel (passo 4) antes de clicar.

---

## 7. Estado atual

**Pronto e verificado** — tela de login (`EnterGameWindow`): painel 352x466 com crest,
scanlines, dois campos com olho independente (mascaram e revelam nos dois sentidos), anel
de foco seguindo o cursor, três checkboxes persistidos, dois links, dois botões. Auto
login dispara uma vez quando há credencial salva. Fundo com música (`/sounds/intro.ogg`,
Vorbis) e toggles Sound/Animation no canto inferior direito, no mesmo estilo.

**Próximos passos, em ordem de impacto visual:**

1. **Character list** (`modules/client_entergame/characterlist.otui`, ~16 KB) — é a tela
   imediatamente seguinte ao login e continua inteira na skin antiga do Tibia. É o maior
   salto de inconsistência que o jogador vê.
2. **Diálogos do fluxo de login** — `displayErrorBox` / `displayCancelBox`
   (`MessageBoxWindow`), `twofactor.otui` (`MainWindow`) e `waitinglist.otui`
   (`NewMainWindow`) aparecem por cima do painel novo com a skin antiga. São poucos
   widgets e alto retorno.
3. **Barra do topo** — `modules/updater/updater.lua` desenha "Join Discord / Updating..."
   no topo da tela de login com estilo próprio.
4. **Limpeza** — `PixelCheckBox` órfão nos estilos; `client/data/sounds/intro.mp3`
   (2,4 MB) é o fonte da conversão e não é usado pelo cliente.
5. **Orçamento de fonte** — se uma tela nova pedir outra fonte, resolver o atlas antes
   (desativar outra ou `-DBIG_FONTS`).

---

## 8. Commit

Regras do `AGENTS.md` valem: `git -C` com caminho explícito, um commit por repositório,
nada de commit sem o usuário pedir. O histórico recente da UI está em `main` do `client/`
— siga o que já está lá em vez de abrir branch sem necessidade.
