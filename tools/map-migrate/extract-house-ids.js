#!/usr/bin/env node
/**
 * Extracts the set of houseId values found in OTBM_HOUSETILE nodes inside
 * a .otbm file's tile tree, for cross-checking against the map-house.xml
 * housefile (server/src/house.cpp::loadHousesXML fails the whole load if
 * an XML houseid has no matching HOUSETILE).
 */
'use strict';
const fs = require('fs');
const { NODE_START, NODE_END, ESCAPE } = require('./otbm-header');

const HOUSETILE_TYPE = 14;

function extractHouseTileIds(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 4;
  if (buf[pos] !== NODE_START) throw new Error('Expected NODE_START at offset 4');

  const houseIds = new Set();

  function readNode() {
    if (buf[pos] !== NODE_START) throw new Error(`Expected NODE_START at ${pos}`);
    pos++;
    const type = buf[pos];
    pos++;

    const propBytes = [];
    while (true) {
      const b = buf[pos];
      if (b === NODE_END || b === NODE_START) break;
      if (b === ESCAPE) { pos++; propBytes.push(buf[pos]); pos++; continue; }
      propBytes.push(b); pos++;
    }

    if (type === HOUSETILE_TYPE) {
      // OTBM_Tile_coords: x(u8), y(u8), then houseId(u32) as the first prop bytes.
      const b = Buffer.from(propBytes);
      if (b.length >= 6) {
        const houseId = b.readUInt32LE(2);
        houseIds.add(houseId);
      }
    }

    while (buf[pos] === NODE_START) readNode();

    if (buf[pos] !== NODE_END) throw new Error(`Expected NODE_END at ${pos}`);
    pos++;
  }

  readNode();
  return houseIds;
}

if (require.main === module) {
  const filePath = process.argv[2];
  console.log(`Extracting HOUSETILE house ids from ${filePath} ...`);
  const ids = extractHouseTileIds(filePath);
  console.log('distinct houseIds in HOUSETILE nodes:', ids.size);
  console.log('min:', Math.min(...ids), 'max:', Math.max(...ids));

  const xmlPath = process.argv[3];
  if (xmlPath) {
    const xml = fs.readFileSync(xmlPath, 'latin1');
    const xmlIds = new Set();
    const re = /houseid="(\d+)"/g;
    let m;
    while ((m = re.exec(xml))) xmlIds.add(Number(m[1]));
    console.log('distinct houseIds in xml:', xmlIds.size);

    const xmlMissingFromTiles = [...xmlIds].filter((id) => !ids.has(id));
    console.log('xml houseIds with NO matching HOUSETILE (would break loadHousesXML):', xmlMissingFromTiles.length);
    if (xmlMissingFromTiles.length) console.log(xmlMissingFromTiles.slice(0, 30));
  }
}

module.exports = { extractHouseTileIds };
