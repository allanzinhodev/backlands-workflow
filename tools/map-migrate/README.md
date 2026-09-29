# map-migrate

Migra o mapa do datapack de referência Tibia 7.4 (`74/world/map.otbm` +
`map-spawn.xml` + `map-house.xml`) para `server/data/world/`,
substituindo inteiramente o mundo customizado atual pelo continente
clássico do 7.4.

## Uso

```
node --stack-size=65500 migrate-map.js [--dry-run]
```

`--stack-size` aumentado é necessário porque `validate-tree.js` percorre
a árvore de nodes do `.otbm` recursivamente e o arquivo de origem tem
~7,7 milhões de tiles.

- `--dry-run`: roda os 4 passos (patch de header, validação, conversão de
  spawn, "cópia" de house) escrevendo em arquivos temporários, sem tocar
  em `server/data/world/`.
- Sem flag: faz backup completo de `server/data/world/` (cópia com
  timestamp, `server/data/world.<timestamp>.bak/`) e sobrescreve
  `world.otbm`, `world-spawn.xml`, `world-house.xml`.

Scripts individuais (também podem ser rodados sozinhos):
- `otbm-header.js`: lê/escreve o header OTBM com desescape de
  0xFE/0xFF/0xFD (mesmo esquema binário do `items.otb`).
- `patch-header.js <in.otbm> <out.otbm> [--dry-run]`: corrige só
  `majorVersionItems`/`minorVersionItems` no header, sem tocar no resto
  do arquivo.
- `validate-tree.js <file.otbm>`: percorre a árvore inteira, conta nodes
  por tipo e cruza todo item ID usado contra o `items.otb` atual.
- `extract-house-ids.js <file.otbm> [house.xml]`: extrai os `houseId` dos
  nodes `HOUSETILE` e cruza contra um `map-house.xml`.
- `convert-spawn.js <map-spawn.xml> <world-spawn.xml> [--dry-run]`:
  converte o formato de spawn (ver abaixo).
- `remap-item-ids.js <in.otbm> <out.otbm> [reference.otb]`: reescreve todo
  item ID do mapa (nós `ITEM` e o item embutido de `TILE`/`HOUSETILE`) de
  Server ID para Client ID, pelos pares do `.otb` de referência (default
  `74/items/items.otb`). O resto do arquivo sai byte a byte igual: rodar com
  um `.otb` 1:1 como referência reproduz o arquivo de entrada idêntico.

## Os IDs do mapa precisam virar Client ID

O `.otbm` grava **Server IDs**, e o `map.otbm` do 7.4 grava os Server IDs
do 7.4. O servidor, porém, indexa itens por **Client ID** e descarta o
Server ID do `items.otb` (`server/src/items.cpp`, `ignoredLegacyId`) — o
mesmo número do mapa é usado como Client ID. No 7.4 as duas numerações
divergem em 4652 dos 4990 itens (Server ID 2700 "fir tree" é o Client ID
3614), então o mapa copiado sem conversão desenha cada item com o sprite de
outro. `world.otbm` foi convertido com:

```
node remap-item-ids.js ../../server/data/world/world.otbm <saida.otbm>
```

Resultado: 653 507 nós de item e 7 733 966 itens de tile remapeados, nenhum
ID sem Client ID, e 2380 IDs distintos (eram 2383 — seis pares de Server IDs
do 7.4 dividem o mesmo Client ID). Com o `items.otb` 1:1 do servidor, o
editor de mapa também passa a desenhar certo.

## Por que o header precisa de patch

`server/src/iomap.cpp:265-280` rejeita o mapa se `majorVersionItems<3` ou
`minorVersionItems<CLIENT_VERSION_810(8)`. O `map.otbm` do 7.4 tem
`major=2, minor=7` — falharia nesses floors. Além do header, só os item
IDs mudam (seção anterior). O Client ID do `74/items/items.otb` indexa o
`.dat` atual sem remapeamento: cruzando os dois `.otb` por Client ID + hash
de sprite, 99,2% batem exatamente (mesma técnica de `tools/otb-gen`; os 41
que divergem são variações de ordem de frame em bordas de terreno
animadas, não itens de inventário).

O Remere's Map Editor não tinha atalho pronto para converter IDs entre
versões: `Map::convert` (`source/map.cpp`) nunca foi implementado — a
lógica real está comentada dentro de um bloco `/* TODO */`, tanto no editor
oficial (`hjnilsson/rme`, só lido) quanto no fork local em `mapeditor/`.
Por isso `remap-item-ids.js` existe.

