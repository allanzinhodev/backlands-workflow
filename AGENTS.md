# Backlands — Workspace

Este diretório (`d:\backlands`) é o **workspace agregador** do Backlands MMO. Ele não contém
código do jogo: contém as ferramentas do projeto, cada uma clonada como um repositório
independente, mais os arquivos de organização/documentação do próprio workspace.

**Backlands MMO** é um MMORPG oldschool 2D (perspectiva 45°, estilo Tibia) baseado em folclore,
religiões e crenças populares brasileiras, construído sobre **The Forgotten Server + OTClient no
protocolo 8.60**.

---

## Mapa de repositórios

| Pasta | Repositório | O que é | Stack | Branch |
|---|---|---|---|---|
| `client/` | `allanzinhodev/backlands-client` | **AstraClient** — cliente OTClient | C++ + Lua, CMake/vcpkg | `main` |
| `server/` | `allanzinhodev/backlands-server` | **TFS 1.8 Downgrade** — servidor | C++23 + Lua 5.5, MariaDB, CMake/vcpkg | `main` |
| `mapeditor/` | `allanzinhodev/backlands-mapeditor` | **NexaMap Editor** — editor de mapas OTBM | C++20 + wxWidgets, CMake/vcpkg | `main` |
| `objectbuilder/` | `allanzinhodev/backlands-objectbuilder` | **Object Builder** — editor de `.dat`/`.spr` | ActionScript / Adobe AIR | `master` |
| `devfolio/` | `allanzinhodev/devfolio` | Portfólio + **GDD do Backlands** | React + Vite + Tailwind | `main` |

As pastas foram renomeadas removendo o prefixo `backlands-`. O repositório raiz é
`allanzinhodev/backlands-workflow`.

---

## Roteamento de vocabulário

Quando o usuário citar qualquer termo abaixo, trabalhe **na pasta correspondente**. Não
pergunte qual repositório é — resolva por esta tabela e diga em qual você está atuando.

| O usuário diz | Vá para |
|---|---|
| cliente, client, AstraClient, OTClient, módulo, `modules/`, interface do jogo, OTUI, protocolo | `client/` |
| servidor, server, TFS, Forgotten Server, script, spell, monstro, NPC, action, talkaction, creaturescript, `data/`, banco, MariaDB | `server/` |
| editor, editor de mapa, mapeditor, RME, NexaMap, OTBM, brush, tileset, spawn, zona | `mapeditor/` |
| Object Builder, OB, `.dat`, `.spr`, `.otfi`, sprite, outfit, effect, missile, ClientID | `objectbuilder/` |
| portfólio, devfolio, site, GDD, design doc, documento de design, roadmap, classes, lore, progressão | `devfolio/` |
| workspace, essa pasta, organização, gitignore, skill, regras de agente | raiz (`d:\backlands`) |

**Ambíguo?** "item", "arma", "outfit" e "criatura" existem em mais de um repositório. Nesses casos
diga explicitamente qual camada você entendeu (definição de servidor / sprite / brush do editor) e
siga — não trave pedindo confirmação, mas deixe a suposição visível.

---

## Regras de git (importantes)

1. **Cada subpasta é um repositório git independente**, com seu próprio `origin`. Commits e pushes
   feitos dentro delas vão para o repositório original — nunca para o `backlands-workflow`.
2. **A raiz ignora todas as cinco subpastas** (ver [`.gitignore`](.gitignore)). O repositório raiz
   rastreia apenas arquivos de organização e documentação do workspace.
3. Ao rodar comandos git, **sempre use `-C` com o caminho explícito** (`git -C d:\backlands\server status`).
   Rodar git sem `-C` a partir de uma subpasta é fácil de confundir com a raiz.
4. **Não faça commit nem push sem o usuário pedir.** Não há identidade git configurada nesta
   máquina; commits saem com a identidade derivada do Windows (`aradantas@pma.rima`), o que é
   intencional — não "conserte" isso por conta própria.
5. Uma mudança que atravessa repositórios vira **um commit por repositório**, cada um com sua
   própria mensagem. Não existe commit atômico entre eles.

---

## Invariantes entre repositórios

Essas são as fontes reais de bug quando uma alteração atravessa repositórios:

- **ServerID ≠ ClientID.** `server/data/items/items.xml` fala em ServerID; sprites em
  `objectbuilder` e `.dat` falam em ClientID. `items.otb` é a tabela que faz a ponte entre os dois.
- **`items.otb` existe em dois lugares** e precisa bater: `server/data/items/items.otb` e
  `mapeditor/data/860/items.otb`. Editor e servidor com `.otb` diferentes = mapa corrompido ou
  itens errados.
- **Protocolo 8.60** é fixo em todo o stack. Cliente, servidor e os dados `860` do editor precisam
  concordar.
- **Assets do cliente:** `client/data/things/860.rar` precisa ser extraído para
  `client/data/things/860/` (`Tibia.dat`, `Tibia.spr`, `Tibia.otfi`). Sem isso o cliente não roda.
- **O GDD manda no design.** Regras de classe, progressão e lore vivem em
  `devfolio/src/content/backlandsGdd.js`. Se uma mudança de gameplay contradiz o GDD, aponte a
  divergência antes de implementar.

---

## Detalhes operacionais

Para builds, layout interno de cada repositório e checklists de mudança entre repositórios,
consulte a skill **`backlands`** em [`.claude/skills/backlands/SKILL.md`](.claude/skills/backlands/SKILL.md).
Ela é o documento longo; este arquivo é o resumo sempre carregado.
