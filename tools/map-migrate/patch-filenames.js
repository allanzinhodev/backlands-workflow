#!/usr/bin/env node
/**
 * Patches the EXT_SPAWN_FILE / EXT_HOUSE_FILE string attributes stored
 * inside the OTBM_MAP_DATA node's own property bytes (right after the
 * root header, before the first TILE_AREA child). The server honors
 * whatever filename is embedded in the .otbm binary
 * (server/src/iomap.cpp::parseMapDataAttributes), not a filename
 * convention -- confirmed the hard way: after only patching the version
 * header, the server tried to load "data/world/map-house.xml" and
 * "data/world/map-spawn.xml" (the original 7.4 filenames) and failed
 * with "File was not found", even though world-house.xml/world-spawn.xml
 * existed right next to it.
 *
 * This only rewrites those two TLV-encoded strings (attr byte + uint16
 * length + bytes); everything else in the MAP_DATA node and the rest of
 * the file is left untouched. Since the new filenames are a different
 * length than the originals, the file size changes -- unlike
 * patch-header.js's in-place numeric patch.
 *
 * Usage: node patch-filenames.js <input.otbm> <output.otbm> [--dry-run]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { NODE_START, NODE_END, ESCAPE } = require('./otbm-header');

const OTBM_ATTR_EXT_SPAWN_FILE = 0x0b;
const OTBM_ATTR_EXT_HOUSE_FILE = 0x0d;
const OTBM_ATTR_DESCRIPTION = 0x01;

const NEW_SPAWN_FILE = 'world-spawn.xml';
const NEW_HOUSE_FILE = 'world-house.xml';

// Reads a de-escaped byte at buf[pos], returning { value, nextPos }.
function readByte(buf, pos) {
  if (buf[pos] === ESCAPE) return { value: buf[pos + 1], nextPos: pos + 2 };
  return { value: buf[pos], nextPos: pos + 1 };
}

function readBytes(buf, pos, count) {
  const out = Buffer.alloc(count);
  for (let i = 0; i < count; i++) {
    const { value, nextPos } = readByte(buf, pos);
    out[i] = value;
    pos = nextPos;
  }
  return { bytes: out, nextPos: pos };
}

function escapeBytes(buf) {
  const out = [];
  for (const b of buf) {
    if (b === NODE_START || b === NODE_END || b === ESCAPE) out.push(ESCAPE);
    out.push(b);
  }
  return Buffer.from(out);
}

function patchFilenames(inputPath, outputPath, dryRun) {
  const buf = fs.readFileSync(inputPath);

  // Walk: [0..4) identifier, [4]=NODE_START (root), [5]=root type,
  // then root's own de-escaped 16-byte header, then root's first child:
  // NODE_START, type=MAP_DATA(2), then MAP_DATA's own TLV attributes
  // until we hit an unescaped NODE_START (first TILE_AREA child) or
  // NODE_END.
  let pos = 6;
  // skip root header (16 raw bytes, de-escaped)
  ({ nextPos: pos } = readBytes(buf, pos, 16));

  if (buf[pos] !== NODE_START) throw new Error(`Expected MAP_DATA NODE_START at ${pos}`);
  const mapDataNodeStart = pos;
  pos++;
  const mapDataType = buf[pos]; pos++;
  if (mapDataType !== 2) throw new Error(`Expected MAP_DATA type=2, got ${mapDataType}`);

  const mapDataPropsStart = pos;
  const segments = []; // { type: 'raw'|'spawn'|'house', start, end (of this TLV entry) }

  while (true) {
    const b = buf[pos];
    if (b === NODE_END || b === NODE_START) break; // end of MAP_DATA's own props
    const tlvStart = pos;
    const { value: attr, nextPos: afterAttr } = readByte(buf, pos);
    pos = afterAttr;

    if (attr === OTBM_ATTR_DESCRIPTION || attr === OTBM_ATTR_EXT_SPAWN_FILE || attr === OTBM_ATTR_EXT_HOUSE_FILE) {
      const { bytes: lenBytes, nextPos: afterLen } = readBytes(buf, pos, 2);
      const len = lenBytes.readUInt16LE(0);
      pos = afterLen;
      const { nextPos: afterStr } = readBytes(buf, pos, len);
      pos = afterStr;

      if (attr === OTBM_ATTR_EXT_SPAWN_FILE) segments.push({ type: 'spawn', start: tlvStart, end: pos });
      else if (attr === OTBM_ATTR_EXT_HOUSE_FILE) segments.push({ type: 'house', start: tlvStart, end: pos });
      // DESCRIPTION: leave as raw, no action needed, just consumed above
    } else {
      throw new Error(`Unexpected attribute 0x${attr.toString(16)} in MAP_DATA props at ${tlvStart} -- refusing to guess its length, extend this script`);
    }
  }

  const mapDataPropsEnd = pos;
  console.log('Found in MAP_DATA props:', segments.map((s) => s.type));
  if (segments.length !== 2 || !segments.some((s) => s.type === 'spawn') || !segments.some((s) => s.type === 'house')) {
    throw new Error('Expected exactly one spawn and one house filename attribute; got: ' + JSON.stringify(segments));
  }

  function buildTlv(attr, filename) {
    const strBytes = Buffer.from(filename, 'latin1');
    const raw = Buffer.concat([Buffer.from([attr]), Buffer.alloc(2), strBytes]);
    raw.writeUInt16LE(strBytes.length, 1);
    return escapeBytes(raw);
  }

  // Rebuild MAP_DATA's own prop bytes: keep everything as-is except
  // splice in the new spawn/house TLVs at their original positions.
  const spawnSeg = segments.find((s) => s.type === 'spawn');
  const houseSeg = segments.find((s) => s.type === 'house');
  const newSpawnTlv = buildTlv(OTBM_ATTR_EXT_SPAWN_FILE, NEW_SPAWN_FILE);
  const newHouseTlv = buildTlv(OTBM_ATTR_EXT_HOUSE_FILE, NEW_HOUSE_FILE);

  // Segments may appear in either order in the file; splice in file order.
  const ordered = [spawnSeg, houseSeg].sort((a, b) => a.start - b.start);
  const newTlvByType = { spawn: newSpawnTlv, house: newHouseTlv };

  let rebuilt = buf.subarray(mapDataPropsStart, ordered[0].start);
  rebuilt = Buffer.concat([rebuilt, newTlvByType[ordered[0].type]]);
  rebuilt = Buffer.concat([rebuilt, buf.subarray(ordered[0].end, ordered[1].start)]);
  rebuilt = Buffer.concat([rebuilt, newTlvByType[ordered[1].type]]);
  rebuilt = Buffer.concat([rebuilt, buf.subarray(ordered[1].end, mapDataPropsEnd)]);

  const result = Buffer.concat([
    buf.subarray(0, mapDataPropsStart),
    rebuilt,
    buf.subarray(mapDataPropsEnd),
  ]);

  console.log(`Original size: ${buf.length}, new size: ${result.length} (delta ${result.length - buf.length})`);
  console.log(`spawn file -> "${NEW_SPAWN_FILE}", house file -> "${NEW_HOUSE_FILE}"`);

  if (dryRun) {
    console.log('Dry run: not writing output file.');
    return;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result);
  console.log(`Wrote ${outputPath}`);
}

if (require.main === module) {
  const [, , inputPath, outputPath, flag] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node patch-filenames.js <input.otbm> <output.otbm> [--dry-run]');
    process.exit(1);
  }
  patchFilenames(inputPath, outputPath, flag === '--dry-run');
}

module.exports = { patchFilenames };
