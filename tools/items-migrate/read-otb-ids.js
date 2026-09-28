/**
 * Minimal items.otb reader: returns the set of Server IDs present in the
 * file. Reuses the same binary-tree walk as tools/otb-gen/generate-items-otb.js
 * (0xFE/0xFF/0xFD node framing), trimmed down to just extract Server IDs
 * for validating items.xml against the OTB the C++ server actually loads.
 */
'use strict';
const fs = require('fs');

const NODE_START = 0xFE, NODE_END = 0xFF, ESCAPE = 0xFD;

function readOtbServerIds(otbPath) {
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

  const ids = new Set();
  while (data[pos] === NODE_START) {
    pos++; // NODE_START
    pos++; // group/type byte
    const bytes = [];
    while (true) {
      const b = data[pos];
      if (b === NODE_END) { pos++; break; }
      if (b === ESCAPE) { pos++; bytes.push(data[pos++]); continue; }
      bytes.push(b); pos++;
    }
    const buf = Buffer.from(bytes);
    // flags(4) then TLV attrs; SERVER_ID = 0x10, 2-byte little-endian value.
    let p = 4;
    while (p < buf.length) {
      const attr = buf[p]; p++;
      const len = buf.readUInt16LE(p); p += 2;
      if (attr === 0x10) ids.add(buf.readUInt16LE(p));
      p += len;
    }
  }

  return ids;
}

module.exports = { readOtbServerIds };
