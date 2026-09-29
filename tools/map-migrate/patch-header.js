#!/usr/bin/env node
/**
 * Patches only the OTBM_root_header (majorVersionItems/minorVersionItems)
 * of a .otbm file, leaving the rest of the file byte-for-byte untouched.
 *
 * Why this is enough for the 7.4 -> current map migration: client IDs in
 * the 7.4 map.otbm already match 1:1 (by sprite hash, verified separately)
 * with the client IDs the current client/items.otb use -- confirmed by
 * cross-checking 74/items/items.otb against server/data/items/items.otb
 * by sprite hash (4943/4984 = 99.2% exact match, the rest are consecutive
 * terrain-border animation-frame-order quirks, not real item mismatches).
 * So no item ID remapping is needed in the tile tree -- only the two
 * version fields the C++ loader checks (server/src/iomap.cpp:265-280)
 * need to satisfy the floors: majorVersionItems>=3, minorVersionItems>=8
 * (CLIENT_VERSION_810). We use exactly the values already used by
 * server/data/items/items.otb (major=3, minor=20) for consistency with
 * every other migration this session.
 *
 * Usage: node patch-header.js <input.otbm> <output.otbm> [--dry-run]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { readOtbmHeader, escapeBytes } = require('./otbm-header');

const NEW_MAJOR_VERSION_ITEMS = 3;
const NEW_MINOR_VERSION_ITEMS = 20;

function patchHeader(inputPath, outputPath, dryRun) {
  const header = readOtbmHeader(inputPath);
  console.log('Source header:', header);

  const buf = fs.readFileSync(inputPath);

  // Rebuild the header bytes (version, width, height, majorVersionItems,
  // minorVersionItems), then re-escape and splice them in place of the
  // original (possibly differently-escaped) header region.
  const newHeaderRaw = Buffer.alloc(16);
  newHeaderRaw.writeUInt32LE(header.version, 0);
  newHeaderRaw.writeUInt16LE(header.width, 4);
  newHeaderRaw.writeUInt16LE(header.height, 6);
  newHeaderRaw.writeUInt32LE(NEW_MAJOR_VERSION_ITEMS, 8);
  newHeaderRaw.writeUInt32LE(NEW_MINOR_VERSION_ITEMS, 12);

  const newHeaderEscaped = escapeBytes(newHeaderRaw);

  // buf layout: [0..4) file identifier, [4] NODE_START, [5] rootType,
  // [6..header.rawHeaderEnd) old escaped header bytes, then the rest.
  const before = buf.subarray(0, 6);
  const after = buf.subarray(header.rawHeaderEnd);
  const result = Buffer.concat([before, newHeaderEscaped, after]);

  console.log(`Original size: ${buf.length}, new size: ${result.length} (delta ${result.length - buf.length})`);
  console.log(`majorVersionItems: ${header.majorVersionItems} -> ${NEW_MAJOR_VERSION_ITEMS}`);
  console.log(`minorVersionItems: ${header.minorVersionItems} -> ${NEW_MINOR_VERSION_ITEMS}`);

  if (dryRun) {
    console.log('Dry run: not writing output file.');
    return;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result);
  console.log(`Wrote ${outputPath}`);

  // Verify: re-read the header from the written file and confirm the
  // patched values stick, and that width/height/version (untouched)
  // survived byte-identical.
  const verify = readOtbmHeader(outputPath);
  console.log('Verification read-back:', verify);
  if (verify.majorVersionItems !== NEW_MAJOR_VERSION_ITEMS || verify.minorVersionItems !== NEW_MINOR_VERSION_ITEMS) {
    throw new Error('Verification failed: patched header does not read back correctly.');
  }
  if (verify.version !== header.version || verify.width !== header.width || verify.height !== header.height) {
    throw new Error('Verification failed: untouched header fields changed.');
  }
  console.log('Verification OK.');
}

if (require.main === module) {
  const [, , inputPath, outputPath, flag] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node patch-header.js <input.otbm> <output.otbm> [--dry-run]');
    process.exit(1);
  }
  patchHeader(inputPath, outputPath, flag === '--dry-run');
}

module.exports = { patchHeader };
