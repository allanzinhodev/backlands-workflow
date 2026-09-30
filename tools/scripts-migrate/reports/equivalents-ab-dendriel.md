# Equivalentes no servidor — ab'dendriel

Scripts do 7.4: 11 · existe: 1 · parcial: 0 · não existe: 10

| Script 7.4 | Aids do mapa | Posições | Storages | Veredito | Candidatos no servidor |
|---|---|---|---|---|---|
| `actions/map/ab'dendriel/draconia_lever_key.lua` | 2008 | 6 | - | não existe | - |
| `actions/map/ab'dendriel/draconia_stone_lever.lua` | 2007 | 6 | - | não existe | - |
| `actions/map/ab'dendriel/wasp_lever.lua` | 2001 | 18 | - | não existe | - |
| `movements/map/ab'dendriel/ab'dendriel_home.lua` | 3110 | 4 | - | existe | `server/data/npc/crystalserver/classic74/the_gatekeeper.lua (pos 2, perto 0)`<br>`server/data/npc/crystalserver/services/guide_thelandil.lua (pos 2, perto 0)` |
| `movements/map/ab'dendriel/dark_pyramid_key_exit.lua` | 3103 | 9 | 65, 66 | não existe | - |
| `movements/map/ab'dendriel/dark_pyramid_lever_puzzle.lua` | 3104 | 10 | - | não existe | - |
| `movements/map/ab'dendriel/dark_pyramid_wall_1.lua` | 3019 | 4 | - | não existe | - |
| `movements/map/ab'dendriel/dark_pyramid_wall_2.lua` | 3020 | 4 | - | não existe | - |
| `movements/map/ab'dendriel/orichalcum_pearl_portal.lua` | - | 2 | 323 | não existe | - |
| `movements/map/ab'dendriel/sacrificial_altar.lua` | 3061 | 3 | - | não existe | - |
| `movements/map/ab'dendriel/sacrificial_altar_2.lua` | 3062 | 3 | - | não existe | - |
## Conferência manual

- `movements/map/ab'dendriel/ab'dendriel_home.lua` → **não existe (falso positivo)**. O candidato
  `server/data/npc/crystalserver/classic74/the_gatekeeper.lua` só tem a coordenada do templo como
  destino do teleporte de quem sai de Rookgaard; o script do 7.4 é um piso que define a cidade
  natal ao pisar. Portar.

Resultado conferido: 11 scripts, 0 com equivalente no servidor.
