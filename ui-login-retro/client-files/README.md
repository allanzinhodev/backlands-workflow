# client-files — tela de login, arquivos prontos

Estes arquivos **substituem** os que ja existem no repositorio `client/`. Nada aqui e
componente novo nem imagem nova: tudo referencia sprites e fonte que o pacote `ui-login/`
ja entrega. Se algum destes arquivos nao existir no seu `client/`, **pare e pergunte** —
provavelmente o caminho mudou; nao crie arquivo novo por conta propria.

## Mapa

| Arquivo aqui | Destino no repo | O que muda |
|---|---|---|
| `data/styles/40-entergame.otui` | `client/data/styles/40-entergame.otui` | catalogo de widgets pixel, **substitui o arquivo inteiro** |
| `modules/client_entergame/entergame.otui` | `client/modules/client_entergame/entergame.otui` | arvore da tela, **substitui o arquivo inteiro** |
| `modules/client_entergame/PATCH-entergame.lua.md` | — | **patch** do `entergame.lua` (3 mexidas cirurgicas, com numero de linha) |
| `modules/client_entergame/entergame.lua.reference` | — | so referencia: escrito antes de eu ler o cliente, **nao e drop-in** |
| `data/fonts/silkscreen-16.otfont` | `client/data/fonts/silkscreen-16.otfont` | descritor da fonte bitmap (o `.png` vem de `ui-login/fonts/silkscreen-16.png`) |

Os sprites vao de `ui-login/derived-2px/` + `ui-login/text/` para
`client/data/images/ui/login/`, com os nomes que os estilos referenciam:

```
panel-frame.png            <- derived-2px/panel-frame.png
input-field.png            <- derived-2px/input-field.png
input-field-active.png     <- derived-2px/input-field-active.png
checkbox-off.png           <- derived-2px/checkbox-off.png
checkbox-on.png            <- derived-2px/checkbox-on.png
ornament-crest.png         <- derived-2px/ornament-crest-60x25.png
scanlines-tile.png         <- derived-2px/scanlines-tile.png
btn-login.png              <- derived-2px/btn-login.png
btn-login-hover.png        <- derived-2px/btn-login-hover.png
btn-login-pressed.png      <- derived-2px/btn-login-pressed.png
btn-create-account.png     <- derived-2px/btn-create-account.png
btn-create-account-hover.png <- derived-2px/btn-create-account-hover.png
eye-open.png               <- widgets/eye-open.png          (1:1, nao reduz)
eye-closed.png             <- widgets/eye-closed.png        (1:1, nao reduz)
label-login.png            <- text/label-login.png          (1:1)
label-password.png         <- text/label-password.png        (1:1)
remember-email.png         <- text/remember-email.png        (1:1)
remember-password.png      <- text/remember-password.png     (1:1)
auto-login.png             <- text/auto-login.png            (1:1)
link-forgot-password.png       <- text/link-forgot-password.png
link-forgot-password-hover.png <- text/link-forgot-password-hover.png
link-forgot-email.png          <- text/link-forgot-email.png
link-forgot-email-hover.png    <- text/link-forgot-email-hover.png
```

Botoes: os sprites sao 296px e a arvore usa `width: 288`. Reconstrua a placa na largura
final faixa por faixa e recole o rotulo em 1:1 (pipeline da skill base) — **nao estique**.

## Adaptacoes que estes arquivos assumem (e por que)

1. **`$active`, nao `$focus`, no anel do campo.** `FocusState` e relativo ao pai imediato,
   e cada `LoginInput` e filho unico focavel do seu `LoginField` — os dois reportariam
   "focado". `LoginField` usa `$active`.
2. **`LoginPanel` e `LoginField` sao `focusable: true`.** `recursiveFocus()` so sobe por
   ancestrais focaveis; sem isso o `UITextEdit` nunca recebe teclado.
3. **`image-border: 8` no campo (sprite 60x30).** A borda tem que engolir o anel dourado,
   o anel preto **e** a sombra interna do topo. Com 6 a faixa de sombra cai no centro, que
   o engine **ladrilha**, e ela se repete campo abaixo.
4. **Toda propriedade que um `$estado` altera esta declarada na base.** `updateStyle()`
   reverte lendo o valor da base; `image-rect` so em `$pressed` nao volta ao soltar. E por
   isso que `image-rect` aparece na base dos botoes e dos checkboxes.
5. **`placeholder-align: topLeft`.** O placeholder do `UITextEdit` e centralizado duas
   vezes e cai no fundo do campo sem isso.
6. **Clique toca som via `g_sounds`.** `setClickSound` e stub neste fork
   (`corelib/globals.lua`) e nao existe no C++ — nao toca nada.
