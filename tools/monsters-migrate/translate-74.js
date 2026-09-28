/**
 * Translates a parsed 7.4 monster XML tree into the plain-JS shape the Lua
 * writer expects, applying the constant mapping tables. Used both to
 * generate a brand-new monster.lua (monster has no current-server match)
 * and to build the "74 side" of a merge (monster already exists).
 */
'use strict';
const { children, child, attr, attrNum } = require('./xml-74');
const { raw } = require('./lua-write');
const {
  IMMUNITY_TO_COMBAT,
  IMMUNITY_TO_CONDITION,
  ATTACK_NAME_TO_COMBAT,
  SHOOTEFFECT_MAP,
  AREAEFFECT_MAP,
  AREAEFFECT_FALLBACK,
  TARGETSTRATEGY_KEY_MAP,
} = require('./mapping');

function translateFlags(monsterNode) {
  const flagsNode = child(monsterNode, 'flags');
  const out = {};
  if (!flagsNode) return out;
  for (const f of children(flagsNode, 'flag')) {
    if (f.attrs.has('summonable')) out.summonable = attrNum(f, 'summonable') === 1;
    if (f.attrs.has('illusionable')) out.illusionable = attrNum(f, 'illusionable') === 1;
    if (f.attrs.has('pushable')) out.pushable = attrNum(f, 'pushable') === 1;
    if (f.attrs.has('convinceable')) out.convinceable = attrNum(f, 'convinceable') === 1;
    if (f.attrs.has('canpushitems')) out.canPushItems = attrNum(f, 'canpushitems') === 1;
    if (f.attrs.has('canpushcreatures')) out.canPushCreatures = attrNum(f, 'canpushcreatures') === 1;
    if (f.attrs.has('targetdistance')) out.targetDistance = attrNum(f, 'targetdistance');
    if (f.attrs.has('runonhealth')) out.runHealth = attrNum(f, 'runonhealth');
  }
  return out;
}

// immunities: split into elements (combat damage types) and immunities
// (conditions). The 7.4 XML has one <immunity X="0|1"/> element per flag
// (not a single element with 8 attributes), so merge every child's attrs
// into one lookup before mapping.
function translateImmunities(monsterNode) {
  const immNode = child(monsterNode, 'immunities');
  const elements = [];
  const immunities = [];
  if (!immNode) return { elements, immunities };

  const merged = new Map();
  for (const imm of children(immNode, 'immunity')) {
    for (const [key, value] of imm.attrs) merged.set(key, value);
  }
  if (merged.size === 0) return { elements, immunities };

  for (const [key, combatType] of Object.entries(IMMUNITY_TO_COMBAT)) {
    if (merged.has(key)) {
      const isImmune = Number(merged.get(key)) === 1;
      elements.push({ type: raw(combatType), percent: isImmune ? 100 : 0 });
    }
  }
  for (const [key, condType] of Object.entries(IMMUNITY_TO_CONDITION)) {
    if (merged.has(key)) {
      immunities.push({ type: condType, condition: Number(merged.get(key)) === 1 });
    }
  }
  return { elements, immunities };
}

function translateAttackAttributes(attackNode) {
  const out = {};
  for (const a of children(attackNode, 'attribute')) {
    const key = attr(a, 'key');
    const value = attr(a, 'value');
    if (key === 'shooteffect') {
      const mapped = SHOOTEFFECT_MAP[value];
      if (mapped) out.shootEffect = raw(mapped);
    } else if (key === 'areaeffect') {
      const mapped = AREAEFFECT_MAP[value] || AREAEFFECT_FALLBACK;
      out.effect = raw(mapped);
    }
  }
  return out;
}

// One <attack> -> one current-style spell table, or null if untranslatable.
// 7.4's <attack delay="N"/> is in seconds (classic OTServ convention);
// current server's `interval` is milliseconds.
function translateAttack(attackNode) {
  const name = attr(attackNode, 'name');
  const extra = translateAttackAttributes(attackNode);
  const interval = attrNum(attackNode, 'delay', 2) * 1000;

  if (name === 'melee') {
    return {
      name: 'melee',
      interval,
      chance: 100,
      minDamage: 0,
      maxDamage: -attrNum(attackNode, 'attack', 0),
      ...extra,
    };
  }

  const combatType = ATTACK_NAME_TO_COMBAT[name];
  if (!combatType) return null; // firefield/energyfield/poisonfield/condition variants -- skipped, see README limitations

  const out = {
    name: 'combat',
    interval,
    chance: attrNum(attackNode, 'chance', 100),
    type: raw(combatType),
    minDamage: attrNum(attackNode, 'min', 0),
    maxDamage: attrNum(attackNode, 'max', 0),
    ...extra,
  };
  if (attackNode.attrs.has('range')) out.range = attrNum(attackNode, 'range');
  if (attackNode.attrs.has('length')) out.length = attrNum(attackNode, 'length');
  if (attackNode.attrs.has('spread')) out.spread = attrNum(attackNode, 'spread');
  if (attackNode.attrs.has('radius')) out.radius = attrNum(attackNode, 'radius');
  if (attackNode.attrs.has('target')) out.target = attrNum(attackNode, 'target') === 1;
  return out;
}

