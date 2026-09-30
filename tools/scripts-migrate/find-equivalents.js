#!/usr/bin/env node
/**
 * Read-only survey: for each Tibia 7.4 action/movement script that handles an
 * action id present in server/data/world/world.otbm, looks for server scripts
 * that already do the same thing, so the port can adapt them instead of
 * duplicating. Evidence, strongest first:
 *   - same map coordinates (the server's scripts target the global map, whose
 *     coordinates match the 7.4 map);
 *   - same action/unique id;
 *   - same item ids (7.4 Server IDs translated to Client IDs);
 *   - same storage keys.
 *
 * Usage: node find-equivalents.js <batch> | --list
 *   <batch> = a city folder under 74/scripts/{actions,movements}/map
 *             (e.g. rookgaard), "quests" (actions/map/quests.lua +
 *             actions/quests) or "other" (actions/other, actions/tools,
 *             movements/other).
 * Writes tools/scripts-migrate/reports/equivalents-<batch>.md.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { readOtbIdPairs } = require('../items-migrate/read-otb-ids');

const REPO = path.resolve(__dirname, '..', '..');
const SCRIPTS_74 = path.join(REPO, '74/scripts');
const SERVER_DIRS = ['server/data/scripts', 'server/data/lib', 'server/data/npc/crystalserver'].map((d) => path.join(REPO, d));
const MAP = path.join(REPO, 'server/data/world/world.otbm');
const REPORT_DIR = path.join(__dirname, 'reports');
const NEAR = 2; // tiles

function walkLua(dir) {
  if (!fs.existsSync(dir)) return [];
  if (fs.statSync(dir).isFile()) return dir.endsWith('.lua') ? [dir] : [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => walkLua(path.join(dir, e.name)));
}

function batches() {
  const cities = new Set();
  for (const kind of ['actions', 'movements']) {
    for (const e of fs.readdirSync(path.join(SCRIPTS_74, kind, 'map'), { withFileTypes: true })) {
      if (e.isDirectory()) cities.add(e.name);
    }
  }
  return [...[...cities].sort(), 'quests', 'other'];
}

function batchFiles(batch) {
  if (batch === 'quests') {
    return [path.join(SCRIPTS_74, 'actions/map/quests.lua'), ...walkLua(path.join(SCRIPTS_74, 'actions/quests'))];
  }
  if (batch === 'other') {
    return ['actions/other', 'actions/tools', 'movements/other'].flatMap((d) => walkLua(path.join(SCRIPTS_74, d)));
  }
  return ['actions', 'movements'].flatMap((kind) => walkLua(path.join(SCRIPTS_74, kind, 'map', batch)));
}

// Positions, action/unique ids, item ids and storage keys referenced by a script.
function extract(text) {
  const positions = [];
  const posRes = [
    /\{\s*x\s*=\s*(\d{4,5})\s*,\s*y\s*=\s*(\d{4,5})\s*,\s*z\s*=\s*(\d{1,2})\s*\}/g,
    /Position\(\s*(\d{4,5})\s*,\s*(\d{4,5})\s*,\s*(\d{1,2})\s*\)/g,
  ];
  for (const re of posRes) for (const m of text.matchAll(re)) positions.push({ x: +m[1], y: +m[2], z: +m[3] });

  const aids = new Set(), uids = new Set();
  for (const m of text.matchAll(/:(aid|uid)\(([^)]*)\)/g)) {
    for (const n of m[2].split(/[,\s]+/).filter(Boolean).map(Number)) (m[1] === 'aid' ? aids : uids).add(n);
  }
  for (const m of text.matchAll(/(?:actionid|getActionId\(\))\s*==\s*(\d+)/g)) aids.add(+m[1]);

  const itemIds = new Set();
  const itemRes = [
    /(?:getId\(\)|\.itemid|itemId|itemid)\s*[=~]=\s*(\d{3,5})/g,
    /(?:transform|createItem|removeItem|getItemById|addItem|doTransformItem|doCreateItem|doRemoveItem)\(\s*(\d{3,5})/g,
    /ItemInPosition\([^,]+,\s*(\d{3,5})/g,
    /\[(\d{3,5})\]\s*=/g,
  ];
  for (const re of itemRes) for (const m of text.matchAll(re)) itemIds.add(+m[1]);

  const storages = new Set();
  for (const m of text.matchAll(/(?:get|set)StorageValue\(\s*(\d+)/g)) storages.add(+m[1]);
  return { positions, aids, uids, itemIds, storages };
}

function buildServerIndex() {
  const files = SERVER_DIRS.flatMap(walkLua);
  const byPos = new Map(), byAid = new Map(), byUid = new Map(), byItem = new Map();
  const add = (map, key, file) => { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(file); };
  for (const file of files) {
    const e = extract(fs.readFileSync(file, 'utf8'));
    const rel = path.relative(REPO, file).replace(/\\/g, '/');
    for (const p of e.positions) add(byPos, `${p.x}:${p.y}:${p.z}`, rel);
    for (const a of e.aids) add(byAid, a, rel);
    for (const u of e.uids) add(byUid, u, rel);
    for (const i of e.itemIds) add(byItem, i, rel);
  }
  return { files: files.length, byPos, byAid, byUid, byItem };
}

// Action ids (OTBM_ATTR_ACTION_ID = 4) of the map's item nodes; same node walk
// as tools/map-migrate/remap-item-ids.js.
function mapActionIds() {
  const raw = fs.readFileSync(MAP);
  const aids = new Set();
  const sizes = { 4: 2, 5: 2, 8: 5, 10: 2, 22: 2, 12: 1, 14: 1, 15: 1, 17: 1, 16: 4, 18: 4, 20: 4, 21: 4, 23: 2, 24: 2, 25: 2, 26: 2, 27: 2 };
  let i = 4;
  (function node() {
    i++;
    let type = raw[i++];
    if (type === 0xFD) type = raw[i++];
    const bytes = [];
    while (raw[i] !== 0xFE && raw[i] !== 0xFF) { if (raw[i] === 0xFD) i++; bytes.push(raw[i++]); }
    if (type === 6 && bytes.length > 2) {
      const d = Buffer.from(bytes);
      let p = 2;
      while (p < d.length) {
        const a = d[p];
        if (a === 6 || a === 7 || a === 19) { p += 3 + d.readUInt16LE(p + 1); continue; }
        if (sizes[a] === undefined) break;
        if (a === 4) aids.add(d.readUInt16LE(p + 1));
        p += 1 + sizes[a];
      }
    }
    while (raw[i] === 0xFE) node();
    i++;
  })();
  return aids;
}

function survey(batch, index, mapAids, sidToCid) {
  return batchFiles(batch).map((file) => {
    const e = extract(fs.readFileSync(file, 'latin1'));
    const cidItems = new Set([...e.itemIds].map((id) => sidToCid.get(id)).filter(Boolean));
    const score = new Map();
    const entry = (f) => {
      if (!score.has(f)) score.set(f, { pos: 0, near: 0, aid: [], uid: [], items: new Set(), points: 0 });
      return score.get(f);
    };
    for (const p of e.positions) {
      for (const f of index.byPos.get(`${p.x}:${p.y}:${p.z}`) || []) { entry(f).pos++; entry(f).points += 5; }
      for (let dx = -NEAR; dx <= NEAR; dx++) for (let dy = -NEAR; dy <= NEAR; dy++) {
        if (!dx && !dy) continue;
        for (const f of index.byPos.get(`${p.x + dx}:${p.y + dy}:${p.z}`) || []) { entry(f).near++; entry(f).points += 2; }
      }
    }
    for (const a of e.aids) for (const f of index.byAid.get(a) || []) { entry(f).aid.push(a); entry(f).points += 4; }
    for (const u of e.uids) for (const f of index.byUid.get(u) || []) { entry(f).uid.push(u); entry(f).points += 4; }
    // Item ids alone are weak evidence (common items are everywhere): only
    // count them for files that already matched by position or id.
    for (const [f, s] of score) {
      for (const id of cidItems) if ((index.byItem.get(id) || new Set()).has(f)) { s.items.add(id); s.points += 1; }
    }

    const ranked = [...score].sort((a, b) => b[1].points - a[1].points).slice(0, 3);
    let verdict = 'não existe';
    if (ranked.length) {
      const s = ranked[0][1];
      const posShare = e.positions.length ? s.pos / e.positions.length : 0;
      if (s.aid.length || s.uid.length || posShare >= 0.5) verdict = 'existe';
      else if (s.pos || s.near) verdict = 'parcial';
    }
    return {
      file: path.relative(SCRIPTS_74, file).replace(/\\/g, '/'),
      mapAids: [...e.aids].filter((a) => mapAids.has(a)),
      positions: e.positions.length,
      storages: [...e.storages],
      verdict,
      candidates: ranked.map(([f, s]) => `${f} (pos ${s.pos}, perto ${s.near}${s.aid.length ? `, aid ${s.aid.join('/')}` : ''}${s.uid.length ? `, uid ${s.uid.join('/')}` : ''}${s.items.size ? `, itens ${[...s.items].slice(0, 5).join('/')}` : ''})`),
    };
  });
}

function writeReport(batch, rows) {
  const count = (v) => rows.filter((r) => r.verdict === v).length;
  const lines = [
    `# Equivalentes no servidor — ${batch}`,
    '',
    `Scripts do 7.4: ${rows.length} · existe: ${count('existe')} · parcial: ${count('parcial')} · não existe: ${count('não existe')}`,
    '',
    '| Script 7.4 | Aids do mapa | Posições | Storages | Veredito | Candidatos no servidor |',
    '|---|---|---|---|---|---|',
    ...rows.map((r) => `| \`${r.file}\` | ${r.mapAids.join(', ') || '-'} | ${r.positions} | ${r.storages.join(', ') || '-'} | ${r.verdict} | ${r.candidates.map((c) => `\`${c}\``).join('<br>') || '-'} |`),
    '',
  ];
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, `equivalents-${batch.replace(/[^a-z0-9]+/gi, '-')}.md`);
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  return out;
}

function main() {
  const arg = process.argv[2];
  if (!arg || arg === '--list') {
    console.log(batches().join('\n'));
    return;
  }
  const index = buildServerIndex();
  const rows = survey(arg, index, mapActionIds(), readOtbIdPairs(path.join(REPO, '74/items/items.otb')));
  const out = writeReport(arg, rows);
  const count = (v) => rows.filter((r) => r.verdict === v).length;
  console.log(`${arg}: ${rows.length} scripts | existe ${count('existe')} | parcial ${count('parcial')} | não existe ${count('não existe')} (servidor: ${index.files} arquivos)`);
  for (const r of rows) console.log(`  [${r.verdict}] ${r.file}${r.candidates[0] ? '  ->  ' + r.candidates[0] : ''}`);
  console.log(`report: ${out}`);
}

main();
