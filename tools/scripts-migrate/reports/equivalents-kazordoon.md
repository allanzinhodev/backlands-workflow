# Equivalentes no servidor — kazordoon

Scripts do 7.4: 27 · existe: 1 · parcial: 0 · não existe: 26

| Script 7.4 | Aids do mapa | Posições | Storages | Veredito | Candidatos no servidor |
|---|---|---|---|---|---|
| `actions/map/kazordoon/elevator_lever_down.lua` | 2032 | 16 | - | não existe | - |
| `actions/map/kazordoon/elevator_lever_up.lua` | 2035 | 8 | - | não existe | - |
| `actions/map/kazordoon/ladder_lever.lua` | 2034 | 4 | - | não existe | - |
| `actions/map/kazordoon/paradox_tower_box_puzzle.lua` | 2047 | 3 | - | não existe | - |
| `actions/map/kazordoon/paradox_tower_chess_puzzle.lua` | 2050 | 7 | - | não existe | - |
| `actions/map/kazordoon/paradox_tower_food_puzzle.lua` | 2049 | 14 | - | não existe | - |
| `actions/map/kazordoon/paradox_tower_lever_puzzle.lua` | 2048 | 10 | - | não existe | - |
| `actions/map/kazordoon/stone_lever.lua` | 2033 | 16 | - | não existe | - |
| `movements/map/kazordoon/kazordoon_home.lua` | 3109 | 4 | - | existe | `server/data/npc/crystalserver/classic74/the_gatekeeper.lua (pos 2, perto 0)` |
| `movements/map/kazordoon/paradox_tower_crate_puzzle.lua` | 3048 | 10 | - | não existe | - |
| `movements/map/kazordoon/paradox_tower_deadtree.lua` | 3004 | 8 | - | não existe | - |
| `movements/map/kazordoon/paradox_tower_entrance.lua` | 3005 | 3 | - | não existe | - |
| `movements/map/kazordoon/paradox_tower_exit.lua` | 3050 | 2 | - | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_1.lua` | 3036 | 1 | 42 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_10.lua` | 3045 | 1 | 44 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_11.lua` | 3046 | 1 | 44 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_12.lua` | 3047 | 1 | 42 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_2.lua` | 3037 | 1 | 41 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_3.lua` | 3038 | 1 | 43 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_4.lua` | 3039 | 1 | 41 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_5.lua` | 3040 | 1 | 43 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_6.lua` | 3041 | 1 | 42 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_7.lua` | 3042 | 1 | 43 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_8.lua` | 3043 | 1 | 44 | não existe | - |
| `movements/map/kazordoon/paradox_tower_reward_9.lua` | 3044 | 1 | 41 | não existe | - |
| `movements/map/kazordoon/paradox_tower_skulls_entrance.lua` | 3049 | 18 | - | não existe | - |
| `movements/map/kazordoon/paradox_tower_stairopener.lua` | 3035 | 5 | - | não existe | - |
## Conferência manual

- `movements/map/kazordoon/kazordoon_home.lua` → **não existe (falso positivo)**, mesmo caso de
  Ab'Dendriel: `the_gatekeeper.lua` só tem a coordenada do templo como destino de teleporte. Portar.

Resultado conferido: 27 scripts (quase todos da Paradox Tower), 0 com equivalente no servidor.
