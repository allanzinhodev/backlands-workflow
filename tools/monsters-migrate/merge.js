/**
 * Merges a translated 7.4 monster into an existing current-server .lua
 * file's text, by surgical splice: only the fields the migration plan
 * says come from 74 are replaced (whole `monster.<field> = ...` block,
 * end-to-end including trailing blank line where present); everything
 * else in the file (Bestiary, strategiesTarget, extra flags, attacks,
 * elements/defenses entries already present, light, events, etc.) is
 * left completely untouched.
 *
 * Rules (see plan): 74 wins for health/experience/speed/race/corpse/look/
 * manaCost; flags get 74's values merged over current's (current-only
 * flags survive); elements/defenses keep current's existing per-type
 * entries and only gain 74-derived ones for types current doesn't have;
 * attacks/strategiesTarget/Bestiary are never touched; loot/voices/summon
 * are fully replaced by 74's translation.
 */
'use strict';
const { extractBlock } = require('./lua-extract');
const { luaValue, raw } = require('./lua-write');
const { ATTACK_NAME_TO_COMBAT } = require('./mapping'); // unused here directly but documents scope

function replaceSimpleAssignment(text, field, newValue) {
  const re = new RegExp(`^monster\\.${field}\\s*=.*$`, 'm');
  if (!re.test(text)) return text; // field absent in current -- leave as-is, don't invent a new line here
  return text.replace(re, `monster.${field} = ${newValue}`);
}

// Replaces a whole `monster.<field> = { ... }` block (multi-line) with a
// freshly serialized value. If the field isn't present in `text`, returns
// text unchanged (caller decides whether to insert instead).
function replaceBlock(text, field, newValueLua) {
  const block = extractBlock(text, field);
  if (!block) return null;
  const before = text.slice(0, block.matchStart);
  const after = text.slice(block.end);
  return before + `monster.${field} = ${newValueLua}` + after;
}

// Parses `monster.flags = { k = v, ... }` from current text into a plain
// JS object (booleans/numbers only -- every flag value observed in the
// dataset is a bare true/false/number, never a string or nested table).
function parseCurrentFlags(text) {
  const block = extractBlock(text, 'flags');
  const out = {};
  if (!block) return out;
  const body = block.text.slice(1, -1); // strip outer braces
  const re = /(\w+)\s*=\s*(true|false|-?\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(body))) {
    out[m[1]] = m[2] === 'true' ? true : m[2] === 'false' ? false : Number(m[2]);
  }
  return out;
}

function mergeFlags(text, translatedFlags) {
  const currentFlags = parseCurrentFlags(text);
  const merged = { ...currentFlags, ...translatedFlags }; // 74 wins on overlapping keys, current-only keys survive
  return replaceBlock(text, 'flags', luaValue(merged, 0));
}

// Parses `monster.elements = { {type=COMBAT_X, percent=N}, ... }` into a
// Map<combatTypeName, percent>.
function parseCurrentElements(text) {
  const block = extractBlock(text, 'elements');
  const map = new Map();
  if (!block) return map;
  const re = /type\s*=\s*(COMBAT_\w+)\s*,\s*percent\s*=\s*(-?\d+)/g;
  let m;
  while ((m = re.exec(block.text))) map.set(m[1], Number(m[2]));
  return map;
}

function mergeElements(text, immunityElements) {
  const current = parseCurrentElements(text);
  const additions = immunityElements.filter((e) => !current.has(e.type.text));
  if (additions.length === 0) return text; // current already covers every type 74 knows about -- nothing to add

  const block = extractBlock(text, 'elements');
  if (!block) {
    // current has no elements block at all -- current prevails means "nothing
    // to prefer over", so the whole 74-derived list becomes the block.
    const lua = luaValue(immunityElements, 0);
    return insertAfterField(text, 'flags', 'elements', lua);
  }

  const closeBraceIdx = block.text.lastIndexOf('}');
  const innerBeforeClose = block.text.slice(0, closeBraceIdx);
  const pad = '\t';
  const newEntries = additions.map((e) => `${pad}{ type = ${e.type.text}, percent = ${e.percent} },`).join('\n');
  const rebuilt = innerBeforeClose + (innerBeforeClose.trim().endsWith(',') || innerBeforeClose.trim() === '{' ? '\n' : ',\n') + newEntries + '\n}';
  return text.slice(0, block.start) + rebuilt + text.slice(block.end);
}

