# Backlands — Workflow

Repositório **agregador** do Backlands MMO. Não contém código do jogo: contém o que faz as peças
trabalharem juntas — contexto para agentes de IA, ferramentas de workspace e a fila de trabalho.

**Backlands MMO** é um MMORPG oldschool 2D (perspectiva 45°, estilo Tibia) baseado em folclore,
religiões e crenças populares brasileiras, construído sobre **The Forgotten Server + OTClient no
protocolo 8.60**.

## Para que serve este repositório

O projeto é feito de cinco repositórios independentes. Três coisas não pertencem a nenhum deles em
particular, e é isso que vive aqui:

1. **Contexto compartilhado para agentes de IA** — Claude Code e Antigravity precisam saber que
   "editor de mapa" significa `mapeditor/` e que `items.otb` existe duplicado em dois lugares.
2. **Ferramentas que atravessam repositórios** — um script que sincroniza servidor e editor não
   cabe dentro de nenhum dos dois.
3. **Setup reproduzível** — trocar de computador é um clone e um comando, não meia hora refazendo
   clones e dependências na mão.

## Começando em uma máquina nova

**Windows**
```powershell
git clone https://github.com/allanzinhodev/backlands-workflow.git d:\backlands
d:\backlands\tools\bootstrap.ps1
```

**Linux / WSL / Git Bash**
```bash
git clone https://github.com/allanzinhodev/backlands-workflow.git ~/backlands
cd ~/backlands && chmod +x tools/*.sh
./tools/bootstrap.sh --with-apt
```

O bootstrap clona os cinco repositórios com os nomes curtos, instala o vcpkg, roda `npm install` no
devfolio, extrai os assets 8.60, cria o `config.lua` do servidor e lista no fim o que sobrou de
manual (credenciais de banco, `schema.sql`, `VCPKG_ROOT`). É idempotente — pula o que já existe.

Detalhes e opções em [`tools/README.md`](tools/README.md).

## Estrutura

```
backlands/
├── AGENTS.md            contexto compartilhado entre agentes (fonte única)
├── CLAUDE.md            importa AGENTS.md + notas do Claude Code
├── TODO.md              fila de trabalho: features e testes
├── .agents/rules/       regra de workspace do Antigravity
├── .claude/skills/      skill "backlands" — builds, layout, checklists
├── tools/               bootstrap, status e ferramentas futuras
│
├── client/         ⟶ backlands-client         (ignorado — repo próprio)
├── server/         ⟶ backlands-server         (ignorado — repo próprio)
├── mapeditor/      ⟶ backlands-mapeditor      (ignorado — repo próprio)
├── objectbuilder/  ⟶ backlands-objectbuilder  (ignorado — repo próprio)
└── devfolio/       ⟶ devfolio                 (ignorado — repo próprio)
```

As cinco pastas são **repositórios git independentes**, cada uma com seu próprio `origin`. Estão no
`.gitignore` da raiz: commits feitos dentro delas vão para o repositório original, nunca para o
`backlands-workflow`. As pastas foram renomeadas removendo o prefixo `backlands-`.

## Os cinco repositórios

| Pasta | O que é | Stack | Branch |
|---|---|---|---|
| `client/` | **AstraClient** — cliente OTClient | C++ + Lua, CMake/vcpkg | `main` |
| `server/` | **TFS 1.8 Downgrade** — servidor | C++23 + Lua 5.5, MariaDB | `main` |
| `mapeditor/` | **NexaMap Editor** — editor de mapas OTBM | C++20 + wxWidgets | `main` |
| `objectbuilder/` | **Object Builder** — editor de `.dat`/`.spr` | ActionScript / Adobe AIR | `master` |
| `devfolio/` | Portfólio + **GDD do Backlands** | React + Vite + Tailwind | `main` |

O `objectbuilder/` tem papel diferente dos outros: além de ferramenta pronta, é **objeto de estudo**.
Seu `src/otlib/` é uma implementação de referência dos formatos `.dat`, `.spr`, `.otb`, `items.xml`,
`.otfi` e `.obd` — a base para as ferramentas próprias que vamos escrever. Ver [`TODO.md`](TODO.md),
Feature 2.

## Estado do workspace

```powershell
.\tools\status.ps1          # ou ./tools/status.sh
```

Mostra branch, alterações locais e ahead/behind dos seis repositórios de uma vez.

## Invariantes entre repositórios

As fontes reais de bug quando uma mudança atravessa repositórios:

- **ServerID ≠ ClientID.** `server/data/items/items.xml` fala em ServerID; sprites e `.dat` falam em
  ClientID. `items.otb` é a ponte.
- **`items.otb` existe em dois lugares** e precisa bater: `server/data/items/` e
  `mapeditor/data/860/`. Divergiram = mapa salvo com IDs que o servidor lê como outro item.
- **Protocolo 8.60** é fixo em todo o stack.
- **O GDD manda no design.** `devfolio/src/content/backlandsGdd.js` é a fonte de classes,
  progressão e lore.

Lista completa em [`AGENTS.md`](AGENTS.md).

## Trabalhando com agentes de IA

O contexto é escrito uma vez em [`AGENTS.md`](AGENTS.md) e referenciado pelos demais, para as
versões não divergirem:

| Arquivo | Quem lê |
|---|---|
| `AGENTS.md` | Antigravity e a convenção geral de agentes |
| `CLAUDE.md` | Claude Code (importa `AGENTS.md`) |
| `.agents/rules/backlands-workspace.md` | Antigravity, regra de workspace |
| `.claude/skills/backlands/SKILL.md` | Claude Code, carregada sob demanda |

O objetivo é que citar "o editor" ou "a proficiência de armas" leve o agente ao lugar certo sem
você precisar explicar a estrutura toda de novo a cada conversa.
