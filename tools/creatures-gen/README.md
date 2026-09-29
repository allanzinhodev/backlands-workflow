# creatures-gen

Gera a paleta de criaturas do editor de mapa (`mapeditor/data/860/creatures.xml`)
a partir do que o servidor tem para o conteúdo do Tibia 7.4.

## Uso

```
node generate-creatures-xml.js [outFile]
```

- `outFile` (opcional): default `mapeditor/data/860/creatures.xml`.

Rode de novo sempre que um monstro ou NPC for criado, renomeado ou tiver o
outfit alterado no servidor, e faça o commit do `creatures.xml` no
repositório `backlands-mapeditor`.

## O que entra

- **Monstros**: todo `.lua` de `server/data/monsters/` (hoje 157, todos do 7.4).
  Nome de `Game.createMonsterType`, outfit do bloco `monster.outfit`.
- **NPCs**: só os do 7.4 — os 337 nomes de `74/npc/*.xml` — resolvidos nos
  scripts que o servidor carrega com `npcSystem = "crystal"`
  (`server/data/npc/crystalserver/`, inclusive `classic74/`). Nome e outfit
  vêm do script do servidor (`internalNpcName`, bloco `npcConfig.outfit`), então a
  paleta usa exatamente o nome que o servidor procura. NPCs modernos do Canary
  que não existem no 7.4 ficam de fora.

`lookTypeEx` vira `lookitem` (Client ID; o `items.otb` é 1:1). A extração de
blocos reaproveita `extractBlock` de `tools/monsters-migrate/lua-extract.js`.

## Nomes que não podem se repetir

O editor identifica criatura **só pelo nome** (`CreatureDatabase`, chave em
minúsculas): com um NPC e um monstro de mesmo nome, ele descarta um dos dois e,
ao salvar o mapa, grava spawn de monstro como NPC ou o contrário. Por isso os
NPCs do 7.4 "Cobra" e "Demon Skeleton" (também monstros, 954 spawns) foram
renomeados no servidor para `Cobra Statue` e `Demon Skeleton Guard`
(`NPC_RENAMES` aqui, `NPC_NAME_FIXUPS` em `tools/map-migrate/convert-spawn.js`).
O script avisa quando um nome do 7.4 tem mais de um script no servidor e diz de
qual arquivo tirou o outfit.

A saída atual não tem nenhum nome repetido, e toda criatura do
`server/data/world/world-spawn.xml` está na paleta.
