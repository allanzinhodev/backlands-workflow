# Equivalentes no servidor — carlin

Scripts do 7.4: 39 · existe: 1 · parcial: 0 · não existe: 38

| Script 7.4 | Aids do mapa | Posições | Storages | Veredito | Candidatos no servidor |
|---|---|---|---|---|---|
| `actions/map/carlin/banshee_lever_puzzle_1.lua` | 2019 | 4 | - | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_1_1.lua` | 2027 | 7 | 7 | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_1_2.lua` | 2028 | 6 | 7 | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_1_3.lua` | 2029 | 11 | 7 | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_1_4.lua` | 2030 | 6 | 7 | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_1_5.lua` | 2031 | 7 | 7 | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_2.lua` | 2020 | 4 | - | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_3.lua` | 2021 | 4 | - | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_4.lua` | 2022 | 4 | - | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_5.lua` | 2023 | 4 | - | não existe | - |
| `actions/map/carlin/banshee_lever_puzzle_6.lua` | 2024 | 4 | - | não existe | - |
| `actions/map/carlin/banshee_seal_secret_lever.lua` | 2025 | 6 | - | não existe | - |
| `actions/map/carlin/demona_energy_trap.lua` | 2017 | 14 | - | não existe | - |
| `actions/map/carlin/demona_lever_entrance.lua` | 2016 | 2 | - | não existe | - |
| `actions/map/carlin/ghostlands_beholder_lever.lua` | 2026 | 6 | - | não existe | - |
| `actions/map/carlin/ghostlands_lever.lua` | 2018 | 6 | - | não existe | - |
| `movements/map/carlin/banshee_quest_blood_seal.lua` | 3099 | 7 | 4 | não existe | - |
| `movements/map/carlin/banshee_quest_blood_tile.lua` | 3030 | 18 | - | não existe | - |
| `movements/map/carlin/banshee_quest_entrance_mw_restore.lua` | 3024 | 8 | - | não existe | - |
| `movements/map/carlin/banshee_quest_entrance_mw_restore_1.lua` | 3010 | 4 | - | não existe | - |
| `movements/map/carlin/banshee_quest_entrance_mw_restore_2.lua` | 3011 | 4 | - | não existe | - |
| `movements/map/carlin/banshee_quest_exit.lua` | 3094 | 2 | - | não existe | - |
| `movements/map/carlin/banshee_quest_ghost_seal.lua` | 3098 | 7 | 5 | não existe | - |
| `movements/map/carlin/banshee_quest_hole_removal_north.lua` | 3009 | 2 | - | não existe | - |
| `movements/map/carlin/banshee_quest_hole_removal_south.lua` | 3008 | 2 | - | não existe | - |
| `movements/map/carlin/banshee_quest_lever_puzzle.lua` | 3097 | 11 | 10 | não existe | - |
| `movements/map/carlin/banshee_quest_pearls_puzzle_1.lua` | 3095 | 13 | - | não existe | - |
| `movements/map/carlin/banshee_quest_pearls_puzzle_2.lua` | 3096 | 13 | - | não existe | - |
| `movements/map/carlin/banshee_quest_pearls_seal.lua` | 3102 | 13 | 6 | não existe | - |
| `movements/map/carlin/banshee_quest_stepback_illusion_north.lua` | 3007 | 0 | - | não existe | - |
| `movements/map/carlin/banshee_quest_stepback_illusion_south.lua` | 3006 | 0 | - | não existe | - |
| `movements/map/carlin/banshee_quest_summon_warlock.lua` | 3026 | 2 | 3 | não existe | - |
| `movements/map/carlin/banshee_quest_tiles_seal.lua` | 3101 | 4 | 8, 9 | não existe | - |
| `movements/map/carlin/banshee_quest_tile_puzzle_correct.lua` | 3028 | 0 | 8 | não existe | - |
| `movements/map/carlin/banshee_quest_tile_puzzle_first_step.lua` | 3027 | 0 | 8 | não existe | - |
| `movements/map/carlin/banshee_quest_tile_puzzle_incorrect.lua` | 3029 | 0 | 8 | não existe | - |
| `movements/map/carlin/banshee_quest_warlock_seal.lua` | 3100 | 21 | 7 | não existe | - |
| `movements/map/carlin/carlin_home.lua` | 3113 | 4 | - | existe | `server/data/npc/crystalserver/services/guide_alexena.lua (pos 2, perto 0)` |
| `movements/map/carlin/statue_removal.lua` | 3025 | 5 | - | não existe | - |
## Conferência manual

- `movements/map/carlin/carlin_home.lua` → **não existe (falso positivo)**. O candidato
  `server/data/npc/crystalserver/services/guide_alexena.lua` só usa a coordenada do templo como
  marca de mapa do guia (mesmo padrão de Thais/guide_luke); não define cidade natal nem teleporta.

Resultado conferido: 39 scripts (quase todos da Banshee Quest), 0 com equivalente no servidor.
