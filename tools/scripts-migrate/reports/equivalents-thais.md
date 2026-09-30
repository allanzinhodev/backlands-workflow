# Equivalentes no servidor — thais

Scripts do 7.4: 18 · existe: 1 · parcial: 0 · não existe: 17

| Script 7.4 | Aids do mapa | Posições | Storages | Veredito | Candidatos no servidor |
|---|---|---|---|---|---|
| `actions/map/thais/beholder_bridge_lever_north.lua` | 2061 | 22 | - | não existe | - |
| `actions/map/thais/beholder_bridge_lever_south.lua` | 2060 | 22 | - | não existe | - |
| `actions/map/thais/cyclops_walls_lever.lua` | 2066 | 16 | - | não existe | - |
| `actions/map/thais/draw_well_down.lua` | 2078 | 1 | - | não existe | - |
| `actions/map/thais/fibula_draw_well_entrance.lua` | 2079 | 1 | - | não existe | - |
| `actions/map/thais/lighthouse_entrance_lever.lua` | 2064 | 4 | - | não existe | - |
| `actions/map/thais/lighthouse_teleport_entrance.lua` | 2065 | 8 | - | não existe | - |
| `actions/map/thais/mcronald_pig_lever_1.lua` | 2062 | 6 | - | não existe | - |
| `actions/map/thais/mcronald_pig_lever_2.lua` | 2063 | 6 | - | não existe | - |
| `actions/map/thais/mintwallin_bridge_lever.lua` | 2037 | 20 | - | não existe | - |
| `actions/map/thais/skeleton_draw_well.lua` | 2080 | 1 | - | não existe | - |
| `movements/map/thais/junglegrass_hiddentile.lua` | 3003 | 1 | 48 | não existe | - |
| `movements/map/thais/lighthouse_exit.lua` | 3115 | 6 | - | não existe | - |
| `movements/map/thais/lighthouse_portal.lua` | 3114 | 8 | - | não existe | - |
| `movements/map/thais/lighthouse_stair_tile.lua` | 3033 | 2 | - | não existe | - |
| `movements/map/thais/mintwallin_sewer_gate_opener.lua` | 3034 | 6 | - | não existe | - |
| `movements/map/thais/sorcerer_only_tile.lua` | 3117 | 1 | - | não existe | - |
| `movements/map/thais/thais_home.lua` | 3112 | 4 | - | existe | `server/data/npc/crystalserver/services/guide_luke.lua (pos 2, perto 0)` |
## Conferência manual

- `movements/map/thais/thais_home.lua` → **não existe (falso positivo)**. O candidato
  `server/data/npc/crystalserver/services/guide_luke.lua` só usa a coordenada do templo
  (32369,32241,7) como marca de mapa do guia; não define cidade natal nem teleporta. Portar.

Resultado conferido: 18 scripts, 0 com equivalente no servidor.
