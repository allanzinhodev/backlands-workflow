#!/usr/bin/env node
/**
 * Migrates monsters from the 7.4 reference datapack (74/monster/monsters/*.xml)
 * into the current server's monster scripts (server/data/monsters/**\/*.lua),
 * using the 7.4 as source of truth for core stats/attributes while
 * preserving current-server-only data (Bestiary, strategiesTarget, attacks,
 * extra flags, elements/defenses entries the 74 doesn't define).
 *
 * Usage: node migrate-monsters.js [--dry-run]
 * Docs: README.md nesta pasta.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { parseMonsterXml, attr } = require('./xml-74');
const { translateMonster } = require('./translate-74');
const { generateNewMonster } = require('./generate-new');
const { mergeMonster } = require('./merge');
const { extractMonsterInfo } = require('./lua-extract');

const REPO = 'D:/backlands';
const DIR_74 = path.join(REPO, '74/monster/monsters');
const MONSTERS_DIR = path.join(REPO, 'server/data/monsters');
const NEW_MONSTERS_DIR = path.join(MONSTERS_DIR, 'classic74');
const REPORT_DIR = path.join(__dirname, 'reports');

const DRY_RUN = process.argv.includes('--dry-run');

// Known name differences between the 7.4 datapack and the current server.
const SYNONYMS = {
  beholder: 'bonelord',
  'elder beholder': 'elder bonelord',
};

// 74 files whose internal name= is misleading and would collide with an
// unrelated current monster if matched literally by name:
// - The 4 butterfly color variants all share name="Butterfly" in the 74
//   XML (color is only in the filename), colliding with 4 different
//   current candidates -- ambiguous, no safe automatic pick.
// - Several classic 7.4 bosses (Ferumbras, Morgaroth, Orshabaal, Rahemos,
//   Infernatil) and the "Illusion" trash mob all use name="Demon" in
//   their XML -- a 7.4 game mechanic where these monsters visually
//   disguise as a Demon until provoked. Their stats are wildly different
//   from the real Demon (health 50-110000 vs Demon's 8200), so matching
//   them by name would silently overwrite the current Demon.lua multiple
//   times. Only demon.xml itself should match Demon; the rest become new
//   monsters under their own (file-derived) names.
const FORCE_NO_MATCH_FILES = new Set([
  'blue butterfly.xml',
  'purple butterfly.xml',
  'red butterfly.xml',
  'yellow butterfly.xml',
  'ferumbras.xml',
  'infernatil.xml',
  'morgaroth.xml',
  'orshabaal.xml',
  'rahemos.xml',
  'illusion.xml',
]);

// For files in FORCE_NO_MATCH_FILES whose internal name= is misleading
// (the "disguised as Demon" bosses), use a proper display name derived
// from the filename instead of the XML's name= when generating the new
// monster (affects Game.createMonsterType(...) and the output filename).
const DISPLAY_NAME_OVERRIDES = {
  'ferumbras.xml': 'Ferumbras',
  'infernatil.xml': 'Infernatil',
  'morgaroth.xml': 'Morgaroth',
  'orshabaal.xml': 'Orshabaal',
  'rahemos.xml': 'Rahemos',
  'illusion.xml': 'Demon Illusion',
  'blue butterfly.xml': 'Blue Butterfly',
  'purple butterfly.xml': 'Purple Butterfly',
  'red butterfly.xml': 'Red Butterfly',
  'yellow butterfly.xml': 'Yellow Butterfly',
};

function normalize(name) {
  return name.trim().toLowerCase();
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.lua')) out.push(full);
  }
  return out;
}

function buildCurrentIndex(files) {
  const nameIndex = new Map(); // normalized name -> [{filePath, raceId}]
  let maxRaceId = 0;
  for (const f of files) {
    const info = extractMonsterInfo(f);
    if (!info.name) continue;
    if (info.raceId !== null && info.raceId < 9000) maxRaceId = Math.max(maxRaceId, info.raceId); // exclude reserved test-range ids (e.g. 9999 stress_test_dummy)
    const key = normalize(info.name);
    if (!nameIndex.has(key)) nameIndex.set(key, []);
    nameIndex.get(key).push({ filePath: f, raceId: info.raceId });
  }
  return { nameIndex, maxRaceId };
}

function resolveCurrent(name74, file74, nameIndex) {
  if (FORCE_NO_MATCH_FILES.has(file74)) return { kind: 'none' };
  const key = normalize(SYNONYMS[normalize(name74)] || name74);
  const candidates = nameIndex.get(key);
  if (!candidates || candidates.length === 0) return { kind: 'none' };
  if (candidates.length === 1) return { kind: 'unique', entry: candidates[0] };
  const withRaceId = candidates.filter((c) => c.raceId !== null);
  if (withRaceId.length === 1) return { kind: 'unique', entry: withRaceId[0] };
  return { kind: 'ambiguous', candidates };
}

function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function main() {
  console.log(DRY_RUN ? 'Running in --dry-run mode (no files will be written/deleted).' : 'Running for real (will back up and modify server/data/monsters/).');

  console.log(`Reading 74 monsters: ${DIR_74}`);
  const files74 = fs.readdirSync(DIR_74).filter((f) => f.endsWith('.xml'));
  console.log(`  ${files74.length} files`);

  console.log(`Scanning current monsters: ${MONSTERS_DIR}`);
  const currentFiles = walk(MONSTERS_DIR);
  console.log(`  ${currentFiles.length} .lua files`);

  const { nameIndex, maxRaceId } = buildCurrentIndex(currentFiles);
  const nextRaceIdStart = Math.max(maxRaceId + 1, 3000);
  console.log(`  max raceId in use (excluding reserved 9000+ range): ${maxRaceId}, new ids start at ${nextRaceIdStart}`);

  const stats = { merged: 0, created: 0, deleted: 0, ambiguous: 0 };
  const ambiguityReport = [];
  const plan = { merges: [], creates: [], keep: new Set() };

  let nextRaceId = nextRaceIdStart;

  for (const file74 of files74) {
    const node = parseMonsterXml(path.join(DIR_74, file74));
    const name74 = attr(node, 'name');
    if (!name74) continue;

    const result = resolveCurrent(name74, file74, nameIndex);
    const translated = translateMonster(node);

    const displayNameOverride = DISPLAY_NAME_OVERRIDES[file74];
    if (displayNameOverride) translated.name = displayNameOverride;

    if (result.kind === 'unique') {
      plan.merges.push({ file74, name74, targetFile: result.entry.filePath, translated });
      plan.keep.add(result.entry.filePath);
      stats.merged++;
    } else if (result.kind === 'ambiguous') {
      stats.ambiguous++;
      ambiguityReport.push({ name74, file74, candidates: result.candidates });
    } else {
      const raceId = nextRaceId++;
      plan.creates.push({ file74, name74, translated, raceId });
      stats.created++;
    }
  }

  // Anything in the current tree not referenced by a merge gets deleted.
  const toDelete = currentFiles.filter((f) => !plan.keep.has(f));
  stats.deleted = toDelete.length;

  console.log('\n-- Migration plan --');
  console.log(stats);
  if (ambiguityReport.length) {
    console.log('ambiguous (skipped, not migrated):');
    for (const a of ambiguityReport) console.log(' -', a.name74, `(${a.file74})`);
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `monsters-migration-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    stats,
    ambiguityReport,
    merges: plan.merges.map((m) => ({ file74: m.file74, name74: m.name74, targetFile: m.targetFile })),
    creates: plan.creates.map((c) => ({ file74: c.file74, name74: c.name74, displayName: c.translated.name, raceId: c.raceId })),
    deleted: toDelete,
  }, null, 2));
  console.log(`\nReport written to ${reportPath}`);

  if (DRY_RUN) {
    console.log('\nDry run complete. No files were modified.');
    return;
  }

  // Backup the entire monsters directory before any destructive change.
  const backupDir = path.join(REPO, 'server/data', `monsters.${timestamp}.bak`);
  console.log(`\nBacking up ${MONSTERS_DIR} -> ${backupDir}`);
  fs.cpSync(MONSTERS_DIR, backupDir, { recursive: true });

  // Apply merges.
  for (const m of plan.merges) {
    const currentText = fs.readFileSync(m.targetFile, 'utf8');
    const merged = mergeMonster(currentText, m.translated);
    fs.writeFileSync(m.targetFile, merged, 'utf8');
  }
  console.log(`Merged ${plan.merges.length} files.`);

  // Apply creates.
  fs.mkdirSync(NEW_MONSTERS_DIR, { recursive: true });
  for (const c of plan.creates) {
    const lua = generateNewMonster(c.translated, c.raceId);
    const outPath = path.join(NEW_MONSTERS_DIR, slugify(c.translated.name) + '.lua');
    fs.writeFileSync(outPath, lua, 'utf8');
  }
  console.log(`Created ${plan.creates.length} new files in ${NEW_MONSTERS_DIR}.`);

  // Delete unreferenced current files.
  for (const f of toDelete) fs.unlinkSync(f);
  console.log(`Deleted ${toDelete.length} files with no 74 correspondent.`);

  // Clean up now-empty directories left behind by deletions.
  removeEmptyDirs(MONSTERS_DIR);

  console.log('\nDone.');
}

function removeEmptyDirs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    removeEmptyDirs(full);
    if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildCurrentIndex, resolveCurrent };
