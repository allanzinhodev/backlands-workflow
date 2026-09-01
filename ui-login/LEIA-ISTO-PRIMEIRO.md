# ⚠️ Este pacote está desatualizado — use `../ui-login-retro/`

Esta pasta é o **primeiro** pacote de design da tela de login. Ele foi escrito antes de
alguém ler o código real do cliente e **foi rejeitado** no commit `b0b9548` do repositório
`client/`:

> O pacote usado nos 2 commits anteriores estava desatualizado (…). A janela real
> (`EnterGameWindow < StaticMainWindow`, sprites genéricos `/images/ui/*`) tem token 2FA,
> seleção de servidor, servidor customizado, login com Google e botão de gravações — nada
> disso existe no mock que o pacote antigo assumia. Aplicar aquele `client-files/` como
> estava teria apagado essas funcionalidades.

Em particular, **não** reconstrua a tela a partir de `reference/login-module.png`: fazer
isso desfaz uma decisão registrada e apaga funcionalidade.

## O pacote válido

`../ui-login-retro/`, com `AUDITORIA-CLIENTE.md` e `IMPLEMENTACAO.md`. A abordagem dele é a
que a branch `telaLOGIN` do cliente segue: **reskinar os sprites genéricos compartilhados**
(`/images/ui/popupwindow`, `checkbox`, `buttons`, `textedit`…) em vez de criar uma pasta de
sprites dedicada a cada tela.

A diferença prática está nas duas subpastas de entrega:

| Pasta | O que faz | Vale? |
|---|---|---|
| `client-files/` (aqui e lá) | substitui `entergame.otui`/`.lua` e cria `data/images/ui/login/` | **não** — é a abordagem rejeitada |
| `../ui-login-retro/client-replace/` | troca só os PNGs genéricos, nas mesmas dimensões | **sim** |

## Estado da migração

`client/RESKIN-PROGRESS.md` é o documento de continuidade: o que já foi feito, quais
ferramentas alcançam quais telas e o que ainda falta. Leia-o antes de mexer em UI do
cliente.

O que sobrevive **deste** pacote e continua em uso: a fonte `silkscreen-16`
(`fonts/silkscreen-16.png`), instalada em `client/data/fonts/`, e a paleta fechada de
`palette.json` — as duas confirmadas pelo pacote novo.
