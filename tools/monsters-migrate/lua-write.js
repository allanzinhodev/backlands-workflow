/**
 * Serializes JS values into Lua table literal syntax, matching the style
 * used across server/data/monsters/**\/*.lua (tabs, trailing commas,
 * double-quoted strings).
 */
'use strict';

function luaString(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

// value: string | number | boolean | RawLua (unquoted identifier/expression) | array | plain object
class RawLua {
  constructor(text) { this.text = text; }
}
function raw(text) { return new RawLua(text); }

function luaValue(value, indent) {
  if (value instanceof RawLua) return value.text;
  if (typeof value === 'string') return luaString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return luaArray(value, indent);
  if (value && typeof value === 'object') return luaTable(value, indent);
  throw new Error('Cannot serialize value: ' + value);
}

function luaTable(obj, indent) {
  const pad = '\t'.repeat(indent + 1);
  const closePad = '\t'.repeat(indent);
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '{}';
  const lines = entries.map(([k, v]) => `${pad}${k} = ${luaValue(v, indent + 1)},`);
  return `{\n${lines.join('\n')}\n${closePad}}`;
}

// Array of plain values or tables; each element indented, trailing comma.
function luaArray(arr, indent) {
  const pad = '\t'.repeat(indent + 1);
  const closePad = '\t'.repeat(indent);
  if (arr.length === 0) return '{}';
  const lines = arr.map((v) => `${pad}${luaValue(v, indent + 1)},`);
  return `{\n${lines.join('\n')}\n${closePad}}`;
}

// Top-level statement: `monster.<field> = <value>`
function assign(field, value) {
  if (value === undefined) return '';
  return `monster.${field} = ${luaValue(value, 0)}`;
}

module.exports = { luaString, raw, RawLua, luaValue, luaTable, luaArray, assign };
