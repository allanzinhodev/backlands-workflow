/**
 * Reads/writes just the OTBM root header, handling the 0xFD escape byte
 * that can appear inside the raw header bytes (width/height/version
 * numbers can coincidentally contain 0xFE/0xFF/0xFD byte values, which
 * the OTB node-tree format escapes with a leading 0xFD -- same scheme as
 * items.otb, see tools/otb-gen/generate-items-otb.js).
 */
'use strict';
const fs = require('fs');

const NODE_START = 0xFE, NODE_END = 0xFF, ESCAPE = 0xFD;

// Reads `count` de-escaped bytes starting at buf[pos], returns { bytes, nextPos }.
function readEscaped(buf, pos, count) {
  const out = Buffer.alloc(count);
  let i = 0;
  while (i < count) {
    const b = buf[pos];
    if (b === ESCAPE) {
      pos++;
      out[i++] = buf[pos];
      pos++;
    } else {
      out[i++] = b;
      pos++;
    }
  }
  return { bytes: out, nextPos: pos };
}

// Reads the OTBM root header: 4-byte file identifier, NODE_START, root
// type byte, then the de-escaped OTBM_root_header struct (version u32,
// width u16, height u16, majorVersionItems u32, minorVersionItems u32).
function readOtbmHeader(filePath) {
  const fd = fs.openSync(filePath, 'r');
  // Header fields need at most 4+1+1+16=22 raw bytes, but escapes can push
  // that further; read a generous chunk (64 bytes) to be safe.
  const raw = Buffer.alloc(64);
  fs.readSync(fd, raw, 0, 64, 0);
  fs.closeSync(fd);

  if (raw[4] !== NODE_START) throw new Error(`Expected NODE_START at offset 4, got 0x${raw[4].toString(16)}`);
  const rootType = raw[5];
  let pos = 6;

  const { bytes: headerBytes, nextPos } = readEscaped(raw, pos, 16);
  const version = headerBytes.readUInt32LE(0);
  const width = headerBytes.readUInt16LE(4);
  const height = headerBytes.readUInt16LE(6);
  const majorVersionItems = headerBytes.readUInt32LE(8);
  const minorVersionItems = headerBytes.readUInt32LE(12);

  return { rootType, version, width, height, majorVersionItems, minorVersionItems, rawHeaderEnd: nextPos };
}

// Escapes a buffer (prefixes 0xFD before any 0xFE/0xFF/0xFD byte), same
// rule as OtbWriter.writeByte in tools/otb-gen.
function escapeBytes(buf) {
  const out = [];
  for (const b of buf) {
    if (b === NODE_START || b === NODE_END || b === ESCAPE) out.push(ESCAPE);
    out.push(b);
  }
  return Buffer.from(out);
}

module.exports = { readOtbmHeader, readEscaped, escapeBytes, NODE_START, NODE_END, ESCAPE };
