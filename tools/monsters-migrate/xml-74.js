/**
 * Minimal XML reader for 74 monster files. Simpler than
 * tools/items-migrate/xml-lite.js: no round-trip/verbatim requirement
 * here (the output is generated Lua, not passthrough XML), so this just
 * builds a plain tree of {tag, attrs: Map, children: []}.
 */
'use strict';
const fs = require('fs');

function parseAttrs(text, i) {
  const attrs = new Map();
  while (true) {
    while (/\s/.test(text[i])) i++;
    if (text[i] === '/' || text[i] === '>') break;
    const nameStart = i;
    while (text[i] !== '=' && !/\s/.test(text[i])) i++;
    const name = text.slice(nameStart, i);
    while (/\s/.test(text[i])) i++;
    i++; // '='
    while (/\s/.test(text[i])) i++;
    const quote = text[i];
    i++;
    const valStart = i;
    while (text[i] !== quote) i++;
    attrs.set(name, text.slice(valStart, i));
    i++; // closing quote
  }
  return { attrs, i };
}

function parseElement(text, pos) {
  if (text.startsWith('<!--', pos)) {
    const end = text.indexOf('-->', pos) + 3;
    return { node: null, end };
  }
  let i = pos + 1;
  const tagStart = i;
  while (!/[\s/>]/.test(text[i])) i++;
  const tag = text.slice(tagStart, i);
  const parsed = parseAttrs(text, i);
  i = parsed.i;

  if (text[i] === '/') {
    return { node: { tag, attrs: parsed.attrs, children: [] }, end: i + 2 };
  }

  i++; // '>'
  const children = [];
  while (true) {
    while (/\s/.test(text[i])) i++;
    if (text.startsWith('</', i)) {
      const close = text.indexOf('>', i);
      return { node: { tag, attrs: parsed.attrs, children }, end: close + 1 };
    }
    const child = parseElement(text, i);
    if (child.node) children.push(child.node);
    i = child.end;
  }
}

function parseMonsterXml(filePath) {
  const text = fs.readFileSync(filePath, 'latin1');
  const rootStart = text.indexOf('<monster');
  const { node } = parseElement(text, rootStart);
  return node;
}

// Convenience: get all direct children with a given tag.
function children(node, tag) {
  return node.children.filter((c) => c.tag === tag);
}
function child(node, tag) {
  return node.children.find((c) => c.tag === tag) || null;
}
function attr(node, name, fallback) {
  return node.attrs.has(name) ? node.attrs.get(name) : fallback;
}
function attrNum(node, name, fallback) {
  return node.attrs.has(name) ? Number(node.attrs.get(name)) : fallback;
}

module.exports = { parseMonsterXml, children, child, attr, attrNum };
