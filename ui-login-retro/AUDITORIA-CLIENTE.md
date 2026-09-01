# Auditoria — cliente real vs. pacote `ui-login`

Fonte lida: `allanzinhodev/backlands-client@main` (tree `91e9409afe19`), em 2026-08-27.
Arquivos lidos: `modules/client_entergame/entergame.otui`, `.otmod`,
`data/styles/40-entergame.otui`, `10-windows.otui`, `10-textedits.otui`,
`10-checkboxes.otui`, `10-buttons.otui`, `10-labels.otui`, e o inventario de
`data/images/ui/`.

> Voce pediu para eu editar `D:\backlands\client` direto. Nao consigo: nao tenho acesso a
> essa pasta nesta conversa — so ao repositorio no GitHub, que e read-only para mim. Para eu
> escrever nos seus arquivos, **anexe a pasta local** `D:\backlands\client`. Enquanto isso,
> este pacote entrega os arquivos prontos para voce copiar por cima.

---

## 1. O que realmente existe (e nao e o que o pacote assumia)

### A janela nao e um painel proprio

```
EnterGameWindow < StaticMainWindow    // data/styles/40-entergame.otui, 6 linhas
  !text: tr('Journey Onwards')       // tem TITULO desenhado pelo frame
  size: 280 231                      // nao 352x489
  color: #909090
```

`StaticMainWindow < StaticWindow < Window`, e `Window` usa
`/images/ui/popupwindow` com `image-border: 6` e `image-border-top: 27` — a barra de
titulo **e parte do sprite**. O pacote `ui-login` desenhou um painel sem titulo, com
moldura de 16px por fora e crest sobreposto. **Nao existe crest, nem scanlines, nem
LoginPanel no cliente.**

### A arvore e plana e tem muito mais coisa que o mock

Filhos diretos de `EnterGameWindow`, na ordem real:

1. `emailLabel` (MenuLabel "Email:") + `emailStatus` (icone de erro)
2. `accountNameTextEdit` (AccTextEdit, 182x20)
3. `hidden` (Button 18x18, `/images/ui/hidden-button`, `@onClick: chooseTextMode()`)
4. `passwordLabel` + `accountPasswordTextEdit` (PasswordTextEdit)
5. **`tokenLabel` + `accountTokenTextEdit`** (2FA, 6 digitos, only-number)
6. **`serverSelectorPanel`** (ComboBox de servidor) + **botao `cam`** (Open Recordings List)
7. **`customServerSelectorPanel`** (IP:PORT/URL + Version, com HorizontalSeparator)
8. `rememberEmailBox` + `buttonInformation`
9. `rememberPasswordBox` + `passwordInformation`
10. `clickSitePassword` — **um unico link**: "Forgot password and/or email"
11. `clickSiteCreateAccount` — "Create new account"
12. **`Button` "Login with Google"** (229x20, `/images/ui/buttons-blue`)
13. `loginButton` ("Log in", 86x20)
14. `serverInfoLabel` (verde)

### Diferencas que quebram o mock ponto a ponto

| Pacote `ui-login` | Cliente real |
|---|---|
| dois olhos independentes (login + senha) | **um** botao `hidden` chamando `chooseTextMode()` |
| dois links (Forgot password / Forgot email) | **um** link combinado |
| checkbox **Auto login** | **nao existe** |
| sublinhado do link como sprite `-hover` | `Label` de `size: 202 1` com `background-color` |
| painel 352x489 sem titulo | janela 280x231 **com** titulo "Journey Onwards" |
| campos com `$active` (anel de foco) | `TextEdit` sem estado de foco |
| checkbox 18x18 | `CheckBox` 12x12, sheet `0 0 12 12` / `0 12 12 12` |
| botoes 296x42 dedicados | `Button` 43x20 generico, `image-border: 1` |
| fonte `silkscreen-16` | `$var-cip-font`, `pVerdana Bold-11px`, `cipsoftFont` |
| `data/images/ui/login/` | **nao existe** — sprites genericos compartilhados |

**Conclusao dura:** trocar so imagens **nao** produz o mock. Produz a mesma tela, com a
mesma estrutura e os mesmos textos de fonte antiga, vestida na paleta nova. O mock exige
editar `entergame.otui` (remover token/servidor/Google ou reposicionar, adicionar o
terceiro checkbox, separar os dois links, duplicar o toggle do olho).

---

## 2. Track A — replace so de imagens (o que voce escolheu)

Arquivos em `client-replace/data/images/ui/`, **mesmas dimensoes, mesmo layout de clip**.
Copie por cima e o cliente sobe reskinado sem tocar em OTUI nem Lua.

