#!/usr/bin/env node
/**
 * Rewrites the item ids of migrated monster scripts (monster.corpse and the
 * `id = N` entries inside monster.loot) from 7.4 Server IDs to Client IDs,
 * using the pairs of a reference items.otb (default: 74/items/items.otb).
 *
 * The server indexes items by Client ID (server/src/items.cpp ignores the
 * .otb Server ID); migrate-monsters.js copied corpse/loot straight from the
 * 7.4 XML, which speaks 7.4 Server IDs.
 *
 * Usage: node remap-item-ids.js [--dry-run] [reference.otb]
 * Docs: README.md nesta pasta.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { readOtbIdPairs } = require('../items-migrate/read-otb-ids');

const REPO = path.resolve(__dirname, '..', '..');
const MONSTERS_DIR = path.join(REPO, 'server/data/monsters');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const refOtb = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(REPO, '74/items/items.otb'));
const sidToCid = readOtbIdPairs(refOtb);

const unmapped = new Map();
function remap(sid, file) {
  if (sid === 0) return 0; // corpse 0 = no corpse
  const cid = sidToCid.get(sid);
  if (cid === undefined || cid === null) {
    unmapped.set(`${path.relative(MONSTERS_DIR, file)}:${sid}`, sid);
    return sid;
  }
  return cid;
}

// Returns [start, end) of the balanced { ... } that opens at or after `from`.
function balancedBlock(text, from) {
  const open = text.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return [open, i + 1];
  }
  throw new Error('unbalanced braces');
}

function remapFile(file) {
  let text = fs.readFileSync(file, 'utf8');
  let changes = 0;

  text = text.replace(/^(\s*monster\.corpse\s*=\s*)(\d+)/m, (m, prefix, id) => {
    changes++;
    return prefix + remap(Number(id), file);
  });

  const lootAt = text.search(/^\s*monster\.loot\s*=/m);
  if (lootAt >= 0) {
    const [start, end] = balancedBlock(text, lootAt);
    const block = text.slice(start, end).replace(/(\bid\s*=\s*)(\d+)/g, (m, prefix, id) => {
      changes++;
      return prefix + remap(Number(id), file);
    });
    text = text.slice(0, start) + block + text.slice(end);
  }

  if (!DRY_RUN) fs.writeFileSync(file, text, 'utf8');
  return changes;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.lua') ? [path.join(dir, e.name)] : []);
}

let files = 0, ids = 0;
for (const file of walk(MONSTERS_DIR)) {
  ids += remapFile(file);
  files++;
}
console.log(`${DRY_RUN ? '[dry-run] ' : ''}${files} monster files, ${ids} item ids remapped via ${refOtb}`);
console.log(`ids without a Client ID (kept as is): ${unmapped.size}`);
for (const key of unmapped.keys()) console.log(`  ${key}`);
