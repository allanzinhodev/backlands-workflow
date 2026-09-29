#!/usr/bin/env node
/**
 * Walks the full OTBM node tree (same 0xFE/0xFF/0xFD scheme as items.otb)
 * to confirm structural integrity and collect stats: node counts by type,
 * item ID range used, and how many of those IDs exist in the current
 * items.otb (so the server's item lookup won't silently drop them).
 *
 * This does NOT modify anything -- read-only validation pass.
 *
 * Usage: node validate-tree.js <file.otbm>
 */
'use strict';
const fs = require('fs');
const { NODE_START, NODE_END, ESCAPE } = require('./otbm-header');
const { readOtbServerIds } = require('../items-migrate/read-otb-ids');

const OTBM_NODE_NAMES = {
  1: 'ROOTV1', 2: 'MAP_DATA', 3: 'ITEM_DEF', 4: 'TILE_AREA', 5: 'TILE',
  6: 'ITEM', 12: 'TOWNS', 13: 'TOWN', 14: 'HOUSETILE', 15: 'WAYPOINTS', 16: 'WAYPOINT',
};

function walk(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 4;
  if (buf[pos] !== NODE_START) throw new Error('Expected NODE_START at offset 4');

  const nodeCounts = {};
  let minItemId = Infinity, maxItemId = -Infinity;
  const itemIdCounts = new Map();
  let maxDepth = 0;

  // Iterative stack-based walk (recursion would blow the stack on a 73MB tree).
  function readNode(depth) {
    if (buf[pos] !== NODE_START) throw new Error(`Expected NODE_START at ${pos}, got 0x${buf[pos]?.toString(16)}`);
    pos++;
    const type = buf[pos];
    pos++;
    maxDepth = Math.max(maxDepth, depth);
    nodeCounts[type] = (nodeCounts[type] || 0) + 1;

    // Read this node's own property bytes (de-escaped), stopping at the
    // first unescaped NODE_START (child) or NODE_END (close).
    const propBytes = [];
    while (true) {
      const b = buf[pos];
      if (b === NODE_END || b === NODE_START) break;
      if (b === ESCAPE) { pos++; propBytes.push(buf[pos]); pos++; continue; }
      propBytes.push(b); pos++;
    }

    if (type === 6 /* ITEM */ && propBytes.length >= 2) {
      const id = Buffer.from(propBytes).readUInt16LE(0);
      if (id < minItemId) minItemId = id;
      if (id > maxItemId) maxItemId = id;
      itemIdCounts.set(id, (itemIdCounts.get(id) || 0) + 1);
    }

    // Children
    while (buf[pos] === NODE_START) {
      readNode(depth + 1);
    }

    if (buf[pos] !== NODE_END) throw new Error(`Expected NODE_END at ${pos}, got 0x${buf[pos]?.toString(16)}`);
    pos++;
  }

  readNode(0);

  if (pos !== buf.length) {
    console.warn(`WARNING: ${buf.length - pos} trailing bytes after root node closed (pos=${pos}, length=${buf.length})`);
  }

  return { nodeCounts, minItemId, maxItemId, itemIdCounts, maxDepth, fileSize: buf.length, consumedBytes: pos };
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node validate-tree.js <file.otbm>');
    process.exit(1);
  }

  console.log(`Walking ${filePath} ...`);
  const start = Date.now();
  const result = walk(filePath);
  console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);

  console.log('\nNode counts by type:');
  for (const [type, count] of Object.entries(result.nodeCounts)) {
    console.log(`  ${OTBM_NODE_NAMES[type] || type}: ${count}`);
  }
  console.log('\nmax tree depth:', result.maxDepth);
  console.log('file size:', result.fileSize, 'bytes consumed:', result.consumedBytes);
  console.log('item id range used in tiles:', result.minItemId, '-', result.maxItemId);
  console.log('distinct item ids used:', result.itemIdCounts.size);

  const otbPath = 'D:/backlands/server/data/items/items.otb';
  const otbIds = readOtbServerIds(otbPath);
  let missing = 0;
  const missingIds = new Set();
  for (const id of result.itemIdCounts.keys()) {
    if (!otbIds.has(id)) { missing++; missingIds.add(id); }
  }
  console.log(`\nitem ids used in map but missing from ${otbPath}:`, missing, 'distinct ids');
  if (missing > 0) {
    console.log('sample missing ids:', [...missingIds].slice(0, 30));
  }
}

module.exports = { walk };
