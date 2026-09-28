#!/usr/bin/env node
/**
 * Generates items.otb from Tibia.dat + Tibia.spr, mirroring ObjectBuilder's
 * MetadataReader5 (client 8.60-9.86), SpriteStorage.getSpriteHash and OtbWriter.
 *
 * Usage: node generate-items-otb.js [datDir] [outFile]
 * Docs: README.md nesta pasta.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const datDir = path.resolve(process.argv[2] || 'D:/backlands/client/data/things');
const outFile = path.resolve(process.argv[3] || 'D:/backlands/server/data/items/items.otb');

const DAT_PATH = path.join(datDir, 'Tibia.dat');
const SPR_PATH = path.join(datDir, 'Tibia.spr');

// ---------------------------------------------------------------------------
// Binary reader helper (little-endian)
// ---------------------------------------------------------------------------
class Reader {
  constructor(buf) { this.buf = buf; this.pos = 0; }
  u8() { return this.buf[this.pos++]; }
  u16() { const v = this.buf.readUInt16LE(this.pos); this.pos += 2; return v; }
  i16() { const v = this.buf.readInt16LE(this.pos); this.pos += 2; return v; }
  u32() { const v = this.buf.readUInt32LE(this.pos); this.pos += 4; return v; }
  i32() { const v = this.buf.readInt32LE(this.pos); this.pos += 4; return v; }
  bytes(n) { const v = this.buf.subarray(this.pos, this.pos + n); this.pos += n; return v; }
  str(n) { return this.bytes(n).toString('latin1'); }
}

// ---------------------------------------------------------------------------
// MetadataFlags5 (client versions 8.60 - 9.86)
// ---------------------------------------------------------------------------
const F5 = {
  GROUND: 0x00, GROUND_BORDER: 0x01, ON_BOTTOM: 0x02, ON_TOP: 0x03,
  CONTAINER: 0x04, STACKABLE: 0x05, FORCE_USE: 0x06, MULTI_USE: 0x07,
  WRITABLE: 0x08, WRITABLE_ONCE: 0x09, FLUID_CONTAINER: 0x0A, FLUID: 0x0B,
  UNPASSABLE: 0x0C, UNMOVEABLE: 0x0D, BLOCK_MISSILE: 0x0E, BLOCK_PATHFIND: 0x0F,
  PICKUPABLE: 0x10, HANGABLE: 0x11, VERTICAL: 0x12, HORIZONTAL: 0x13,
  ROTATABLE: 0x14, HAS_LIGHT: 0x15, DONT_HIDE: 0x16, TRANSLUCENT: 0x17,
  HAS_OFFSET: 0x18, HAS_ELEVATION: 0x19, LYING_OBJECT: 0x1A, ANIMATE_ALWAYS: 0x1B,
  MINI_MAP: 0x1C, LENS_HELP: 0x1D, FULL_GROUND: 0x1E, IGNORE_LOOK: 0x1F,
  CLOTH: 0x20, MARKET_ITEM: 0x21, HAS_BONES: 0x27, LAST_FLAG: 0xFF,
};

const CATEGORY = { ITEM: 'item', OUTFIT: 'outfit', EFFECT: 'effect', MISSILE: 'missile' };
const MIN_ITEM_ID = 100;

// ---------------------------------------------------------------------------
// .dat parsing (MetadataReader5 + base MetadataReader.readTexturePatterns)
// ---------------------------------------------------------------------------
function readThingProperties(r, thing) {
  let flag = 0;
  while (flag < F5.LAST_FLAG) {
    flag = r.u8();
    if (flag === F5.LAST_FLAG) return true;

    switch (flag) {
      case F5.GROUND: thing.isGround = true; thing.groundSpeed = r.u16(); break;
      case F5.GROUND_BORDER: thing.isGroundBorder = true; break;
      case F5.ON_BOTTOM: thing.isOnBottom = true; break;
      case F5.ON_TOP: thing.isOnTop = true; break;
      case F5.CONTAINER: thing.isContainer = true; break;
      case F5.STACKABLE: thing.stackable = true; break;
      case F5.FORCE_USE: thing.forceUse = true; break;
      case F5.MULTI_USE: thing.multiUse = true; break;
      case F5.WRITABLE: thing.writable = true; thing.maxReadWriteChars = r.u16(); break;
      case F5.WRITABLE_ONCE: thing.writableOnce = true; thing.maxReadChars = r.u16(); break;
      case F5.FLUID_CONTAINER: thing.isFluidContainer = true; break;
      case F5.FLUID: thing.isFluid = true; break;
      case F5.UNPASSABLE: thing.isUnpassable = true; break;
      case F5.UNMOVEABLE: thing.isUnmoveable = true; break;
      case F5.BLOCK_MISSILE: thing.blockMissile = true; break;
      case F5.BLOCK_PATHFIND: thing.blockPathfind = true; break;
      case F5.PICKUPABLE: thing.pickupable = true; break;
      case F5.HANGABLE: thing.hangable = true; break;
      case F5.VERTICAL: thing.isVertical = true; break;
      case F5.HORIZONTAL: thing.isHorizontal = true; break;
      case F5.ROTATABLE: thing.rotatable = true; break;
      case F5.HAS_LIGHT: thing.hasLight = true; thing.lightLevel = r.u16(); thing.lightColor = r.u16(); break;
      case F5.DONT_HIDE: thing.dontHide = true; break;
      case F5.TRANSLUCENT: thing.isTranslucent = true; break;
      case F5.HAS_OFFSET: thing.hasOffset = true; thing.offsetX = r.i16(); thing.offsetY = r.i16(); break;
      case F5.HAS_ELEVATION: thing.hasElevation = true; thing.elevation = r.u16(); break;
      case F5.LYING_OBJECT: thing.isLyingObject = true; break;
      case F5.ANIMATE_ALWAYS: thing.animateAlways = true; break;
      case F5.MINI_MAP: thing.miniMap = true; thing.miniMapColor = r.u16(); break;
      case F5.LENS_HELP: thing.isLensHelp = true; thing.lensHelp = r.u16(); break;
      case F5.FULL_GROUND: thing.isFullGround = true; break;
      case F5.IGNORE_LOOK: thing.ignoreLook = true; break;
      case F5.CLOTH: thing.cloth = true; thing.clothSlot = r.u16(); break;
      case F5.MARKET_ITEM: {
        thing.isMarketItem = true;
        thing.marketCategory = r.u16();
        thing.marketTradeAs = r.u16();
        thing.marketShowAs = r.u16();
        const nameLength = r.u16();
        thing.marketName = r.str(nameLength);
        thing.marketRestrictProfession = r.u16();
        thing.marketRestrictLevel = r.u16();
        break;
      }
      case F5.HAS_BONES:
        thing.hasBones = true;
        r.i16(); r.i16(); r.i16(); r.i16(); r.i16(); r.i16(); r.i16(); r.i16();
        break;
      default:
        throw new Error(`Unknown DAT flag 0x${flag.toString(16)} (prev item id ${thing.id}, category ${thing.category})`);
    }
  }
  return true;
}

// features: extended=true, transparency=true, frameDurations=true, frameGroups=true (per Tibia.otfi)
function readTexturePatterns(r, thing, features) {
  let groupCount = 1;
  if (features.frameGroups && thing.category === CATEGORY.OUTFIT) {
    groupCount = r.u8();
  }

  for (let groupType = 0; groupType < groupCount; groupType++) {
    if (features.frameGroups && thing.category === CATEGORY.OUTFIT) {
      r.u8(); // group type byte
    }

    const fg = {};
    fg.width = r.u8();
    fg.height = r.u8();
    fg.exactSize = (fg.width > 1 || fg.height > 1) ? r.u8() : 32;
    fg.layers = r.u8();
    fg.patternX = r.u8();
    fg.patternY = r.u8();
    fg.patternZ = r.u8();
    fg.frames = r.u8();

    if (fg.frames > 1) {
      if (features.improvedAnimations) {
        r.u8(); // animationMode
        r.i32(); // loopCount
        r.u8(); // startFrame (signed byte, value unused here)
        for (let i = 0; i < fg.frames; i++) { r.u32(); r.u32(); } // min/max duration
      }
      // else: default durations, nothing stored in file
    }

    const totalSprites = fg.width * fg.height * fg.patternX * fg.patternY * fg.patternZ * fg.frames * fg.layers;
    fg.spriteIndex = new Array(totalSprites);
    for (let i = 0; i < totalSprites; i++) {
      fg.spriteIndex[i] = features.extended ? r.u32() : r.u16();
    }

    thing.frameGroups[groupType] = fg;
  }
}

function loadDat(datPath, features) {
  const buf = fs.readFileSync(datPath);
  const r = new Reader(buf);

  const signature = r.u32();
  const itemsCount = r.u16();
  const outfitsCount = r.u16();
  const effectsCount = r.u16();
  const missilesCount = r.u16();

  const items = new Map();

  function loadList(minId, maxId, category) {
    const map = new Map();
    for (let id = minId; id <= maxId; id++) {
      const thing = { id, category, frameGroups: {} };
      readThingProperties(r, thing);
      readTexturePatterns(r, thing, features);
      map.set(id, thing);
    }
    return map;
  }

  const itemsMap = loadList(MIN_ITEM_ID, itemsCount, CATEGORY.ITEM);
  loadList(1, outfitsCount, CATEGORY.OUTFIT); // outfits (skipped, not needed for items.otb)
  loadList(1, effectsCount, CATEGORY.EFFECT); // effects
  loadList(1, missilesCount, CATEGORY.MISSILE); // missiles

  if (r.pos !== buf.length) {
    throw new Error(`DAT parse ended at ${r.pos}, expected ${buf.length} (trailing bytes unread)`);
  }

  return { signature, itemsCount, itemsMap };
}

// ---------------------------------------------------------------------------
// .spr parsing (extended header) + RLE decompression -> RGB(A) buffer
// ---------------------------------------------------------------------------
const SPRITE_SIZE = 32;
const SPRITE_DATA_SIZE = SPRITE_SIZE * SPRITE_SIZE * 4; // RGBA (matches SpriteExtent.DEFAULT_DATA_SIZE)

class SpriteFile {
  constructor(sprPath, extended, transparency) {
    this.buf = fs.readFileSync(sprPath);
    this.extended = extended;
    this.transparency = transparency;
    this.signature = this.buf.readUInt32LE(0);
    this.headerSize = extended ? 4 + 4 : 4 + 2;
    this.count = extended ? this.buf.readUInt32LE(4) : this.buf.readUInt16LE(4);
  }

  // Returns compressed pixel bytes for sprite id (1-based), or null if empty/out of range.
  getCompressed(id) {
    if (id === 0 || id > this.count) return null;
    const addrPos = (id - 1) * 4 + this.headerSize;
    const address = this.buf.readUInt32LE(addrPos);
    if (address === 0) return null;

    let p = address;
    p += 3; // skip R,G,B color key bytes
    const length = this.buf.readUInt16LE(p); p += 2;
    if (length === 0) return null;
    return this.buf.subarray(p, p + length);
  }

  // Mirrors Sprite.getRGBData(): returns 3072-byte RGB buffer (32*32*3),
  // 0x11 for transparent pixels, alpha byte in compressed stream (if transparency) is skipped/ignored.
  getRGB(id) {
    const rgb = Buffer.alloc(SPRITE_SIZE * SPRITE_SIZE * 3, 0x11);
    const compressed = this.getCompressed(id);
    if (!compressed) return rgb;

    const bitPerPixel = this.transparency ? 4 : 3;
    let read = 0;
    let write = 0;
    const length = compressed.length;

    while (read < length) {
      const transparentPixels = compressed.readUInt16LE(read);
      const coloredPixels = compressed.readUInt16LE(read + 2);
      read += 4;

      write += transparentPixels * 3; // already 0x11-filled by Buffer.alloc

      for (let j = 0; j < coloredPixels; j++) {
        const rr = compressed[read]; const gg = compressed[read + 1]; const bb = compressed[read + 2];
        read += 3;
        if (this.transparency) read += 1; // skip alpha byte
        rgb[write++] = rr; rgb[write++] = gg; rgb[write++] = bb;
      }
    }
    return rgb;
  }
}

// Mirrors SpriteStorage.getSpriteHash: BGR0, vertically flipped, MD5.
function computeSpriteHash(thing, sprites) {
  const hash = Buffer.alloc(16);
  const fg = thing.frameGroups[0]; // FrameGroupType.DEFAULT
  if (!fg) return hash;

  const spritesToHash = fg.width * fg.height * fg.layers;
  if (!fg.spriteIndex || fg.spriteIndex.length < spritesToHash) return hash;

  const stream = Buffer.alloc(spritesToHash * SPRITE_SIZE * SPRITE_SIZE * 4);
  let w = 0;

  for (let i = 0; i < spritesToHash; i++) {
    const spriteId = fg.spriteIndex[i];
    const rgb = sprites.getRGB(spriteId); // 32*32*3, row-major top-to-bottom

    for (let y = 0; y < SPRITE_SIZE; y++) {
      const srcY = SPRITE_SIZE - y - 1;
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const srcPos = srcY * 96 + x * 3;
        const r = rgb[srcPos], g = rgb[srcPos + 1], b = rgb[srcPos + 2];
        stream[w++] = b; stream[w++] = g; stream[w++] = r; stream[w++] = 0;
      }
    }
  }

  return crypto.createHash('md5').update(stream).digest();
}

// ---------------------------------------------------------------------------
// ThingType -> ServerItem sync (mirrors OtbSync.createFromThingType, clientVersion=860)
// ---------------------------------------------------------------------------
const ServerItemType = { NONE: 0, GROUND: 1, CONTAINER: 2, FLUID: 3, SPLASH: 4, DEPRECATED: 5 };
const ServerItemGroup = { NONE: 0, GROUND: 1, CONTAINER: 2, SPLASH: 11, FLUID: 12, DEPRECATED: 14 };
const TileStackOrder = { NONE: 0, BORDER: 1, BOTTOM: 2, TOP: 3 };
const ServerItemFlag = {
  UNPASSABLE: 1 << 0, BLOCK_MISSILES: 1 << 1, BLOCK_PATHFINDER: 1 << 2, HAS_ELEVATION: 1 << 3,
  MULTI_USE: 1 << 4, PICKUPABLE: 1 << 5, MOVABLE: 1 << 6, STACKABLE: 1 << 7,
  STACK_ORDER: 1 << 13, READABLE: 1 << 14, ROTATABLE: 1 << 15, HANGABLE: 1 << 16,
  HOOK_EAST: 1 << 17, HOOK_SOUTH: 1 << 18, ALLOW_DISTANCE_READ: 1 << 20,
  CLIENT_CHARGES: 1 << 22, IGNORE_LOOK: 1 << 23, IS_ANIMATION: 1 << 24,
  FULL_GROUND: 1 << 25, FORCE_USE: 1 << 26,
};

const CLIENT_VERSION = 860; // 8.60 v2, from client/data/things/Tibia.otfi + versions.xml match

function createServerItem(thing, sprites) {
  const item = { id: thing.id, clientId: thing.id, name: '', tradeAs: 0 };

  if (thing.isGround) item.type = ServerItemType.GROUND;
  else if (thing.isContainer) item.type = ServerItemType.CONTAINER;
  else if (thing.isFluidContainer) item.type = ServerItemType.FLUID;
  else if (thing.isFluid) item.type = ServerItemType.SPLASH;
  else item.type = ServerItemType.NONE;

  item.spriteHash = computeSpriteHash(thing, sprites);

  item.unpassable = !!thing.isUnpassable;
  item.blockMissiles = !!thing.blockMissile;
  item.blockPathfinder = !!thing.blockPathfind;
  item.hasElevation = !!thing.hasElevation;
  item.multiUse = !!thing.multiUse;
  item.pickupable = !!thing.pickupable;
  item.movable = !thing.isUnmoveable;
  item.stackable = !!thing.stackable;
  item.readable = !!(thing.writable || thing.writableOnce || (thing.isLensHelp && thing.lensHelp === 1112));
  item.rotatable = !!thing.rotatable;
  item.hangable = !!thing.hangable;
  item.hookSouth = !!thing.isVertical;
  item.hookEast = !!thing.isHorizontal;
  item.ignoreLook = !!thing.ignoreLook;
  item.allowDistanceRead = false;

  // clientVersion 860 < 1010 => forceUse/fullGround always false (ItemEditor parity)
  item.forceUse = false;
  item.fullGround = false;

  item.hasCharges = false;

  const fg = thing.frameGroups[0];
  item.isAnimation = !!(fg && fg.frames > 1);

  item.lightLevel = thing.lightLevel || 0;
  item.lightColor = thing.lightColor || 0;

  item.groundSpeed = thing.isGround ? (thing.groundSpeed || 0) : 0;
  item.minimapColor = thing.miniMapColor || 0;

  item.maxReadWriteChars = thing.writable ? (thing.maxReadWriteChars || 0) : 0;
  item.maxReadChars = thing.writableOnce ? (thing.maxReadChars || 0) : 0;

  if (thing.isGroundBorder) { item.stackOrder = TileStackOrder.BORDER; item.hasStackOrder = true; }
  else if (thing.isOnBottom) { item.stackOrder = TileStackOrder.BOTTOM; item.hasStackOrder = true; }
  else if (thing.isOnTop) { item.stackOrder = TileStackOrder.TOP; item.hasStackOrder = true; }
  else { item.stackOrder = TileStackOrder.NONE; item.hasStackOrder = false; }

  if (thing.marketName && thing.marketName.length > 0) item.name = thing.marketName;
  if (thing.marketTradeAs) item.tradeAs = thing.marketTradeAs;

  return item;
}

function getGroup(item) {
  switch (item.type) {
    case ServerItemType.GROUND: return ServerItemGroup.GROUND;
    case ServerItemType.CONTAINER: return ServerItemGroup.CONTAINER;
    case ServerItemType.FLUID: return ServerItemGroup.FLUID;
    case ServerItemType.SPLASH: return ServerItemGroup.SPLASH;
    case ServerItemType.DEPRECATED: return ServerItemGroup.DEPRECATED;
    default: return ServerItemGroup.NONE;
  }
}

function getFlags(item) {
  let f = 0;
  if (item.unpassable) f |= ServerItemFlag.UNPASSABLE;
  if (item.blockMissiles) f |= ServerItemFlag.BLOCK_MISSILES;
  if (item.blockPathfinder) f |= ServerItemFlag.BLOCK_PATHFINDER;
  if (item.hasElevation) f |= ServerItemFlag.HAS_ELEVATION;
  if (item.forceUse) f |= ServerItemFlag.FORCE_USE;
  if (item.multiUse) f |= ServerItemFlag.MULTI_USE;
  if (item.pickupable) f |= ServerItemFlag.PICKUPABLE;
  if (item.movable) f |= ServerItemFlag.MOVABLE;
  if (item.stackable) f |= ServerItemFlag.STACKABLE;
  if (item.hasStackOrder) f |= ServerItemFlag.STACK_ORDER;
  if (item.readable) f |= ServerItemFlag.READABLE;
  if (item.rotatable) f |= ServerItemFlag.ROTATABLE;
  if (item.hangable) f |= ServerItemFlag.HANGABLE;
  if (item.hookSouth) f |= ServerItemFlag.HOOK_SOUTH;
  if (item.hookEast) f |= ServerItemFlag.HOOK_EAST;
  if (item.hasCharges) f |= ServerItemFlag.CLIENT_CHARGES;
  if (item.ignoreLook) f |= ServerItemFlag.IGNORE_LOOK;
  if (item.allowDistanceRead) f |= ServerItemFlag.ALLOW_DISTANCE_READ;
  if (item.isAnimation) f |= ServerItemFlag.IS_ANIMATION;
  if (item.fullGround) f |= ServerItemFlag.FULL_GROUND;
  return f >>> 0;
}

// ---------------------------------------------------------------------------
// OTB writer (mirrors OtbWriter: binary tree with 0xFE/0xFF/0xFD escaping)
// ---------------------------------------------------------------------------
const NODE_START = 0xFE, NODE_END = 0xFF, ESCAPE_CHAR = 0xFD;

class OtbWriter {
  constructor() { this.chunks = []; }

  writeByteRaw(b) { this.chunks.push(Buffer.from([b & 0xFF])); }
  writeByte(v, escape) {
    if (escape && (v === NODE_START || v === NODE_END || v === ESCAPE_CHAR)) this.writeByteRaw(ESCAPE_CHAR);
    this.writeByteRaw(v);
  }
  writeBytes(buf, escape) {
    for (const b of buf) this.writeByte(b, escape);
  }
  writeU16(v, escape) {
    const b = Buffer.alloc(2); b.writeUInt16LE(v, 0);
    this.writeBytes(b, escape);
  }
  writeU32(v, escape) {
    const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0, 0);
    this.writeBytes(b, escape);
  }
  createNode(type) { this.writeByte(NODE_START, false); this.writeByte(type, true); }
  closeNode() { this.writeByte(NODE_END, false); }
  writeProp(attr, dataBuf) {
    this.writeByte(attr, true);
    this.writeU16(dataBuf.length, true);
    this.writeBytes(dataBuf, true);
  }

  toBuffer() { return Buffer.concat(this.chunks); }
}

function u16le(v) { const b = Buffer.alloc(2); b.writeUInt16LE(v, 0); return b; }

function writeOtb(items, majorVersion, minorVersion, buildNumber, clientVersion, outPath) {
  const w = new OtbWriter();

  w.writeU32(0, false); // header version = 0

  w.createNode(0); // root node, type 0
  w.writeU32(0, true); // root flags, unused

  const csdVersion = `OTB ${majorVersion}.${minorVersion}.${buildNumber}-${Math.floor(clientVersion / 100)}.${clientVersion % 100}`;
  const versionData = Buffer.alloc(4 + 4 + 4 + 128);
  versionData.writeUInt32LE(majorVersion, 0);
  versionData.writeUInt32LE(minorVersion, 4);
  versionData.writeUInt32LE(buildNumber, 8);
  Buffer.from(csdVersion, 'latin1').copy(versionData, 12);
  w.writeProp(0x01, versionData); // RootAttribute.VERSION

  items.sort((a, b) => a.id - b.id);

  for (const item of items) {
    w.createNode(getGroup(item));
    w.writeU32(getFlags(item), true);

    w.writeProp(0x10, u16le(item.id)); // SERVER_ID

    if (item.type !== ServerItemType.DEPRECATED) {
      w.writeProp(0x11, u16le(item.clientId)); // CLIENT_ID

      if (item.spriteHash && item.spriteHash.length > 0) {
        w.writeProp(0x20, item.spriteHash); // SPRITE_HASH
      }

      if (item.minimapColor !== 0) {
        w.writeProp(0x21, u16le(item.minimapColor)); // MINIMAP_COLOR
      }

      if (item.maxReadWriteChars !== 0) {
        w.writeProp(0x22, u16le(item.maxReadWriteChars)); // MAX_READ_WRITE_CHARS
      }

      if (item.maxReadChars !== 0) {
        w.writeProp(0x23, u16le(item.maxReadChars)); // MAX_READ_CHARS
      }

      if (item.lightLevel !== 0 || item.lightColor !== 0) {
        const b = Buffer.concat([u16le(item.lightLevel), u16le(item.lightColor)]);
        w.writeProp(0x2A, b); // LIGHT
      }

      if (item.type === ServerItemType.GROUND) {
        w.writeProp(0x14, u16le(item.groundSpeed)); // GROUND_SPEED
      }

      if (item.stackOrder !== TileStackOrder.NONE) {
        w.writeProp(0x2B, Buffer.from([item.stackOrder])); // STACK_ORDER
      }

      if (item.tradeAs !== 0) {
        w.writeProp(0x2D, u16le(item.tradeAs)); // TRADE_AS
      }

      if (item.name && item.name.length > 0) {
        w.writeProp(0x12, Buffer.from(item.name, 'utf8')); // NAME
      }
    }

    w.closeNode();
  }

  w.closeNode(); // close root

  const tmpPath = outPath + '.tmp';
  fs.writeFileSync(tmpPath, w.toBuffer());
  fs.renameSync(tmpPath, outPath);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const features = { extended: true, transparency: true, improvedAnimations: true, frameGroups: true };

  console.log(`Reading DAT: ${DAT_PATH}`);
  const { itemsMap, itemsCount } = loadDat(DAT_PATH, features);
  console.log(`  ${itemsMap.size} items parsed (declared count: ${itemsCount})`);

  console.log(`Reading SPR: ${SPR_PATH}`);
  const sprites = new SpriteFile(SPR_PATH, features.extended, features.transparency);
  console.log(`  ${sprites.count} sprites, extended=${sprites.extended}`);

  const serverItems = [];
  for (const thing of itemsMap.values()) {
    serverItems.push(createServerItem(thing, sprites));
  }
  console.log(`Built ${serverItems.length} server items`);

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  writeOtb(serverItems, 3, 20, 1, CLIENT_VERSION, outFile);

  const stat = fs.statSync(outFile);
  console.log(`Wrote ${outFile} (${stat.size} bytes)`);
}

main();
