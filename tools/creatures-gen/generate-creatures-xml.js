#!/usr/bin/env node
/**
 * Generates the map editor creature palette (mapeditor/data/860/creatures.xml)
 * from what the server actually has for the Tibia 7.4 content:
 *   - every monster script in server/data/monsters/
 *   - only the 7.4 NPCs (names from 74/npc/*.xml), resolved against the NPC scripts the
 *     server loads with npcSystem = "crystal" (server/data/npc/crystalserver/).
 * Names and outfits come from the server scripts, so the palette writes
 * exactly the names the server looks up.
 *
 * Usage: node generate-creatures-xml.js [outFile]
 * Docs: README.md nesta pasta.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { extractName, extractBlock } = require('../monsters-migrate/lua-extract');

const REPO = path.resolve(__dirname, '..', '..');
const MONSTERS_DIR = path.join(REPO, 'server/data/monsters');
const NPCS_DIR = path.join(REPO, 'server/data/npc/crystalserver');
const NPCS_74_DIR = path.join(REPO, '74/npc');
const outFile = path.resolve(process.argv[2] || path.join(REPO, 'mapeditor/data/860/creatures.xml'));

// 7.4 NPCs whose name is also a monster name; the server scripts were renamed
// because the editor keys creatures by name only (see NPC_NAME_FIXUPS in
// tools/map-migrate/convert-spawn.js).
const NPC_RENAMES = {
  'cobra': 'Cobra Statue',
  'demon skeleton': 'Demon Skeleton Guard',
};

function walkLua(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walkLua(full);
    return e.name.endsWith('.lua') ? [full] : [];
  });
}

function numberField(block, field) {
  const m = new RegExp(`\\b${field}\\s*=\\s*(\\d+)`).exec(block || '');
  return m ? Number(m[1]) : 0;
}

function outfitOf(text, owner) {
  const block = extractBlock(text, 'outfit', owner);
  const outfitText = block ? block.text : '';
  return {
    looktype: numberField(outfitText, 'lookType'),
    lookitem: numberField(outfitText, 'lookTypeEx'),
    lookaddon: numberField(outfitText, 'lookAddons'),
    lookhead: numberField(outfitText, 'lookHead'),
    lookbody: numberField(outfitText, 'lookBody'),
    looklegs: numberField(outfitText, 'lookLegs'),
    lookfeet: numberField(outfitText, 'lookFeet'),
  };
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function creatureLine(name, type, o) {
  return `\t<creature name="${escapeXml(name)}" type="${type}" looktype="${o.looktype}" lookitem="${o.lookitem}" lookaddon="${o.lookaddon}" lookhead="${o.lookhead}" lookbody="${o.lookbody}" looklegs="${o.looklegs}" lookfeet="${o.lookfeet}" />`;
}

const byName = (a, b) => a.name.localeCompare(b.name);

// Monsters: every server monster script.
const monsters = walkLua(MONSTERS_DIR).map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  return { name: extractName(text), outfit: outfitOf(text, 'monster'), file };
}).filter((m) => m.name).sort(byName);

// NPC scripts indexed by lowercase name (several files may register the same name).
const npcScripts = new Map();
for (const file of walkLua(NPCS_DIR)) {
  const text = fs.readFileSync(file, 'utf8');
  const m = /internalNpcName\s*=\s*"([^"]+)"/.exec(text) || /Game\.createNpcType\("([^"]+)"\)/.exec(text);
  if (!m) continue;
  const key = m[1].toLowerCase();
  if (!npcScripts.has(key)) npcScripts.set(key, []);
  npcScripts.get(key).push({ name: m[1], outfit: outfitOf(text, 'npcConfig'), file });
}

// NPCs: only the 7.4 ones.
const names74 = fs.readdirSync(NPCS_74_DIR)
  .filter((f) => f.endsWith('.xml'))
  .map((f) => /<npc[^>]*\sname="([^"]+)"/.exec(fs.readFileSync(path.join(NPCS_74_DIR, f), 'latin1')))
  .filter(Boolean)
  .map((m) => NPC_RENAMES[m[1].toLowerCase()] || m[1]);

const npcs = [];
const missing = [];
for (const name of new Set(names74)) {
  const scripts = npcScripts.get(name.toLowerCase());
  if (!scripts) {
    missing.push(name);
    continue;
  }
  if (scripts.length > 1) {
    console.warn(`"${name}" has ${scripts.length} scripts; outfit from ${path.relative(REPO, scripts[0].file)}`);
  }
  npcs.push(scripts[0]);
}
npcs.sort(byName);

const lines = [
  '<?xml version="1.0"?>',
  '<creatures>',
  '\t<!-- NPCs (Tibia 7.4, scripts in server/data/npc/crystalserver) -->',
  ...npcs.map((n) => creatureLine(n.name, 'npc', n.outfit)),
  '\t<!-- Monsters (server/data/monsters) -->',
  ...monsters.map((m) => creatureLine(m.name, 'monster', m.outfit)),
  '</creatures>',
  '',
];
fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

console.log(`npcs: ${npcs.length} (7.4 names: ${new Set(names74).size}, without a server script: ${missing.length})`);
for (const name of missing) console.log(`  missing NPC script: ${name}`);
console.log(`monsters: ${monsters.length}`);
console.log(`wrote ${outFile}`);
