#!/usr/bin/env node
// Round-trip check: parse items.xml, re-serialize every top-level <item>
// verbatim (via .raw) using the original inter-child whitespace, and
// confirm byte-identical output against the source file. Run this before
// trusting the parser for the real migration.
'use strict';
const fs = require('fs');
const path = require('path');
const { parseXmlFile, serializeAttrs } = require('./xml-lite');

const target = path.resolve(process.argv[2] || 'D:/backlands/server/data/items/items.xml');

const original = fs.readFileSync(target, 'latin1');
const { header, headerNewline, root, trailing } = parseXmlFile(original);

console.log(`Parsed root <${root.tag}> with ${root.children.length} children.`);

const rootOpen = `<${root.tag}${serializeAttrs(root.attrs)}>`;
const rootClose = `</${root.tag}>`;
const bodyStart = original.indexOf(rootOpen) + rootOpen.length;
const firstChildStart = root.children[0].start;
const lastChildEnd = root.children[root.children.length - 1].end;
const leadGap = original.slice(bodyStart, firstChildStart);
const tailGap = original.slice(lastChildEnd, root.end - rootClose.length);

let rebuilt = header + headerNewline + rootOpen + leadGap;
for (let i = 0; i < root.children.length; i++) {
  rebuilt += root.children[i].raw;
  const gapStart = root.children[i].end;
  const gapEnd = i + 1 < root.children.length ? root.children[i + 1].start : lastChildEnd;
  rebuilt += original.slice(gapStart, gapEnd);
}
rebuilt += tailGap + rootClose + trailing;

if (rebuilt === original) {
  console.log('SELF-TEST PASS: round-trip is byte-identical.');
  process.exit(0);
}

console.error('SELF-TEST FAIL: round-trip diverged.');
console.error('original length:', original.length, 'rebuilt length:', rebuilt.length);
for (let i = 0; i < Math.min(original.length, rebuilt.length); i++) {
  if (original[i] !== rebuilt[i]) {
    console.error(`first diff at byte ${i}:`);
    console.error('original:', JSON.stringify(original.slice(Math.max(0, i - 40), i + 40)));
    console.error('rebuilt :', JSON.stringify(rebuilt.slice(Math.max(0, i - 40), i + 40)));
    break;
  }
}
process.exit(1);
