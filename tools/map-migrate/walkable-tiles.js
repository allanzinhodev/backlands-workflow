/**
 * Reads an .otbm and answers "can a monster be spawned on this tile?", the
 * same conditions that make the server log "Couldn't spawn monster":
 *   - the tile exists and has a ground item;
 *   - no item on it is unpassable or blocks the pathfinder (items.otb flags);
 *   - no item changes floor (items.xml "floorchange");
 *   - it is neither a protection zone nor a house tile.
 * Item ids are read as-is, so the map and items.otb/items.xml must speak the
 * same numbering (Client IDs for server/data/world/world.otbm).
 *
 * The result is a bitset over the map's bounding box (two passes over the
 * file: bounds first, then tiles), so millions of tiles stay cheap.
 */
'use strict';
const fs = require('fs');
const {
  readOtbItems,
  OTB_GROUP_GROUND,
  OTB_FLAG_UNPASSABLE,
  OTB_FLAG_BLOCK_PATHFINDER,
} = require('../items-migrate/read-otb-ids');

const NODE_START = 0xFE, NODE_END = 0xFF, ESCAPE = 0xFD;
const OTBM_TILE_AREA = 4, OTBM_TILE = 5, OTBM_ITEM = 6;
const OTBM_ATTR_TILE_FLAGS = 3, OTBM_ATTR_ITEM = 9;
const TILESTATE_PROTECTIONZONE = 1;

function readFloorChangeIds(itemsXmlPath) {
  const text = fs.readFileSync(itemsXmlPath, 'latin1');
  const ids = new Set();
  const itemRe = /<item\s+(?:id="(\d+)"|fromid="(\d+)"\s+toid="(\d+)")[^>]*?(?:\/>|>([\s\S]*?)<\/item>)/g;
  let m;
  while ((m = itemRe.exec(text))) {
    if (!m[4] || !/key="floorchange"/i.test(m[4])) continue;
    const from = Number(m[1] || m[2]);
    const to = Number(m[1] || m[3]);
    for (let id = from; id <= to; id++) ids.add(id);
  }
  return ids;
}

// Walks every node, calling onNode(type, data, children) bottom-up; children
// are returned so a tile sees its item nodes.
function walkOtbm(raw, onNode) {
  let i = 4; // identifier
  function readNode() {
    i++; // NODE_START
    let type = raw[i++];
    if (type === ESCAPE) type = raw[i++];
    const bytes = [];
    while (raw[i] !== NODE_START && raw[i] !== NODE_END) {
      if (raw[i] === ESCAPE) i++;
      bytes.push(raw[i++]);
    }
    const node = { type, data: Buffer.from(bytes), children: [] };
    onNode.enter && onNode.enter(node);
    while (raw[i] === NODE_START) node.children.push(readNode());
    i++; // NODE_END
    onNode.leave(node);
    // Only item nodes are needed by the parent tile; drop everything else.
    return node.type === OTBM_ITEM ? node : { type: node.type };
  }
  readNode();
}

function buildWalkableTiles(otbmPath, otbPath, itemsXmlPath) {
  const raw = fs.readFileSync(otbmPath);
  const items = readOtbItems(otbPath);
  const floorChange = readFloorChangeIds(itemsXmlPath);

  const blocks = (id) => {
    const item = items.get(id);
    if (!item) return true;
    return (item.flags & (OTB_FLAG_UNPASSABLE | OTB_FLAG_BLOCK_PATHFINDER)) !== 0 || floorChange.has(id);
  };
  const isGround = (id) => {
    const item = items.get(id);
    return item !== undefined && item.group === OTB_GROUP_GROUND;
  };

  // Pass 1: bounding box of all tile areas.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  walkOtbm(raw, {
    leave(node) {
      if (node.type !== OTBM_TILE_AREA) return;
      const x = node.data.readUInt16LE(0), y = node.data.readUInt16LE(2);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 255); maxY = Math.max(maxY, y + 255);
    },
  });

  const width = maxX - minX + 1, height = maxY - minY + 1, floors = 16;
  const bits = new Uint32Array(Math.ceil((width * height * floors) / 32));
  const indexOf = (x, y, z) => ((z * height + (y - minY)) * width) + (x - minX);

  // Pass 2: tiles. Tile coordinates are relative to the enclosing area.
  let area = null;
  let walkable = 0;
  walkOtbm(raw, {
    enter(node) {
      if (node.type === OTBM_TILE_AREA) {
        area = { x: node.data.readUInt16LE(0), y: node.data.readUInt16LE(2), z: node.data[4] };
      }
    },
    leave(node) {
      if (node.type !== OTBM_TILE) return; // house tiles (OTBM_HOUSETILE) never host a spawn
      const d = node.data;
      const x = area.x + d[0], y = area.y + d[1], z = area.z;
      const ids = [];
      let tileFlags = 0;
      let p = 2;
      while (p < d.length) {
        const attr = d[p++];
        if (attr === OTBM_ATTR_TILE_FLAGS) { tileFlags = d.readUInt32LE(p); p += 4; }
        else if (attr === OTBM_ATTR_ITEM) { ids.push(d.readUInt16LE(p)); p += 2; }
        else break;
      }
      for (const child of node.children) {
        if (child.type === OTBM_ITEM) ids.push(child.data.readUInt16LE(0));
      }
      if (tileFlags & TILESTATE_PROTECTIONZONE) return;
      if (!ids.some(isGround) || ids.some(blocks)) return;
      const index = indexOf(x, y, z);
      bits[index >>> 5] |= 1 << (index & 31);
      walkable++;
    },
  });

  return {
    walkableCount: walkable,
    isWalkable(x, y, z) {
      if (x < minX || x > maxX || y < minY || y > maxY || z < 0 || z >= floors) return false;
      const index = indexOf(x, y, z);
      return (bits[index >>> 5] & (1 << (index & 31))) !== 0;
    },
  };
}

module.exports = { buildWalkableTiles };