// Parses `monster.defenses = { defense=N, armor=N, mitigation=N, {spell}, ... }`.
function parseCurrentDefenses(text) {
  const block = extractBlock(text, 'defenses');
  const result = { hasDefense: false, hasArmor: false, spellNames: new Set() };
  if (!block) return result;
  if (/defense\s*=\s*\d/.test(block.text)) result.hasDefense = true;
  if (/armor\s*=\s*\d/.test(block.text)) result.hasArmor = true;
  const re = /type\s*=\s*(COMBAT_\w+)/g;
  let m;
  while ((m = re.exec(block.text))) result.spellNames.add(m[1]);
  return result;
}

function mergeDefenses(text, translatedDefenses) {
  const current = parseCurrentDefenses(text);
  const block = extractBlock(text, 'defenses');
  const newSpells = translatedDefenses.spells.filter((s) => !current.spellNames.has(s.type.text));

  if (!block) {
    if (newSpells.length === 0 && Object.keys(translatedDefenses.table).length === 0) return text;
    const table = { ...translatedDefenses.table };
    const lua = newSpells.length ? luaTableWithSpells(table, newSpells) : luaValue(table, 0);
    return insertAfterField(text, 'flags', 'defenses', lua);
  }

  if (newSpells.length === 0) return text; // nothing new to add; defense/armor/mitigation values themselves are left as current's (current prevails)

  const closeBraceIdx = block.text.lastIndexOf('}');
  const innerBeforeClose = block.text.slice(0, closeBraceIdx);
  const pad = '\t';
  const newEntries = newSpells.map((s) => `${pad}${luaValue(s, 1)},`).join('\n');
  const rebuilt = innerBeforeClose + (innerBeforeClose.trim().endsWith(',') || innerBeforeClose.trim() === '{' ? '\n' : ',\n') + newEntries + '\n}';
  return text.slice(0, block.start) + rebuilt + text.slice(block.end);
}

function luaTableWithSpells(table, spells) {
  const pad = '\t';
  const fieldLines = Object.entries(table).map(([k, v]) => `${pad}${k} = ${v},`);
  const spellLines = spells.map((s) => `${pad}${luaValue(s, 1)},`);
  return `{\n${fieldLines.join('\n')}\n${spellLines.join('\n')}\n}`;
}

// Inserts `monster.<field> = <lua>\n\n` right after the block for
// `afterField` (or right after `monster.raceId = N` line if afterField
// isn't found), used when the current file has no existing block for a
// field 74 needs to introduce.
function insertAfterField(text, afterField, newField, newValueLua) {
  const block = extractBlock(text, afterField);
  const insertion = `\nmonster.${newField} = ${newValueLua}\n`;
  if (block) {
    return text.slice(0, block.end) + insertion + text.slice(block.end);
  }
  const raceIdMatch = /^monster\.raceId\s*=.*$/m.exec(text);
  if (raceIdMatch) {
    const pos = raceIdMatch.index + raceIdMatch[0].length;
    return text.slice(0, pos) + insertion + text.slice(pos);
  }
  return text + insertion; // last resort
}

function buildVoicesLua(voices) {
  const pad = '\t';
  const lines = [`\tinterval = ${voices.interval},`, `\tchance = ${voices.chance},`];
  for (const v of voices.list) lines.push(`${pad}${luaValue(v, 1)},`);
  return `{\n${lines.join('\n')}\n}`;
}

function buildSummonLua(summons) {
  const pad = '\t';
  const summonLines = summons.list.map((s) => `${pad}\t${luaValue(s, 2)},`).join('\n');
  return `{\n\tmaxSummons = ${summons.maxSummons},\n\tsummons = {\n${summonLines}\n\t},\n}`;
}

