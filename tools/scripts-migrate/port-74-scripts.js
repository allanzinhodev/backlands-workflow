#!/usr/bin/env node
/**
 * Ports Tibia 7.4 action/movement scripts to the current server:
 *   - item ids: 7.4 Server ID -> Client ID (74/items/items.otb), only where
 *     the number is an item id by construction (see ITEM_CONTEXTS);
 *   - storages: getStorageValue(n) / setStorageValue(n, ...) ->
 *     PlayerStorageKeys.classic74QuestBase + n (7.4 QuestValue n);
 *   - everything else is copied verbatim.
 * Numbers it cannot classify are listed per file for manual review.
 *
 * Output: server/data/scripts/classic74/<same path as under 74/scripts>.
 *
 * Usage: node port-74-scripts.js <batch> [--dry-run]
 *   <batch> as in find-equivalents.js (a city, "quests" or "other").
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { readOtbIdPairs } = require('../items-migrate/read-otb-ids');

const REPO = path.resolve(__dirname, '..', '..');
const SCRIPTS_74 = path.join(REPO, '74/scripts');
const OUT_DIR = path.join(REPO, 'server/data/scripts/classic74');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const batch = args.find((a) => !a.startsWith('--'));
if (!batch) {
  console.error('Usage: node port-74-scripts.js <batch> [--dry-run]');
  process.exit(1);
}

const sidToCid = readOtbIdPairs(path.join(REPO, '74/items/items.otb'));

function walkLua(dir) {
  if (!fs.existsSync(dir)) return [];
  if (fs.statSync(dir).isFile()) return dir.endsWith('.lua') ? [dir] : [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => walkLua(path.join(dir, e.name)));
}

function batchFiles(name) {
  if (name === 'quests') return [path.join(SCRIPTS_74, 'actions/map/quests.lua'), ...walkLua(path.join(SCRIPTS_74, 'actions/quests'))];
  if (name === 'other') return ['actions/other', 'actions/tools', 'movements/other'].flatMap((d) => walkLua(path.join(SCRIPTS_74, d)));
  return ['actions', 'movements'].flatMap((kind) => walkLua(path.join(SCRIPTS_74, kind, 'map', name)));
}

// A position argument: a {x = .., y = .., z = ..} table or a plain expression.
const POS = String.raw`(?:\{[^{}]*\}|[\w.:]+(?:\([^()]*\))?)`;
const ID = String.raw`(\d{3,5})`;

// Each context lists which capture groups are item ids.
const ITEM_CONTEXTS = [
  { re: new RegExp(String.raw`(getId\(\)\s*[=~]=\s*)${ID}`, 'g'), ids: [2] },
  { re: new RegExp(String.raw`(\.itemid\s*[=~]=\s*)${ID}`, 'g'), ids: [2] },
  { re: new RegExp(String.raw`(\btransform\(\s*)${ID}`, 'g'), ids: [2] },
  { re: new RegExp(String.raw`(\b(?:Game\.createItem|doCreateItem|doCreateItemEx|addItem|removeItem|getItemById|getItemCount|doPlayerAddItem|doPlayerRemoveItem)\(\s*)${ID}`, 'g'), ids: [2] },
  { re: new RegExp(String.raw`(\b(?:Game\.isItemInPosition|Game\.removeItemInPosition|Game\.setMapItemActionId)\s*\(\s*${POS}\s*,\s*)${ID}`, 'g'), ids: [2] },
  { re: new RegExp(String.raw`(\bGame\.transformItemInPosition\s*\(\s*${POS}\s*,\s*)${ID}(\s*,\s*)${ID}`, 'g'), ids: [2, 4] },
  { re: new RegExp(String.raw`(\bdoTransformItem\(\s*[\w.:()]+\s*,\s*)${ID}`, 'g'), ids: [2] },
];

const STORAGE_RE = /\b((?:get|set)StorageValue\(\s*)(\d+)(?=\s*[,)])/g;

function port(text, report) {
  const translated = new Set();
  const translate = (sid) => {
    const cid = sidToCid.get(Number(sid));
    if (cid === undefined || cid === null) {
      report.unmapped.add(Number(sid));
      return sid;
    }
    translated.add(`${sid}->${cid}`);
    return String(cid);
  };

  let out = text;
  for (const { re, ids } of ITEM_CONTEXTS) {
    out = out.replace(re, (...m) => {
      const groups = m.slice(1, m.length - 2);
      return groups.map((g, index) => (ids.includes(index + 1) ? translate(g) : g ?? '')).join('');
    });
  }
  out = out.replace(STORAGE_RE, (whole, prefix, n) => {
    report.storages.add(Number(n));
    return `${prefix}PlayerStorageKeys.classic74QuestBase + ${n}`;
  });
  report.translated = [...translated];

  // Unclassified numbers: 3+ digit literals outside positions, aid/uid
  // registration, magic effects and the contexts handled above.
  const stripped = out
    .replace(/\{\s*x\s*=[^{}]*\}/g, '')
    .replace(/:(?:aid|uid|id)\([^)]*\)/g, '')
    .replace(/sendMagicEffect\([^)]*\)/g, '')
    .replace(/PlayerStorageKeys\.classic74QuestBase \+ \d+/g, '');
  const knownIds = new Set([...translated].map((t) => t.split('->')[1]));
  for (const m of stripped.matchAll(/\b(\d{3,5})\b/g)) {
    if (!knownIds.has(m[1])) report.unclassified.add(Number(m[1]));
  }
  return out;
}

const files = batchFiles(batch);
const summary = [];
for (const file of files) {
  const rel = path.relative(SCRIPTS_74, file).replace(/\\/g, '/');
  const report = { unmapped: new Set(), storages: new Set(), unclassified: new Set(), translated: [] };
  const header = `-- Ported from the Tibia 7.4 datapack: 74/scripts/${rel}\n-- (tools/scripts-migrate/port-74-scripts.js: item ids 7.4 Server ID -> Client ID, storages -> classic74QuestBase + n)\n\n`;
  const body = port(fs.readFileSync(file, 'latin1'), report);
  const target = path.join(OUT_DIR, rel);
  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, header + body, 'utf8');
  }
  summary.push({ rel, report });
}

for (const { rel, report } of summary) {
  const parts = [`${report.translated.length} item ids`];
  if (report.storages.size) parts.push(`storages ${[...report.storages].join(',')}`);
  if (report.unmapped.size) parts.push(`SEM CLIENT ID ${[...report.unmapped].join(',')}`);
  if (report.unclassified.size) parts.push(`REVISAR ${[...report.unclassified].join(',')}`);
  console.log(`${rel}: ${parts.join(' | ')}`);
}
console.log(`${DRY_RUN ? '[dry-run] ' : ''}${summary.length} scripts -> ${path.relative(REPO, OUT_DIR)}`);
