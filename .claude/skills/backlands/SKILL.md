---
name: backlands
description: Procedimentos do workspace Backlands MMO (d:\backlands) — roteamento entre os repositórios client/AstraClient, server/TFS, mapeditor/NexaMap, objectbuilder e devfolio/GDD. Use sempre que a tarefa citar cliente, servidor, TFS, OTClient, editor de mapa, OTBM, Object Builder, sprite, .dat/.spr, item, ServerID/ClientID, GDD, ou envolver mais de um desses repositórios ao mesmo tempo. Traz comandos de build, layout interno de cada repo e checklists para mudanças que atravessam repositórios.
---

# Workspace Backlands

Contexto sempre carregado está em `AGENTS.md` (mapa de repos, roteamento de vocabulário, regras de
git). Esta skill é a camada procedural: **como fazer**, não **o que é**.

## 1. Antes de editar qualquer coisa

1. Resolva o repositório pela tabela de roteamento do `AGENTS.md`.
2. **Diga em qual repositório você está atuando** na primeira frase da resposta. Isso é o principal
   ponto de desencontro entre o usuário e o agente neste workspace.
3. Se a mudança tocar mais de um repositório, liste os repositórios afetados **antes** de começar e
   siga o checklist da seção 5.

## 2. Layout interno de cada repositório

### `server/` — TFS 1.8 Downgrade (protocolo 8.60)

```
src/                    engine C++23
data/
  items/                items.xml (ServerID), items.otb (ponte ServerID↔ClientID)
  scripts/              actions, talkactions, creaturescripts, movements, spells
  monsters/  npc/       definições XML/Lua
  world/                world.otbm, spawns, houses
  lib/  events/  migrations/  startup/  store/  raids/  XML/
config.lua.dist         copiar para config.lua
schema.sql              schema MariaDB
```

Build (Windows): abrir `vc18/theforgottenserver.sln`, `Release` + `x64`. As dependências de
`vcpkg.json` baixam sozinhas no primeiro build.

CI relevante: `.github/workflows/` tem `build.yml`, `lua-check.yml`, `xml-syntax.yml`,
`clang-format.yml`, `static-analysis.yml`. **Lua e XML são validados no CI** — script Lua novo ou
XML mal formado quebra o pipeline. Rode a formatação/lint local quando mexer neles.

### `client/` — AstraClient (fork OTClient)

```
src/                    engine C++
modules/                UI e lógica Lua (client_*, corelib, game_*)
data/
  things/860.rar        ← precisa ser extraído para data/things/860/
  styles/  images/  fonts/  shaders/  locales/  json/
mods/                   mods opcionais
docs/                   protocol-features-8.60.md (+ versão pt-BR)
vc23/otclient.sln       solution do Visual Studio
```

Build (Windows): abrir `vc23/otclient.sln` e compilar o projeto `AstraClient`.
Build (Linux): `cmake -DCMAKE_TOOLCHAIN_FILE=~/vcpkg/scripts/buildsystems/vcpkg.cmake ..` e
`cmake --build . --config Release`.

> ⚠️ O `readme.md` do cliente diz que a solution está em `vc17`, mas a pasta real é `vc23`. O README
> está desatualizado nesse ponto — use `vc23/otclient.sln`.

**Antes de mexer em `g_game.enableFeature` / `g_game.disableFeature`**, leia
`docs/protocol-features-8.60.md`. Ligar feature que o servidor não fala derruba a conexão.

### `mapeditor/` — NexaMap Editor (fork de RME)

```
source/                 C++20 + wxWidgets
data/<versão>/          items.otb, items.xml, materials.xml, tilesets.xml,
                        borders.xml, grounds.xml, walls.xml, doodads.xml, creatures.xml
brushes/  extensions/  icons/  tests/
vcproj/Editor.sln       solution do Visual Studio
```

A versão que interessa ao Backlands é **`data/860/`**. As demais (`1010`, `1020`, `10100`, …) são
suporte legado do editor — não edite por engano.

Build (Windows, CMake+Ninja):
```powershell
cmake -S . -B out/build/release -G Ninja -DCMAKE_BUILD_TYPE=Release `
  -DCMAKE_TOOLCHAIN_FILE="$env:VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake"