7. **`setTextHidden` depende do fix em `src/framework/ui/uitextedit.cpp`** (ignorava o
   argumento e sempre mascarava). Sem ele o olho nao revela. **Mexer em `src/` exige
   recompilar.**
8. **Nenhuma fonte nova.** O atlas de texto (2048x2048, sem `BIG_FONTS`) esta cheio; a
   `silkscreen-16` entrou no lugar de `Verdana-11px-italic.otfont`, renomeada para
   `.otfont.disabled`. Nao registre outra fonte sem liberar espaco.
9. **Checkbox e a linha inteira**, com o rotulo como `LoginSprite` `phantom` filho
   (`margin-left: 23`, `margin-top: 4`) e a caixa fixada a esquerda por `image-rect`.

## Efeito colateral aceito

Substituir `40-entergame.otui` inteiro **muda todo widget que herda desses estilos**,
inclusive os toggles Sound/Animation de `client_background/background.otui`. Isso e
intencional: a skin tem que ficar uniforme. Depois de aplicar, fotografe o canto inferior
direito da tela de login e confirme que os dois toggles continuam legiveis e clicaveis.

`PixelCheckBox` foi removido — estava orfao, ninguem referenciava.

## Antes de dizer que acabou

```bash
node tools/otui-lint.js client/data/styles/40-entergame.otui \
  client/modules/client_entergame/entergame.otui
vcpkg/packages/luajit_x64-windows-static/tools/luajit/luajit.exe \
  tools/lua-syntax.lua client/modules/client_entergame/entergame.lua
powershell -File tools/ui-shot.ps1 -Out shot.png
node tools/pixelui/probe.js find shot.png "#4e2f24" 6
```

- [ ] Ordem: LOGIN, campo, PASSWORD, campo, 3 checkboxes, 2 links, CREATE, LOGIN.
- [ ] Os dois olhos revelam e **voltam a mascarar**, independentes.
- [ ] Anel de foco acende no campo com o cursor e apaga no outro (`probe.js at`:
      `#ebbf90` no ativo, `#9a6651` no outro).
- [ ] Os tres checkboxes persistem entre execucoes.
- [ ] Auto login dispara **uma vez** quando ha credencial salva.
- [ ] Toggles Sound/Animation do background nao quebraram.
- [ ] Nenhuma cor fora da paleta fechada.
- [ ] Comparado com `ui-login/reference/login-module.png`.


---

## Atualizacao — arvore enxuta, escrita a partir do codigo real

`entergame.otui` aqui foi reescrito depois de ler o cliente. Ele **mantem os estilos que
o cliente ja tem** (`MenuLabel`, `AccTextEdit`, `PasswordTextEdit`, `CheckBox`,
`TextButton`, `Button`, `HorizontalSeparator`) — nenhum estilo novo, nenhum sprite novo.

### Removido da tela

| O que | Por que sai | Onde foi |
|---|---|---|
| `accountTokenTextEdit` (2FA) | nao existe no mock | **widget mantido, `visible: false`** — `entergame.lua` o le nas linhas 707 e 739 |
| botao "Login with Google" | nao existe no mock | removido da arvore; `EnterGame.onGoogleClick()` (linha 1136) fica como codigo morto |
| botao cam (Open Recordings List) | nao existe no mook | removido |
| `serverSelectorPanel` / `customServerSelectorPanel` | nao existem no mock | **mantidos com `on: false`** — o style ja tem `\$!on: visible: false`, e o Lua continua resolvendo `onServerChange`, `serverHostTextEdit`, `clientVersionSelector` |
| `tokenLabel`, `serverLabel` extra, separador do painel custom | idem | removidos |

**Nada foi apagado do Lua.** Widget invisivel resolve `getChildById`; widget ausente
retorna `nil` e derruba a tela. Foi por isso que os paineis ficaram ocultos em vez de
deletados.

### Adicionado

- `hiddenEmail` — segundo olho, no campo de email, mesmo sprite `hidden-button`,
  chamando `chooseTextModeEmail()` (nova, no patch).
- `autoLoginBox` — terceiro checkbox, `chooseAutoLogin()` (nova, no patch).
- `clickSiteEmail` — o link combinado "Forgot password and/or email" virou dois:
  "Forgot password" e "Forgot email", cada um com seu `Label` de sublinhado.
- `size: 280 262` — 31px mais alto: o terceiro checkbox e o segundo link nao cabiam em 231.

### Ordem final na tela

Email + olho · Password + olho · Remember Email · Remember Password · Auto login ·
Forgot password · Forgot email · Create new account · separador · Log in.

A mesma ordem do mock, com os rotulos que o cliente ja traduz via `tr()`.
