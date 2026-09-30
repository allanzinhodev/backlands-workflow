/**
 * Minimal items.otb reader: Server IDs, Server ID -> Client ID pairs, and
 * per-item group/flags. Reuses the same binary-tree walk as
 * tools/otb-gen/generate-items-otb.js (0xFE/0xFF/0xFD node framing).
 */
'use strict';
const fs = require('fs');

const NODE_START = 0xFE, NODE_END = 0xFF, ESCAPE = 0xFD;

// Item node group byte and the flag bits used by other tools (OtbWriter layout).
const OTB_GROUP_GROUND = 1;
const OTB_FLAG_UNPASSABLE = 1 << 0;
const OTB_FLAG_BLOCK_PATHFINDER = 1 << 2;

function readOtbServerIds(otbPath) {
  return new Set(readOtbItems(otbPath).keys());
}

// Server ID -> Client ID for every item node (SERVER_ID = 0x10, CLIENT_ID = 0x11).
function readOtbIdPairs(otbPath) {
  const pairs = new Map();
  for (const [serverId, item] of readOtbItems(otbPath)) pairs.set(serverId, item.clientId);
  return pairs;
}

// Server ID -> { clientId, group, flags } for every item node.
function readOtbItems(otbPath) {
  const data = fs.readFileSync(otbPath);
  let pos = 4; // skip header uint32

  function expect(b) {
    if (data[pos] !== b) throw new Error(`Malformed OTB: expected 0x${b.toString(16)} at ${pos}`);
    pos++;
  }

  expect(NODE_START);
  pos++; // root node type
  // Skip root's own byte content (stops at first unescaped NODE_START/NODE_END).
  while (true) {
    const b = data[pos];
    if (b === NODE_END || b === NODE_START) break;
    if (b === ESCAPE) { pos += 2; continue; }
    pos++;
  }

  const items = new Map();
  while (data[pos] === NODE_START) {
    pos++; // NODE_START
    const group = data[pos++];
    const bytes = [];
    while (true) {
      const b = data[pos];
      if (b === NODE_END) { pos++; break; }
      if (b === ESCAPE) { pos++; bytes.push(data[pos++]); continue; }
      bytes.push(b); pos++;
    }
    const buf = Buffer.from(bytes);
    // flags(4) then TLV attrs, 2-byte little-endian ids.
    const flags = buf.readUInt32LE(0);
    let p = 4;
    let serverId = null;
    let clientId = null;
    while (p < buf.length) {
      const attr = buf[p]; p++;
      const len = buf.readUInt16LE(p); p += 2;
      if (attr === 0x10) serverId = buf.readUInt16LE(p);
      if (attr === 0x11) clientId = buf.readUInt16LE(p);
      p += len;
    }
    if (serverId !== null) items.set(serverId, { clientId, group, flags });
  }

  return items;
}

module.exports = {
  readOtbServerIds,
  readOtbIdPairs,
  readOtbItems,
  OTB_GROUP_GROUND,
  OTB_FLAG_UNPASSABLE,
  OTB_FLAG_BLOCK_PATHFINDER,
};