cmake --build out/build/release
```
Ou abrir `vcproj/Editor.sln` (`x64`, `Release`).

### `objectbuilder/` — Object Builder

```
src/     ActionScript
assets/  libs/  locale/
asconfig.json
```

Editor de `.dat`/`.spr` (Adobe AIR). Compila com o AIR SDK via `asconfig.json`. É a ferramenta que
cria/edita **ClientIDs** — sprites, outfits, effects, missiles.

### `devfolio/` — portfólio + GDD

```
src/content/backlandsGdd.js   ← GDD do Backlands (fonte única, markdown em JS)
src/content/todoData.js       roadmap / TODO
src/content/dictionary.js     conteúdo i18n do portfólio
src/components/BacklandsGDD.jsx, BacklandsPage.jsx, TechStackDiagram.jsx
```

Scripts: `npm run dev` (Vite), `npm run build`, `npm run lint` (oxlint), `npm run preview`.

O GDD tem seções com `id`/`title` num array — a numeração é gerada pela ordem. Ao adicionar seção,
insira o objeto na posição certa do array; não numere à mão.

## 3. Vocabulário de design (vindo do GDD)

Use estes termos exatamente como o GDD usa — é o que o usuário espera ouvir de volta:

- **Classes:** começa **Unranked**; ao sair do **Campo de Aprendizes** escolhe Guerreiro → **Guardião**,
  Arqueiro → **Caçador**, Mago → **Arcanista** (trilhas: Curandeiro Espiritual, Elemental da
  Natureza, Suporte Temporal, Invocador).
- **Progressão em 3 camadas:** *level* (acesso a áreas/itens), *job level* (magic level; perde XP mas
  nunca regride de nível), *weapon proficiency* (especialização lateral pelo uso da arma).
- **Pilares:** identidade brasileira legível · progressão em três camadas · base sólida antes de
  expandir.
- **MVP:** 3 classes, Campo de Aprendizes, combate principal, progressão clara, primeiras evoluções,
  spells essenciais.

Seções do GDD: `visao-geral`, `pilares`, `escopo`, `core-loop`, `classes`, `progressao`, `spells`,
`mundo`, `direcao-visual`, `campo-de-aprendizes`, `roadmap`, `riscos`, `decisoes`.

## 4. Comandos git seguros

Sempre com `-C` e caminho absoluto:

```powershell
git -C d:\backlands\server status --short         # status de um repo específico
git -C d:\backlands status --short --ignored      # confirma que as 5 pastas estão ignoradas
```

Verificar todos de uma vez:
```powershell
foreach ($d in 'client','devfolio','mapeditor','objectbuilder','server') {
  "$d : " + (git -C "d:\backlands\$d" rev-parse --abbrev-ref HEAD) + " | " +
  ((git -C "d:\backlands\$d" status --porcelain | Measure-Object).Count) + " alteracoes"
}
```

Regras: nada de commit/push sem pedido; um commit por repositório; `objectbuilder` usa `master`,
os outros usam `main`.

## 5. Checklists para mudanças entre repositórios

### Adicionar ou alterar um item
1. `objectbuilder` → cria/edita o sprite, gera o **ClientID** nos `.dat`/`.spr`.
2. `server/data/items/items.otb` → mapeia ServerID ↔ ClientID.
3. `server/data/items/items.xml` → atributos e comportamento (por ServerID).
4. `mapeditor/data/860/items.otb` → **precisa ser a mesma versão** do `.otb` do servidor.
5. `mapeditor/data/860/tilesets.xml` (ou `materials.xml`) → se o item deve aparecer na paleta.
6. `client/data/things/860/` → assets atualizados do lado do cliente.

**Falha clássica:** atualizar o `.otb` do servidor e esquecer o do editor. O mapa passa a salvar
IDs que o servidor lê como outro item.

### Nova spell / habilidade
1. Confira o GDD (`devfolio/src/content/backlandsGdd.js`, seções `classes`, `progressao`, `spells`)
   — a spell precisa caber nas três camadas de progressão.
2. `server/data/scripts/` → implementação Lua + registro.
3. `server/data/items/items.xml` → se houver runa/item associado.
4. `client/modules/` → só se a spell exigir UI ou efeito novo no cliente.
5. `objectbuilder` → só se precisar de novo effect/missile (ClientID novo).

### Nova área de mapa
1. `mapeditor` → edita `server/data/world/world.otbm` (o editor abre o `.otbm` do servidor).
2. Confirme que o editor está carregando **`data/860/`**, não outra versão.
3. `server/data/world/` → spawns e houses da nova área.
4. Atualize o GDD se a área for parte do mundo descrito (seção `mundo`).

### Mudança de protocolo / feature de rede
Cliente e servidor precisam mudar **juntos**. Leia `client/docs/protocol-features-8.60.md` antes.
Nunca mexa só de um lado.

## 6. Armadilhas conhecidas

- **Busca a partir da raiz varre ~1,4 GB.** Sempre aponte `path` para o repositório certo em
  Glob/Grep. `client/` (716 MB) e `server/` (483 MB) são os pesados.
- **`objectbuilder` está em `master`**, não `main`. Comandos que assumem `main` falham nele.
- **`config.lua` não existe** no repositório — só `config.lua.dist`. Rodar o servidor exige copiar
  e preencher.
- **`860.rar` não vem extraído.** O cliente não sobe sem `data/things/860/`.
- **`items.otb` duplicado** entre `server/` e `mapeditor/data/860/` — ver seção 5.
- **README do cliente aponta `vc17`**, a pasta real é `vc23`.
- **Sem identidade git configurada** na máquina; commits usam a identidade derivada do Windows por
  decisão do usuário.