| Arquivo | Tamanho | Layout que o engine espera | Afeta |
|---|---|---|---|
| `popupwindow.png` | 236x207 | `image-border: 6` + `image-border-top: 27` (Window) **e** `4`/`17` (NewWindow) | **toda janela do cliente** |
| `textedit.png` | 32x32 | `image-border: 1` | todo campo de texto |
| `checkbox.png` | 12x36 | 3 estados de 12x12 (nao-marcado / marcado / 3o) | todo checkbox |
| `buttons.png` | 43x40 | 43x20 normal sobre 43x20 pressed, `image-border: 1` | todo `Button` |
| `buttons-blue.png` | 43x40 | idem | botao do Google |
| `button.png` | 22x69 | 3 estados de 22x23, `image-border: 3` | QtButton, ButtonBox |
| `panel_flat.png` | 68x68 | `image-border: 1` | FlatLabel |
| `hidden-button.png` | 18x18 | estado mascarado → mostra olho **fechado** | toggle da senha |
| `hidden-button-down.png` | 18x18 | estado revelado → olho **aberto** | toggle da senha |
| `special_miniwindow.png` | 99x98 | fundo dos links — **agora transparente**, o link volta a ser texto puro | os dois links |

### Por que os sprites sao chapados

`image-border` define a moldura; **o centro e ladrilhado** (`addRepeatedRects`). Com
`image-border: 1` (textedit, buttons) so 1px e moldura — qualquer degrade, sombra interna
ou cantoneira no centro **se repete** e vira listra. Por isso:

- `textedit.png`: 1px `#9a6651` + interior `#0f0a09` chapado. **Sem** sombra interna no topo.
- `buttons.png`: 1px `#4e2f24` + preenchimento `#c68f66` (normal) / `#9a6651` (pressed).
  **Sem** faixa de realce e sem sombra projetada.
- `popupwindow.png`: aneis de 2px (ink / gold-dk / gold-mid) nas quatro bordas, faixa de
  titulo `#33231d` uniforme de 0 a 27 (para o `border-top: 17` do `NewWindow` cair dentro
  da mesma faixa) e regua `#000` embaixo dela; centro `#231815` chapado.

### O que Track A **nao** conserta (precisa de 1 linha de style cada)

| Problema | Correcao minima |
|---|---|
| texto dos botoes fica claro sobre ouro | `10-buttons.otui`: `Button.color: #201e1d` (hoje `$var-text-color`) |
| campo sem realce e sem anel de foco | `10-textedits.otui`: `image-border: 3` (a moldura passa a caber o anel + a sombra) |
| titulo "Journey Onwards" em cinza `#909090` | `40-entergame.otui`: `color: #ebbf90` |
| labels em Verdana antialiased | `10-labels.otui`: `Label.font: silkscreen-16` |

Sao 4 linhas. Sem elas o reskin fica visivelmente meio-caminho.

---

## 3. Track B — a tela do mock (exige OTUI + Lua)

O que precisa mudar em `modules/client_entergame/entergame.otui`:

1. Ordem final: LOGIN, campo, PASSWORD, campo, 3 checkboxes, 2 links, CREATE, LOGIN.
2. **Segundo toggle de olho** no campo de email — hoje `chooseTextMode()` age so na senha.
   Vira duas funcoes, uma por campo (o pacote `client-files/` ja tras isso).
3. **Terceiro checkbox** (Auto login) + persistencia em `g_settings`.
4. **Separar** `clickSitePassword` em dois links.
5. Decidir o destino de token, server selector, custom server, Google e cam: o mock nao tem
   lugar para eles. Ou saem, ou a janela cresce, ou vao para um painel "Advanced" recolhivel.
   **Isto e decisao sua, nao minha.**
6. `size: 280 231` -> a altura tem que crescer; com 3 checkboxes e 2 links nao cabe.

`ui-login/client-files/` ja tras uma versao completa dessa arvore, mas ela foi escrita
**antes** de eu ler o codigo: ignora token, servidor, Google e cam, e assume sprites
dedicados em `/images/ui/login/` que nao existem. Trate-a como proposta, nao como drop-in.

---

## 4. Fonte `silkscreen-16`

Sua escolha: registrar como nova e desativar outra. O cliente tem **40 arquivos** em
`data/fonts/`, quase todos Verdana. Candidatas a desativar, por uso baixo:
`Verdana-11px-italic`, `verdana-9px-italic`, `Verdana-Strikethrough-11px`,
`vbot-verdana-11px-rounded`.

Passos: copiar `ui-login/fonts/silkscreen-16.png` + `.otfont` para `data/fonts/`, renomear
a escolhida para `.otfont.disabled`, e **conferir que ninguem a referencia**
(`grep -r "nome-da-fonte" client/`). Fonte ausente nao derruba o cliente — loga
`font 'x' not found` e cai no default — mas o texto muda de lugar sem aviso.

Depois disso, `Label.font`, `TextEdit.font` e `$var-cip-font` podem apontar para ela.
**Atencao:** `$var-cip-font` e usado no cliente inteiro; trocar essa variavel reskina
todos os textos de uma vez. E o que voce pediu, mas fotografe o jogo, nao so o login.

---

## 5. Ordem sugerida

1. Copiar `client-replace/data/images/ui/` por cima. Rodar. Fotografar login, character
   list, e uma janela do jogo (mesmo sprite `popupwindow`).
2. Aplicar as 4 linhas de style da secao 2.
3. Instalar a fonte e trocar `Label.font`.
4. So entao mexer na arvore (Track B), com a decisao sobre token/servidor/Google tomada.

Cada passo e reversivel sozinho. Fazer os quatro juntos e como voce perde a referencia de
qual mudanca quebrou o que.
