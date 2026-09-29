#!/usr/bin/env node
/**
 * Rewrites every item id in an .otbm through a Server ID -> Client ID table
 * taken from a reference items.otb (default: 74/items/items.otb).
 *
 * The server indexes items by Client ID (server/src/items.cpp ignores the
 * .otb Server ID), so a map saved with 7.4 Server IDs has to be converted.
 *
 * Usage: node remap-item-ids.js <in.otbm> <out.otbm> [reference.otb]
 * Docs: README.md nesta pasta.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { readOtbIdPairs } = require('../items-migrate/read-otb-ids');

const NODE_START = 0xFE, NODE_END = 0xFF, ESCAPE = 0xFD;
const OTBM_TILE = 5, OTBM_ITEM = 6, OTBM_HOUSETILE = 14;
const OTBM_ATTR_TILE_FLAGS = 3, OTBM_ATTR_ITEM = 9;

const [inFile, outFile, refArg] = process.argv.slice(2);
if (!inFile || !outFile) {
  console.error('Usage: node remap-item-ids.js <in.otbm> <out.otbm> [reference.otb]');
  process.exit(1);
}
const refOtb = path.resolve(refArg || path.join(__dirname, '../../74/items/items.otb'));

const sidToCid = readOtbIdPairs(refOtb);
const raw = fs.readFileSync(inFile);
const stats = { itemNodes: 0, inlineItems: 0, unmapped: new Map() };

function remap(id) {
  const cid = sidToCid.get(id);
  if (cid === undefined || cid === null) {
    stats.unmapped.set(id, (stats.unmapped.get(id) || 0) + 1);
    return id;
  }
  return cid;
}

// Tile attributes: TILE_FLAGS (u32) and ITEM (u16 id, the tile's ground/first item).
function remapTileAttrs(data, start) {
  let p = start;
  while (p < data.length) {
    const attr = data[p++];
    if (attr === OTBM_ATTR_TILE_FLAGS) {
      p += 4;
    } else if (attr === OTBM_ATTR_ITEM) {
      data.writeUInt16LE(remap(data.readUInt16LE(p)), p);
      stats.inlineItems++;
      p += 2;
    } else {
      throw new Error(`unknown tile attribute ${attr} at node data offset ${p - 1}`);
    }
  }
}

function transform(type, data) {
  if (type === OTBM_ITEM) {
    data.writeUInt16LE(remap(data.readUInt16LE(0)), 0);
    stats.itemNodes++;
  } else if (type === OTBM_TILE) {
    remapTileAttrs(data, 2); // x, y offsets
  } else if (type === OTBM_HOUSETILE) {
    remapTileAttrs(data, 6); // x, y offsets + u32 house id
  }
}

// Output buffer, grown on demand (escaping only ever adds bytes).
let out = Buffer.allocUnsafe(raw.length + (raw.length >> 4));
let o = 0;
function put(b) {
  if (o >= out.length) {
    const bigger = Buffer.allocUnsafe(out.length * 2);
    out.copy(bigger, 0, 0, o);
    out = bigger;
  }
  out[o++] = b;
}
function putEscaped(buf) {
  for (const b of buf) {
    if (b === NODE_START || b === NODE_END || b === ESCAPE) put(ESCAPE);
    put(b);
  }
}

let i = 4;
raw.copy(out, 0, 0, 4); // identifier
o = 4;

function processNode() {
  if (raw[i] !== NODE_START) throw new Error(`expected node start at ${i}`);
  i++;
  let type = raw[i++];
  if (type === ESCAPE) type = raw[i++];

  const bytes = [];
  while (raw[i] !== NODE_START && raw[i] !== NODE_END) {
    if (raw[i] === ESCAPE) i++;
    bytes.push(raw[i++]);
  }
  const data = Buffer.from(bytes);
  transform(type, data);

  put(NODE_START);
  putEscaped(Buffer.from([type]));
  putEscaped(data);

  while (raw[i] === NODE_START) processNode();
  if (raw[i] !== NODE_END) throw new Error(`expected node end at ${i}`);
  i++;
  put(NODE_END);
}

processNode();
if (i !== raw.length) throw new Error(`trailing bytes: stopped at ${i} of ${raw.length}`);

fs.writeFileSync(outFile, out.subarray(0, o));
console.log(`item nodes: ${stats.itemNodes}, tile inline items: ${stats.inlineItems}`);
console.log(`ids without a Client ID in ${refOtb}: ${stats.unmapped.size} distinct`);
for (const [id, n] of stats.unmapped) console.log(`  ${id}: ${n}x (kept as is)`);
console.log(`wrote ${outFile} (${o} bytes)`);
