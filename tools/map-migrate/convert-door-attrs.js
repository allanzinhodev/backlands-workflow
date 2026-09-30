#!/usr/bin/env node
/**
 * Rewrites the Tibia 7.4 door/key item attributes of an .otbm into action ids
 * the server's door system understands.
 *
 * The 7.4 engine stored door logic in its own OTBM item attributes, which the
 * current server drops ("[MapCache] Unknown item attribute"):
 *   23 KEYNUMBER        (u16, on keys)
 *   24 KEYHOLENUMBER    (u16, on locked doors)
 *   25 DOORQUESTNUMBER  (u16) + 26 DOORQUESTVALUE (u16): opens when
 *                       storage(questnumber) == questvalue
 *   27 DOORLEVEL        (u16): opens from that level on
 * Each becomes OTBM_ATTR_ACTION_ID (4), in ranges that no map item or script
 * uses (see Classic74Doors in server/data/lib/core/actionids.lua):
 *   key / keyhole N  -> 50000 + N   (key and door keep matching)
 *   level L          -> 46000 + L
 *   quest Q, value V -> 40000 + Q * 16 + V
 * Every other byte stays as is.
 *
 * Usage: node convert-door-attrs.js <in.otbm> <out.otbm>
 * Docs: README.md nesta pasta.
 */
'use strict';
const fs = require('fs');

const NODE_START = 0xFE, NODE_END = 0xFF, ESCAPE = 0xFD;
const OTBM_ITEM = 6;
const ATTR_ACTION_ID = 4;
const ATTR_KEYNUMBER = 23, ATTR_KEYHOLENUMBER = 24, ATTR_DOORQUESTNUMBER = 25, ATTR_DOORQUESTVALUE = 26, ATTR_DOORLEVEL = 27;

const KEY_BASE = 50000, LEVEL_BASE = 46000, QUEST_BASE = 40000, QUEST_VALUE_SLOTS = 16;

// Payload size of every item attribute present in the 7.4 map (string attrs
// are u16 length + bytes and are handled separately).
const FIXED_SIZES = { 4: 2, 5: 2, 8: 5, 10: 2, 12: 1, 14: 1, 15: 1, 16: 4, 17: 1, 18: 4, 20: 4, 21: 4, 22: 2, 23: 2, 24: 2, 25: 2, 26: 2, 27: 2 };
const STRING_ATTRS = new Set([6, 7, 19]);

const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) {
  console.error('Usage: node convert-door-attrs.js <in.otbm> <out.otbm>');
  process.exit(1);
}

const stats = { keys: 0, keyholes: 0, questDoors: 0, levelDoors: 0, replacedActionIds: [] };

function convertItem(data, where) {
  const chunks = [data.subarray(0, 2)]; // item id
  const door = {};
  let actionId = null;
  let p = 2;
  while (p < data.length) {
    const attr = data[p];
    let size;
    if (STRING_ATTRS.has(attr)) size = 2 + data.readUInt16LE(p + 1);
    else if (FIXED_SIZES[attr] !== undefined) size = FIXED_SIZES[attr];
    else throw new Error(`unknown item attribute ${attr} (item ${data.readUInt16LE(0)} ${where})`);

    if (attr >= ATTR_KEYNUMBER && attr <= ATTR_DOORLEVEL) {
      door[attr] = data.readUInt16LE(p + 1);
    } else if (attr === ATTR_ACTION_ID) {
      actionId = data.readUInt16LE(p + 1);
    } else {
      chunks.push(data.subarray(p, p + 1 + size));
    }
    p += 1 + size;
  }
  if (!Object.keys(door).length) return data;

  let newActionId;
  if (door[ATTR_KEYNUMBER] !== undefined) { newActionId = KEY_BASE + door[ATTR_KEYNUMBER]; stats.keys++; }
  else if (door[ATTR_KEYHOLENUMBER] !== undefined) { newActionId = KEY_BASE + door[ATTR_KEYHOLENUMBER]; stats.keyholes++; }
  else if (door[ATTR_DOORQUESTNUMBER] !== undefined) {
    const value = door[ATTR_DOORQUESTVALUE] ?? 1;
    if (value >= QUEST_VALUE_SLOTS) throw new Error(`quest door value ${value} does not fit (${where})`);
    newActionId = QUEST_BASE + door[ATTR_DOORQUESTNUMBER] * QUEST_VALUE_SLOTS + value;
    stats.questDoors++;
  } else if (door[ATTR_DOORLEVEL] !== undefined) { newActionId = LEVEL_BASE + door[ATTR_DOORLEVEL]; stats.levelDoors++; }
  if (Object.keys(door).length > 1 && !(door[ATTR_DOORQUESTNUMBER] !== undefined && Object.keys(door).length === 2 && door[ATTR_DOORQUESTVALUE] !== undefined)) {
    throw new Error(`item with more than one kind of door attribute ${JSON.stringify(door)} (${where})`);
  }
  if (actionId !== null) stats.replacedActionIds.push(`${actionId}->${newActionId} ${where}`);

  const aid = Buffer.alloc(3);
  aid[0] = ATTR_ACTION_ID;
  aid.writeUInt16LE(newActionId, 1);
  chunks.push(aid);
  return Buffer.concat(chunks);
}

const raw = fs.readFileSync(inFile);
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
raw.copy(out, 0, 0, 4);
o = 4;
let area = null, tile = null;

function processNode() {
  i++; // NODE_START
  let type = raw[i++];
  if (type === ESCAPE) type = raw[i++];
  const bytes = [];
  while (raw[i] !== NODE_START && raw[i] !== NODE_END) {
    if (raw[i] === ESCAPE) i++;
    bytes.push(raw[i++]);
  }
  let data = Buffer.from(bytes);
  if (type === 4) area = { x: data.readUInt16LE(0), y: data.readUInt16LE(2), z: data[4] };
  if ((type === 5 || type === 14) && area) tile = `${area.x + data[0]},${area.y + data[1]},${area.z}`;
  if (type === OTBM_ITEM) data = convertItem(data, `@${tile}`);

  put(NODE_START);
  putEscaped(Buffer.from([type]));
  putEscaped(data);
  while (raw[i] === NODE_START) processNode();
  i++;
  put(NODE_END);
}

processNode();
if (i !== raw.length) throw new Error(`trailing bytes: stopped at ${i} of ${raw.length}`);
fs.writeFileSync(outFile, out.subarray(0, o));
console.log(`keys: ${stats.keys}, key doors: ${stats.keyholes}, quest doors: ${stats.questDoors}, level doors: ${stats.levelDoors}`);
console.log(`existing action ids replaced by a door id: ${stats.replacedActionIds.length}`);
for (const r of stats.replacedActionIds) console.log(`  ${r}`);
console.log(`wrote ${outFile} (${o} bytes)`);
