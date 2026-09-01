# Como implementar — ordem de trabalho

Este pacote e **especificacao**, nao codigo do cliente. O caminho da tela pronta ate o
cliente rodando e sempre o mesmo:

    mock (.dc.html)  ->  skill (.md)  ->  sprites (client-replace/)  ->  .otui  ->  verificacao por pixel

## Estado atual

| Tela | Mock | Skill | Sprites | No cliente |
|---|---|---|---|---|
| Login | `Pixel Login.dc.html` | `backlands-client-ui` | ok | **feito** |
| Character list | `Pixel Character List.dc.html` | `backlands-characterlist-ui` | ok | pendente |
| Widgets (base) | `Pixel UI Kit.dc.html` | `backlands-widgets-ui` | ok | pendente |
| Janelas in-game | `Pixel Game UI.dc.html` | `backlands-gamewindows-ui` | ok | pendente |
| HUD | `Pixel Game HUD.dc.html` | `backlands-hud-ui` | ok | pendente |
| Skill tree | `Pixel Skill Tree.dc.html` | — | — | **conceito, nao implementar** |

## Ordem recomendada

1. **Copiar os sprites novos.** `ui-login/client-replace/data/images/` por cima de
   `client/data/images/`. Nada de OTUI muda — as dimensoes sao as mesmas. Rode o cliente:
   barras, scroll, combo e item slots ja mudam sozinhos. **E o teste mais barato do pacote.**
2. **Character list.** Ja tem skill escrita e herda tudo da login. Fecha o fluxo de entrada.
3. **Janelas in-game**, na ordem da skill: healthinfo -> skills -> inventory -> waitinglist ->
   hotkeys -> options -> console -> npctrade.
4. **HUD** por ultimo: so parece certo com as janelas dockadas ja vestidas.

## Como usar as skills com o Claude Code

Cada arquivo em `ui-login/skills/` e uma skill no formato do Claude Code (frontmatter
`name` + `description`). Copie a pasta para `.claude/skills/` do repositorio do cliente.
A partir dai:

    "vista a janela de skills na skin nova"

O agente carrega `backlands-gamewindows-ui`, que puxa `backlands-widgets-ui`, e ja tem
paleta, dimensoes de sprite, armadilhas do engine e o loop de verificacao em contexto.

Leve junto para o repositorio do cliente:

- `ui-login/skills/` -> `.claude/skills/`
- `ui-login/palette.json`, `layout.json`, `atlas.json`
- `ui-login/client-replace/` (sprites) e `ui-login/client-files/` (OTUI ja adaptado da login)
- os mocks `Pixel *.dc.html` como referencia visual

## Regra de ouro

O mock vence a skill; o cliente rodando vence o mock. Se um pixel diverge, fotografe
(`tools/ui-shot.ps1`), meca (`tools/pixelui/probe.js`) e corrija o **sprite**, nao o OTUI.