function translateAttacks(monsterNode) {
  const attacksNode = child(monsterNode, 'attacks');
  if (!attacksNode) return [];
  return children(attacksNode, 'attack').map(translateAttack).filter(Boolean);
}

// <defenses armor defense><defense name="healing" .../></defenses>
// -> {defense, armor, mitigation, ...spellEntries}
function translateDefenses(monsterNode) {
  const defNode = child(monsterNode, 'defenses');
  if (!defNode) return { defense: 0, armor: 0 };
  const out = {
    defense: attrNum(defNode, 'defense', 0),
    armor: attrNum(defNode, 'armor', 0),
  };
  const spells = [];
  for (const d of children(defNode, 'defense')) {
    if (attr(d, 'name') !== 'healing') continue; // only "healing" observed in the 74 dataset
    const extra = translateAttackAttributes(d);
    spells.push({
      name: 'combat',
      interval: attrNum(d, 'delay', 2) * 1000,
      chance: attrNum(d, 'chance', 100),
      type: raw('COMBAT_HEALING'),
      minDamage: attrNum(d, 'min', 0),
      maxDamage: attrNum(d, 'max', 0),
      ...extra,
    });
  }
  return { table: out, spells };
}

function translateLoot(monsterNode) {
  const lootNode = child(monsterNode, 'loot');
  if (!lootNode) return [];
  return children(lootNode, 'item').map((item) => {
    const chance74 = attrNum(item, 'chance', 0); // base 100000 in 7.4, same base as current server
    const countMax = attrNum(item, 'countmax', 1);
    const entry = { id: attrNum(item, 'id'), chance: chance74 };
    if (countMax > 1) entry.maxCount = countMax;
    return entry;
  });
}

function translateVoices(monsterNode) {
  const voicesNode = child(monsterNode, 'voices');
  if (!voicesNode) return null;
  const voiceList = children(voicesNode, 'voice').map((v) => ({
    text: attr(v, 'sentence'),
    yell: attrNum(v, 'yell', 0) === 1,
  }));
  if (voiceList.length === 0) return null;
  return { interval: 5000, chance: 10, list: voiceList };
}

function translateSummons(monsterNode) {
  const summonsNode = child(monsterNode, 'summons');
  if (!summonsNode) return null;
  // 7.4's <summon delay="N"/> is in seconds (classic OTServ convention,
  // values observed 4-18); current server's `interval` is milliseconds.
  const list = children(summonsNode, 'summon').map((s) => ({
    name: attr(s, 'name'),
    interval: attrNum(s, 'delay', 2) * 1000,
    chance: 100,
    count: attrNum(s, 'max', 1),
  }));
  if (list.length === 0) return null;
  return { maxSummons: attrNum(summonsNode, 'maxSummons', list.length), list };
}

function translateTargetStrategy(monsterNode) {
  const node = child(monsterNode, 'targetstrategy');
  if (!node) return null;
  const out = {};
  for (const [key74, keyCurrent] of Object.entries(TARGETSTRATEGY_KEY_MAP)) {
    if (node.attrs.has(key74)) out[keyCurrent] = attrNum(node, key74);
  }
  return out;
}

// Full translation of a 7.4 <monster> node into the plain-JS shape used by
// both the "new monster" generator and the merge builder.
function translateMonster(monsterNode) {
  const healthNode = child(monsterNode, 'health');
  const lookNode = child(monsterNode, 'look');
  const changeTargetNode = child(monsterNode, 'targetchange');
  const { elements: immunityElements, immunities } = translateImmunities(monsterNode);

  return {
    name: attr(monsterNode, 'name'),
    description: attr(monsterNode, 'nameDescription'),
    race: attr(monsterNode, 'race'),
    experience: attrNum(monsterNode, 'experience', 0),
    speed: attrNum(monsterNode, 'speed', 0),
    manaCost: attrNum(monsterNode, 'manacost', 0),
    health: attrNum(healthNode, 'now', 0),
    maxHealth: attrNum(healthNode, 'max', 0),
    corpse: attrNum(lookNode, 'corpse', 0),
    outfit: {
      lookType: attrNum(lookNode, 'type', 0),
      lookHead: attrNum(lookNode, 'head', 0),
      lookBody: attrNum(lookNode, 'body', 0),
      lookLegs: attrNum(lookNode, 'legs', 0),
      lookFeet: attrNum(lookNode, 'feet', 0),
      lookAddons: 0,
      lookMount: 0,
    },
    changeTarget: changeTargetNode ? { chance: attrNum(changeTargetNode, 'chance', 0), interval: 4000 } : null,
    targetStrategy: translateTargetStrategy(monsterNode),
    flags: translateFlags(monsterNode),
    immunityElements,
    immunities,
    attacks: translateAttacks(monsterNode),
    defenses: translateDefenses(monsterNode),
    loot: translateLoot(monsterNode),
    voices: translateVoices(monsterNode),
    summons: translateSummons(monsterNode),
  };
}

module.exports = { translateMonster };
