#!/usr/bin/env node
// Post-migration validation: every .lua under server/data/monsters/ has
// balanced braces/parens, a unique raceId (where present), and a
// Game.createMonsterType(...) call. Not a full Lua parse, but catches the
// classes of error a broken merge/generate would produce.
'use strict';
const fs = require('fs');
const path = require('path');

const MONSTERS_DIR = 'D:/backlands/server/data/monsters';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.lua')) out.push(full);
  }
  return out;
}

const files = walk(MONSTERS_DIR);
console.log('total files:', files.length);

let errors = 0;
const raceIds = new Map();

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const openBrace = (text.match(/\{/g) || []).length;
  const closeBrace = (text.match(/\}/g) || []).length;
  const openParen = (text.match(/\(/g) || []).length;
  const closeParen = (text.match(/\)/g) || []).length;

  if (openBrace !== closeBrace) { console.log('UNBALANCED BRACES:', f, openBrace, closeBrace); errors++; }
  if (openParen !== closeParen) { console.log('UNBALANCED PARENS:', f, openParen, closeParen); errors++; }
  if (!/Game\.createMonsterType\(/.test(text)) { console.log('NO createMonsterType:', f); errors++; }
  if (!/mType:register\(monster\)/.test(text)) { console.log('NO register call:', f); errors++; }

  const raceIdMatch = /^monster\.raceId\s*=\s*(\d+)/m.exec(text);
  if (raceIdMatch) {
    const id = Number(raceIdMatch[1]);
    if (raceIds.has(id)) { console.log('DUPLICATE raceId', id, ':', raceIds.get(id), 'and', f); errors++; }
    raceIds.set(id, f);
  }
}

console.log('unique raceIds:', raceIds.size);
console.log('errors:', errors);
process.exit(errors > 0 ? 1 : 0);
