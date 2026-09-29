#!/usr/bin/env node
/**
 * Migrates the 7.4 reference map (74/world/map.otbm + map-spawn.xml +
 * map-house.xml) into the current server's data/world/, replacing the
 * customized 2048x2048 world entirely with the classic 7.4 continent.
 *
 * Confirmed separately (see README.md) before writing this orchestrator:
 * - map.otbm's item IDs already match the current items.otb 1:1 (0 missing
 *   ids across the whole tile tree) -- only the header's
 *   majorVersionItems/minorVersionItems need patching, see patch-header.js.
 * - map-house.xml's 862 houseId all have a matching HOUSETILE node in
 *   map.otbm -- can be copied unchanged (same schema as world-house.xml).
 * - map-spawn.xml needs conversion (see convert-spawn.js).
 *
 * Usage: node migrate-map.js [--dry-run]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { patchHeader } = require('./patch-header');
const { patchFilenames } = require('./patch-filenames');
const { walk: validateTree } = require('./validate-tree');
const { convert: convertSpawn } = require('./convert-spawn');

const REPO = 'D:/backlands';
const SRC_OTBM = path.join(REPO, '74/world/map.otbm');
const SRC_SPAWN = path.join(REPO, '74/world/map-spawn.xml');
const SRC_HOUSE = path.join(REPO, '74/world/map-house.xml');

const WORLD_DIR = path.join(REPO, 'server/data/world');
const DST_OTBM = path.join(WORLD_DIR, 'world.otbm');
const DST_SPAWN = path.join(WORLD_DIR, 'world-spawn.xml');
const DST_HOUSE = path.join(WORLD_DIR, 'world-house.xml');

const DRY_RUN = process.argv.includes('--dry-run');

function main() {
  console.log(DRY_RUN ? 'Running in --dry-run mode (no files will be written).' : 'Running for real (will back up and overwrite server/data/world/).');

  let backupDir = null;
  if (!DRY_RUN) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupDir = path.join(REPO, 'server/data', `world.${timestamp}.bak`);
    console.log(`\nBacking up ${WORLD_DIR} -> ${backupDir}`);
    fs.cpSync(WORLD_DIR, backupDir, { recursive: true });
  }

  const tmpOtbm = path.join(require('os').tmpdir(), 'map-migrate-step1-header.otbm');
  const otbmOut = DRY_RUN ? path.join(require('os').tmpdir(), 'map-migrate-dryrun.otbm') : DST_OTBM;

  console.log('\n== Step 1: patch OTBM header (version numbers) ==');
  patchHeader(SRC_OTBM, tmpOtbm, false);

  console.log('\n== Step 2: patch OTBM spawn/house filenames ==');
  // The server honors whatever filename is embedded in the .otbm binary
  // (EXT_SPAWN_FILE/EXT_HOUSE_FILE), not a naming convention -- confirmed
  // by actually running the server against a header-only-patched map: it
  // tried to load "map-house.xml"/"map-spawn.xml" (the 7.4 originals)
  // and failed with "File was not found".
  patchFilenames(tmpOtbm, otbmOut, false);
  fs.rmSync(tmpOtbm, { force: true });

  console.log('\n== Step 3: validate patched tree ==');
  const stats = validateTree(otbmOut);
  console.log(`  ${stats.consumedBytes} bytes consumed of ${stats.fileSize} (${stats.consumedBytes === stats.fileSize ? 'OK, no trailing bytes' : 'MISMATCH'})`);
  console.log(`  item id range: ${stats.minItemId}-${stats.maxItemId}, ${stats.itemIdCounts.size} distinct ids`);
  if (stats.consumedBytes !== stats.fileSize) {
    throw new Error('Patched OTBM tree validation failed: trailing/mismatched bytes.');
  }

  console.log('\n== Step 4: convert spawn file ==');
  const spawnOut = DRY_RUN ? path.join(require('os').tmpdir(), 'map-migrate-dryrun-spawn.xml') : DST_SPAWN;
  convertSpawn(SRC_SPAWN, spawnOut, false);

  console.log('\n== Step 5: copy house file (schema already identical) ==');
  if (DRY_RUN) {
    console.log('  Dry run: would copy', SRC_HOUSE, '->', DST_HOUSE);
  } else {
    fs.copyFileSync(SRC_HOUSE, DST_HOUSE);
    console.log('  Copied', SRC_HOUSE, '->', DST_HOUSE);
  }

  if (DRY_RUN) {
    fs.rmSync(otbmOut, { force: true });
    fs.rmSync(spawnOut, { force: true });
    console.log('\nDry run complete. No files under server/data/world/ were modified.');
    return;
  }

  console.log(`\nDone. Backup of the previous world/ is at ${backupDir}.`);
}

main();
