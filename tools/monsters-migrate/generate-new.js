/**
 * Generates a brand-new monster .lua file (server-current format) from a
 * translated 7.4 monster, for monsters with no current-server match.
 * No Bestiary block (nothing to inherit), no strategiesTarget override
 * beyond what the 7.4 targetstrategy maps to, fresh raceId assigned by
 * the caller.
 */
'use strict';
const { raw, luaValue, luaTable, assign } = require('./lua-write');

function buildLootTable(loot) {
  return loot.map((entry) => {
    const obj = { id: entry.id, chance: entry.chance };
    if (entry.maxCount) obj.maxCount = entry.maxCount;
    return obj;
  });
}

function buildDefenses(defenses) {
  const table = { ...defenses.table };
  const lines = [];
  const pad = '\t';
  const entries = Object.entries(table);
  const parts = entries.map(([k, v]) => `${k} = ${v}`);
  if (defenses.spells.length === 0) {
    return `{ ${parts.join(', ')} }`;
  }
  const spellLines = defenses.spells.map((s) => `${pad}${luaValue(s, 1)},`);
  return `{\n${pad}${parts.join(', ')},\n${spellLines.join('\n')}\n}`;
}

function generateNewMonster(translated, raceId) {
  const lines = [];
  lines.push(`local mType = Game.createMonsterType(${JSON.stringify(translated.name)})`);
  lines.push('local monster = {}');
  lines.push('');
  lines.push(assign('name', translated.name));
  lines.push(assign('description', translated.description));
  lines.push(assign('experience', translated.experience));
  lines.push(`monster.outfit = ${luaValue(translated.outfit, 0)}`);
  lines.push('');
  lines.push(`monster.raceId = ${raceId}`);
  lines.push('');
  lines.push(`monster.health = ${translated.health}`);
  lines.push(`monster.maxHealth = ${translated.maxHealth}`);
  if (translated.race) lines.push(assign('race', translated.race));
  lines.push(`monster.corpse = ${translated.corpse}`);
  lines.push(`monster.speed = ${translated.speed}`);
  lines.push(`monster.manaCost = ${translated.manaCost}`);
  lines.push('');

  if (translated.changeTarget) {
    lines.push('monster.changeTarget = {');
    lines.push(`\tinterval = ${translated.changeTarget.interval},`);
    lines.push(`\tchance = ${translated.changeTarget.chance},`);
    lines.push('}');
    lines.push('');
  }

  if (translated.targetStrategy) {
    lines.push(`monster.strategiesTarget = ${luaValue(translated.targetStrategy, 0)}`);
    lines.push('');
  }

  lines.push(`monster.flags = ${luaValue(translated.flags, 0)}`);
  lines.push('');

  if (translated.summons) {
    lines.push('monster.summon = {');
    lines.push(`\tmaxSummons = ${translated.summons.maxSummons},`);
    lines.push(`\tsummons = ${luaValue(translated.summons.list, 1)},`);
    lines.push('}');
    lines.push('');
  }

  if (translated.voices) {
    lines.push('monster.voices = {');
    lines.push(`\tinterval = ${translated.voices.interval},`);
    lines.push(`\tchance = ${translated.voices.chance},`);
    for (const v of translated.voices.list) {
      lines.push(`\t${luaValue(v, 1)},`);
    }
    lines.push('}');
    lines.push('');
  }

  lines.push(`monster.loot = ${luaValue(buildLootTable(translated.loot), 0)}`);
  lines.push('');

  lines.push(`monster.attacks = ${luaValue(translated.attacks, 0)}`);
  lines.push('');

  lines.push(`monster.defenses = ${buildDefenses(translated.defenses)}`);
  lines.push('');

  if (translated.immunityElements.length) {
    lines.push(`monster.elements = ${luaValue(translated.immunityElements, 0)}`);
    lines.push('');
  }

  if (translated.immunities.length) {
    lines.push(`monster.immunities = ${luaValue(translated.immunities, 0)}`);
    lines.push('');
  }

  lines.push('mType:register(monster)');
  lines.push('');

  return lines.join('\n');
}

module.exports = { generateNewMonster };