function replaceOrInsert(text, field, newValueLua, afterField) {
  const replaced = replaceBlock(text, field, newValueLua);
  if (replaced !== null) return replaced;
  return insertAfterField(text, afterField, field, newValueLua);
}

/**
 * Applies the full merge to `text` (current file's raw source) using
 * `translated` (74 monster, from translate-74.js). Returns the new text.
 */
function mergeMonster(text, translated) {
  let out = text;

  // health/experience/speed/race/corpse/look/manaCost -- 74 wins.
  out = replaceSimpleAssignment(out, 'health', String(translated.health));
  out = replaceSimpleAssignment(out, 'maxHealth', String(translated.maxHealth));
  out = replaceSimpleAssignment(out, 'experience', String(translated.experience));
  out = replaceSimpleAssignment(out, 'speed', String(translated.speed));
  out = replaceSimpleAssignment(out, 'manaCost', String(translated.manaCost));
  out = replaceSimpleAssignment(out, 'corpse', String(translated.corpse));
  if (translated.race) out = replaceSimpleAssignment(out, 'race', `"${translated.race}"`);
  const outfitReplaced = replaceBlock(out, 'outfit', luaValue(translated.outfit, 0));
  if (outfitReplaced !== null) out = outfitReplaced;

  // flags -- 74 wins on overlapping keys, current-only keys survive.
  const flagsReplaced = mergeFlags(out, translated.flags);
  if (flagsReplaced !== null) out = flagsReplaced;

  // elements -- current prevails per type; 74 only adds missing types.
  out = mergeElements(out, translated.immunityElements);

  // immunities (condition-type) -- same "current prevails per type" rule.
  out = mergeImmunitiesConditions(out, translated.immunities);

  // defenses -- current's defense/armor/mitigation prevail; 74 only adds
  // spell entries for types current doesn't already have.
  out = mergeDefenses(out, translated.defenses);

  // attacks / strategiesTarget / Bestiary -- never touched (per plan).

  // loot / voices / summon -- 74 always replaces entirely.
  const lootLua = luaValue(translated.loot.map((e) => {
    const o = { id: e.id, chance: e.chance };
    if (e.maxCount) o.maxCount = e.maxCount;
    return o;
  }), 0);
  out = replaceOrInsert(out, 'loot', lootLua, 'attacks');

  if (translated.voices) {
    out = replaceOrInsert(out, 'voices', buildVoicesLua(translated.voices), 'summon');
  }
  if (translated.summons) {
    out = replaceOrInsert(out, 'summon', buildSummonLua(translated.summons), 'flags');
  }

  return out;
}

function parseCurrentImmunitiesConditions(text) {
  const block = extractBlock(text, 'immunities');
  const set = new Set();
  if (!block) return set;
  const re = /type\s*=\s*"(\w+)"/g;
  let m;
  while ((m = re.exec(block.text))) set.add(m[1]);
  return set;
}

function mergeImmunitiesConditions(text, translatedImmunities) {
  const current = parseCurrentImmunitiesConditions(text);
  const additions = translatedImmunities.filter((i) => !current.has(i.type));
  if (additions.length === 0) return text;

  const block = extractBlock(text, 'immunities');
  if (!block) {
    return insertAfterField(text, 'elements', 'immunities', luaValue(translatedImmunities, 0));
  }
  const closeBraceIdx = block.text.lastIndexOf('}');
  const innerBeforeClose = block.text.slice(0, closeBraceIdx);
  const pad = '\t';
  const newEntries = additions.map((i) => `${pad}{ type = "${i.type}", condition = ${i.condition} },`).join('\n');
  const rebuilt = innerBeforeClose + (innerBeforeClose.trim().endsWith(',') || innerBeforeClose.trim() === '{' ? '\n' : ',\n') + newEntries + '\n}';
  return text.slice(0, block.start) + rebuilt + text.slice(block.end);
}

module.exports = { mergeMonster };