## Por que `map-house.xml` não precisa de conversão

Mesmo schema de atributos que `world-house.xml`
(`name/houseid/entryx/entryy/entryz/rent/townid/size/guildhall`).
`Houses::loadHousesXML` (`server/src/house.cpp:1076-1080`) **falha o
carregamento inteiro do mapa** se algum `houseid` do XML não tiver um
node `HOUSETILE` correspondente no `.otbm` — por isso
`extract-house-ids.js` existe: confirma que os 862 `houseId` do
`map-house.xml` batem exatamente (sem lacunas, sem sobras) com os 862
`HOUSETILE` distintos na árvore do `map.otbm`, antes de copiar o arquivo
sem alteração.

## Conversão de `map-spawn.xml`

O arquivo do 7.4 mistura dois formatos:
- 36 blocos `<spawn centerx centery centerz radius><monster
  x y z spawntime/></spawn>` — já no formato padrão, copiados quase
  verbatim (só corrigindo nomes de monstro, ver abaixo).
- 9986 entradas `<tvpspawn centerx centery centerz monstername|npcname
  spawntime amount radius direction/>` — formato flat que
  `Spawns::loadFromXml` (`server/src/spawn.cpp`) não reconhece.

Cada `<tvpspawn>` vira um `<spawn>` com filhos `<monster>` (se
`monstername`) ou `<npc>` (se `npcname`), confirmado lendo o parser C++
que aceita ambos como filhos diretos de `<spawn>`, com `x`/`y` como
**offset relativo** ao `centerx`/`centery` do spawn (não posição
absoluta).

`amount="N"` no `<tvpspawn>` não carrega posição individual por cópia (o
7.4 só declarava "N desse monstro nessa área"), e o `<monster>` do
formato atual é uma posição fixa (sem espalhamento aleatório dentro do
raio). Para não empilhar as N cópias na mesma posição, elas são
distribuídas num pequeno padrão circular ao redor do centro — é uma
aproximação razoável, não uma posição recuperada dos dados originais.

### Correção de nomes de monstro

A migração de monstros (sessão anterior, `tools/monsters-migrate`)
renomeou alguns monstros do 7.4 ao casá-los com o equivalente moderno
(`Beholder`→`Bonelord`, `Elder Beholder`→`Elder Bonelord`) ou criou um
monstro novo com nome próprio para bosses disfarçados
(`Illusion`→`Demon Illusion`, o boss que no 7.4 aparece visualmente como
"Demon" até ser provocado). O spawn ainda referenciava os nomes antigos —
`convert-spawn.js` aplica a mesma correção, numa tabela
`MONSTER_NAME_FIXUPS`.

Um caso sem correspondência técnica real: `Training Monk` nunca teve um
arquivo `.xml` próprio em `74/monster/monsters/` (não foi migrado, porque
não existia para migrar), mas aparece em 170 entradas de spawn. Mapeado
para `Monk` (o monstro migrado mais próximo) como decisão de conteúdo,
não correspondência técnica — sinalizado no código-fonte do conversor
para quem quiser revisar/ajustar depois.

## Limitações conhecidas

- **336 spawns de NPC** (`<npc name=.../>`) referenciam nomes de NPC que
  não foram migrados nesta sessão (migração de NPC está fora de escopo
  até agora). O servidor (`Npc::createNpc` retornando `nullptr`, ver
  `server/src/spawn.cpp:206-209`) ignora silenciosamente um NPC não
  encontrado — não impede o mapa de carregar, mas esses NPCs
  simplesmente não existem no mundo até serem migrados.
- Coordenadas do mapa são as do continente real do Tibia (~0-65000), bem
  maiores que o mundo customizado anterior (2048×2048) — qualquer script/
  configuração que assumisse os limites antigos (ex: waypoints, zonas
  especiais do mundo customizado) foi substituído junto com o mapa.
- `Training Monk`→`Monk` (ver acima) é uma aproximação de conteúdo.
- O `Tibia.dat`/`.spr` já usados no projeto (`client/data/things/`) já
  são o 7.4 convertido para o formato 8.60 extended — não foi necessário
  nenhum asset gráfico adicional para essa migração de mapa, já que ela
  não depende de sprites, só do `items.otb`.
