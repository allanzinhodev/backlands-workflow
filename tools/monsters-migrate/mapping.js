/**
 * Constant tables mapping 7.4 XML vocabulary to the current server's Lua
 * constant names. Kept separate from the generator so the mapping is easy
 * to audit/extend on its own.
 */
'use strict';

// 7.4 <immunity X="0|1"/> key -> current COMBAT_* constant (for the
// "combat" damage-type immunities, which the current server expresses as
// monster.elements percent=100/0, not monster.immunities).
const IMMUNITY_TO_COMBAT = {
  physical: 'COMBAT_PHYSICALDAMAGE',
  energy: 'COMBAT_ENERGYDAMAGE',
  fire: 'COMBAT_FIREDAMAGE',
  poison: 'COMBAT_EARTHDAMAGE', // 7.4 "poison" == current "earth"
  lifedrain: 'COMBAT_LIFEDRAIN',
};

// 7.4 <immunity X="0|1"/> key -> current monster.immunities {type="x", condition=bool} key.
// (fire/energy/poison/physical/lifedrain go through IMMUNITY_TO_COMBAT instead.)
const IMMUNITY_TO_CONDITION = {
  paralyze: 'paralyze',
  invisible: 'invisible',
  outfit: 'outfit',
};

// 7.4 <attack name="X"> -> current COMBAT_* constant, for damage attacks
// only (name="melee" is handled separately as a distinct spell type).
const ATTACK_NAME_TO_COMBAT = {
  physical: 'COMBAT_PHYSICALDAMAGE',
  fire: 'COMBAT_FIREDAMAGE',
  energy: 'COMBAT_ENERGYDAMAGE',
  poison: 'COMBAT_EARTHDAMAGE',
  manadrain: 'COMBAT_MANADRAIN',
  lifedrain: 'COMBAT_LIFEDRAIN',
};

// 7.4 <attribute key="shooteffect" value="X"/> -> current CONST_ANI_* constant.
// Covers every value observed across the 157 74-monster files. Verified
// against server/src/const.h (exact constant names/values). Purely a
// cosmetic projectile-animation choice -- doesn't affect combat math.
const SHOOTEFFECT_MAP = {
  spear: 'CONST_ANI_SPEAR',
  bolt: 'CONST_ANI_BOLT',
  arrow: 'CONST_ANI_ARROW',
  fire: 'CONST_ANI_FIRE',
  energy: 'CONST_ANI_ENERGY',
  poisonarrow: 'CONST_ANI_POISONARROW',
  burstarrow: 'CONST_ANI_BURSTARROW',
  throwingstar: 'CONST_ANI_THROWINGSTAR',
  throwingknife: 'CONST_ANI_THROWINGKNIFE',
  smallstone: 'CONST_ANI_SMALLSTONE',
  death: 'CONST_ANI_SUDDENDEATH',
  largerock: 'CONST_ANI_LARGEROCK',
  snowball: 'CONST_ANI_SNOWBALL',
  poison: 'CONST_ANI_POISON',
};

// 7.4 <attribute key="areaeffect" value="X"/> -> current CONST_ME_* constant.
// Covers every value observed across the 157 74-monster files. Verified
// against server/src/const.h. Values without an exact name/semantic match
// in the current effect list fall back to a neutral generic effect
// (CONST_ME_POFF) rather than blocking the migration over cosmetics.
const AREAEFFECT_MAP = {
  firearea: 'CONST_ME_FIREAREA',
  fire: 'CONST_ME_HITBYFIRE',
  poison: 'CONST_ME_HITBYPOISON',
  poisonarea: 'CONST_ME_POISONAREA',
  energy: 'CONST_ME_ENERGYHIT',
  mortarea: 'CONST_ME_MORTAREA',
  explosion: 'CONST_ME_EXPLOSIONHIT',
  explosionarea: 'CONST_ME_EXPLOSIONAREA',
  teleport: 'CONST_ME_TELEPORT',
  redshimmer: 'CONST_ME_MAGIC_RED',
  blueshimmer: 'CONST_ME_MAGIC_BLUE',
  greenshimmer: 'CONST_ME_MAGIC_GREEN',
  bluebubble: 'CONST_ME_BUBBLES',
  greenbubble: 'CONST_ME_BUBBLES',
  yellowbubble: 'CONST_ME_BUBBLES',
  redspark: 'CONST_ME_HITAREA',
  greenspark: 'CONST_ME_HITAREA',
  blackspark: 'CONST_ME_BLOCKHIT',
  rednote: 'CONST_ME_SOUND_RED',
  poff: 'CONST_ME_POFF',
};
const AREAEFFECT_FALLBACK = 'CONST_ME_POFF';

// 7.4 targetstrategy keys -> current strategiesTarget keys.
const TARGETSTRATEGY_KEY_MAP = {
  nearest: 'nearest',
  weakest: 'health',
  mostdamage: 'damage',
  random: 'random',
};

module.exports = {
  IMMUNITY_TO_COMBAT,
  IMMUNITY_TO_CONDITION,
  ATTACK_NAME_TO_COMBAT,
  SHOOTEFFECT_MAP,
  AREAEFFECT_MAP,
  AREAEFFECT_FALLBACK,
  TARGETSTRATEGY_KEY_MAP,
};
