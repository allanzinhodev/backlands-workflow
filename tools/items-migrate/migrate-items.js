#!/usr/bin/env node
/**
 * Migrates items and attributes from the Tibia 7.4 reference datapack
 * (74/items/items.xml) into the current server's items.xml. The 7.4 file
 * speaks 7.4 Server IDs; the server indexes items by Client ID, so every
 * 7.4 item is first translated to its Client ID via 74/items/items.otb.
 *
 * Usage: node migrate-items.js [--dry-run]
 * Docs: README.md nesta pasta.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { parseXmlFile, serializeAttrs, serializeNode } = require('./xml-lite');
const { readOtbServerIds, readOtbIdPairs } = require('./read-otb-ids');

const REPO = path.resolve(__dirname, '..', '..');
const FILE_74 = path.join(REPO, '74/items/items.xml');
const FILE_OTB_74 = path.join(REPO, '74/items/items.otb');
const FILE_CURRENT = path.join(REPO, 'server/data/items/items.xml');
const FILE_OTB = path.join(REPO, 'server/data/items/items.otb');
const REPORT_DIR = path.join(REPO, 'tools/items-migrate/reports');

// <attribute key=... value=...> keys whose value is another item's id.
const ITEM_ID_KEYS = new Set(['decayto', 'destroyto', 'rotateto', 'malesleeper', 'femalesleeper', 'transformequipto', 'transformdeequipto']);

const PRESERVED_IDS = new Set(Array.from({ length: 20 }, (_, i) => i + 1)); // 1-20

const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Helpers over parsed nodes
// ---------------------------------------------------------------------------

// Works for both XmlNode instances (attr() method) and plain merged nodes
// (attrs is a Map, no attr() method) -- always read via the Map directly.
function idsOfNode(node) {
  const idAttr = node.attrs.get('id');
  if (idAttr) return [Number(idAttr.value)];
  const fromAttr = node.attrs.get('fromid');
  const toAttr = node.attrs.get('toid');
  if (fromAttr && toAttr) {
    const from = Number(fromAttr.value);
    const to = Number(toAttr.value);
    const ids = [];
    for (let i = from; i <= to; i++) ids.push(i);
    return ids;
  }
  return [];
}

function normalizeName(name) {
  return name === undefined ? '' : name.trim().toLowerCase();
}

function cloneAttrs(attrs) {
  const copy = new Map();
  for (const [k, v] of attrs) copy.set(k, { value: v.value, quote: v.quote });
  return copy;
}

function cloneNodeDeep(node) {
  const copy = { tag: node.tag, attrs: cloneAttrs(node.attrs), children: node.children.map(cloneNodeDeep), raw: null };
  return copy;
}

function makeNode(tag, attrs, children) {
  return { tag, attrs, children, raw: null };
}

function setAttr(attrs, name, value, quote = '"') {
  attrs.set(name, { value: String(value), quote });
}

// ---------------------------------------------------------------------------
// Step 1: parse both files
// ---------------------------------------------------------------------------

function loadItems(filePath) {
  const text = fs.readFileSync(filePath, 'latin1');
  const parsed = parseXmlFile(text);
  return { text, ...parsed };
}

// ---------------------------------------------------------------------------
// Step 2: build indices on the current file
// ---------------------------------------------------------------------------

function buildCurrentIndex(currentRoot) {
  const byId = new Map(); // id -> { node, index in currentRoot.children }
  const ranges = []; // { node, index, from, to }
  const nameIndex = new Map(); // normalizedName -> id[] (individual items only)

  currentRoot.children.forEach((node, index) => {
    if (node.tag !== 'item') return;
    const idAttr = node.attr('id');
    const fromAttr = node.attr('fromid');
    const toAttr = node.attr('toid');

    if (idAttr) {
      const id = Number(idAttr.value);
      byId.set(id, { node, index });
      const nameAttr = node.attr('name');
      if (nameAttr) {
        const key = normalizeName(nameAttr.value);
        if (!nameIndex.has(key)) nameIndex.set(key, []);
        nameIndex.get(key).push(id);
      }
    } else if (fromAttr && toAttr) {
      const from = Number(fromAttr.value);
      const to = Number(toAttr.value);
      ranges.push({ node, index, from, to });
    }
  });

  return { byId, ranges, nameIndex };
}

// ---------------------------------------------------------------------------
// Step 3: classify each 7.4 item's name match against the current index
// ---------------------------------------------------------------------------

function classifyMatch(item74Node, nameIndex, currentByIdIndex) {
  const nameAttr = item74Node.attr('name');
  if (!nameAttr) return { kind: 'none' };
  const key = normalizeName(nameAttr.value);
  const candidates = nameIndex.get(key) || [];
  if (candidates.length === 0) return { kind: 'none' };
  if (candidates.length === 1) {
    return { kind: 'unique', currentId: candidates[0], currentNode: currentByIdIndex.get(candidates[0]).node };
  }
  return { kind: 'ambiguous', candidates };
}

// ---------------------------------------------------------------------------
// Step 4: merge (74 wins on conflicting keys; current-only keys preserved)
// ---------------------------------------------------------------------------

function mergeItem(item74Node, currentNodeOrNull) {
  const attrs = new Map();
  const idAttr = item74Node.attr('id');
  setAttr(attrs, 'id', idAttr.value);

  const article74 = item74Node.attr('article');
  const articleCurrent = currentNodeOrNull ? currentNodeOrNull.attr('article') : undefined;
  const article = article74 || articleCurrent;
  if (article) setAttr(attrs, 'article', article.value);

  const name74 = item74Node.attr('name');
  if (name74) setAttr(attrs, 'name', name74.value);

  const children = [];
  const childByKey = new Map(); // attribute key -> child node (for <attribute key=.../>)

  function addChild(childNode) {
    const keyAttr = childNode.attr('key');
    const key = keyAttr ? keyAttr.value : null;
    const cloned = cloneNodeDeep(childNode);
    if (key && childByKey.has(key)) {
      const existingIdx = children.indexOf(childByKey.get(key));
      children[existingIdx] = cloned;
    } else {
      children.push(cloned);
    }
    if (key) childByKey.set(key, cloned);
  }

  // Base: all attribute children from the current item (imbuements, scripts, etc.)
  if (currentNodeOrNull) {
    for (const child of currentNodeOrNull.children) addChild(child);
  }
  // Overlay: 74's attribute children win on matching keys, add new ones.
  for (const child of item74Node.children) addChild(child);

  if (children.length === 0) {
    return makeNode('item', attrs, []);
  }
  return makeNode('item', attrs, children);
}

// 74-only node (no current match): same construction, just no base attrs.
function buildPureNode(item74Node) {
  return mergeItem(item74Node, null);
}

// ---------------------------------------------------------------------------
// Step 5: range splitting
// ---------------------------------------------------------------------------

// Splits a current range node around a set of occupied ids (ids claimed by
// 7.4 items), returning an array of replacement nodes (individual <item id>
// or smaller <item fromid/toid>), preserving the range's own attrs (name/article).
function splitRange(rangeNode, from, to, occupiedIds) {
  const occupied = new Set(occupiedIds);
  const baseAttrsNoIds = new Map();
  for (const [k, v] of rangeNode.attrs) {
    if (k !== 'fromid' && k !== 'toid') baseAttrsNoIds.set(k, { value: v.value, quote: v.quote });
  }

  const fragments = [];
  let segStart = null;
  for (let id = from; id <= to + 1; id++) {
    const isOccupied = id <= to && occupied.has(id);
    if (!isOccupied && id <= to) {
      if (segStart === null) segStart = id;
    } else {
      if (segStart !== null) {
        const segEnd = id - 1;
        fragments.push(makeRangeFragment(segStart, segEnd, baseAttrsNoIds));
        segStart = null;
      }
    }
  }
  return fragments;
}

function makeRangeFragment(from, to, baseAttrsNoIds) {
  const attrs = new Map();
  if (from === to) {
    setAttr(attrs, 'id', from);
  } else {
    setAttr(attrs, 'fromid', from);
    setAttr(attrs, 'toid', to);
  }
  for (const [k, v] of baseAttrsNoIds) attrs.set(k, { value: v.value, quote: v.quote });
  // Re-order so id/fromid/toid come first (cosmetic, matches source convention).
  const ordered = new Map();
  for (const k of ['id', 'fromid', 'toid']) if (attrs.has(k)) ordered.set(k, attrs.get(k));
  for (const [k, v] of attrs) if (!ordered.has(k)) ordered.set(k, v);
  return makeNode('item', ordered, []);
}

// ---------------------------------------------------------------------------
// Step 0: translate the 7.4 file from 7.4 Server IDs to Client IDs
// ---------------------------------------------------------------------------

// Rewrites, in place, each 7.4 item's id and its item-id-valued attributes.
// Two 7.4 Server IDs can share one Client ID; the first keeps it, the rest
// are dropped from the migration (there is only one item per Client ID).
function translate74ToClientIds(items74Root, sidToCid) {
  const translate = (sid) => sidToCid.get(sid) ?? null;
  const seenCids = new Set();
  const report = { missingInOtb: [], sharedClientId: [], attrsUntranslated: [] };

  items74Root.children = items74Root.children.filter((node) => {
    if (node.tag !== 'item' || !node.attr('id')) return true;
    const sid = Number(node.attr('id').value);
    const cid = translate(sid);
    if (cid === null) { report.missingInOtb.push(sid); return false; }
    if (seenCids.has(cid)) { report.sharedClientId.push({ sid, cid }); return false; }
    seenCids.add(cid);
    node.attrs.get('id').value = String(cid);

    for (const child of node.children) {
      const key = child.attr('key');
      const value = child.attr('value');
      if (!key || !value || !ITEM_ID_KEYS.has(key.value.toLowerCase())) continue;
      const target = translate(Number(value.value));
      if (target === null) report.attrsUntranslated.push({ sid, key: key.value, value: value.value });
      else value.value = String(target);
    }
    return true;
  });

  return report;
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

function migrate(items74Root, currentRoot) {
  const index = buildCurrentIndex(currentRoot);

  const stats = {
    overwritten: 0,
    merged: 0,
    ambiguousSkipped: 0,
    insertedFree: 0,
    rangesSplit: 0,
    preservedUnrelated: 0,
  };
  const ambiguityReport = [];

  // Collect all 7.4 items to migrate (excluding preserved 1-20).
  const items74 = items74Root.children.filter((n) => n.tag === 'item');
  const toMigrate = [];
  for (const node of items74) {
    const idAttr = node.attr('id');
    if (!idAttr) continue; // 74 file has no ranges, but guard anyway
    const id = Number(idAttr.value);
    if (PRESERVED_IDS.has(id)) continue;
    toMigrate.push({ id, node });
  }

  const occupiedByRangeIndex = new Map(); // range array-index -> Set of occupied ids
  const replacementForOutputIndex = new Map(); // output position (original index) -> array of nodes
  const freeInsertions = []; // { id, node } to insert positionally

  for (const { id, node } of toMigrate) {
    const match = classifyMatch(node, index.nameIndex, index.byId);

    let mergedNode;
    if (match.kind === 'unique') {
      mergedNode = mergeItem(node, match.currentNode);
      stats.merged++;
    } else {
      if (match.kind === 'ambiguous') {
        stats.ambiguousSkipped++;
        ambiguityReport.push({ id74: id, name: node.attr('name') ? node.attr('name').value : '', candidates: match.candidates });
      }
      mergedNode = buildPureNode(node);
    }

    if (index.byId.has(id)) {
      const { index: outIdx } = index.byId.get(id);
      if (!replacementForOutputIndex.has(outIdx)) replacementForOutputIndex.set(outIdx, []);
      replacementForOutputIndex.get(outIdx).push(mergedNode);
      stats.overwritten++;
      continue;
    }

    const range = index.ranges.find((r) => id >= r.from && id <= r.to);
    if (range) {
      if (!occupiedByRangeIndex.has(range.index)) occupiedByRangeIndex.set(range.index, new Set());
      occupiedByRangeIndex.get(range.index).add(id);
      if (!replacementForOutputIndex.has(range.index)) replacementForOutputIndex.set(range.index, []);
      replacementForOutputIndex.get(range.index).push(mergedNode);
      stats.overwritten++;
      continue;
    }

    freeInsertions.push({ id, node: mergedNode });
    stats.insertedFree++;
  }

  // Build final children array: walk original currentRoot.children in order.
  const finalChildren = [];
  currentRoot.children.forEach((origNode, idx) => {
    const range = index.ranges.find((r) => r.index === idx);
    if (range && occupiedByRangeIndex.has(idx)) {
      // Split this range around occupied ids, interleave fragments and merged items in id order.
      const occupied = occupiedByRangeIndex.get(idx);
      const fragments = splitRange(range.node, range.from, range.to, occupied);
      const overrides = replacementForOutputIndex.get(idx);
      stats.rangesSplit++;

      const pieces = [...fragments.map((f) => ({ id: firstIdOf(f), node: f })), ...overrides.map((o) => ({ id: Number(o.attrs.get('id').value), node: o }))];
      pieces.sort((a, b) => a.id - b.id);
      for (const p of pieces) finalChildren.push(p.node);
      return;
    }

    if (replacementForOutputIndex.has(idx) && !range) {
      // Individual item overwritten (possibly by more than one merge, but
      // an individual id can only match one 7.4 id, so take the first).
      finalChildren.push(replacementForOutputIndex.get(idx)[0]);
      return;
    }

    // Untouched: emit original node verbatim.
    finalChildren.push(origNode);
    if (origNode.tag === 'item') stats.preservedUnrelated++;
  });

  // Insert free-slot items positionally by id.
  for (const { id, node } of freeInsertions) {
    let insertAt = finalChildren.length;
    for (let i = 0; i < finalChildren.length; i++) {
      const ids = idsOfNode(finalChildren[i]);
      const maxId = ids.length ? Math.max(...ids) : -Infinity;
      if (maxId > id) { insertAt = i; break; }
    }
    finalChildren.splice(insertAt, 0, node);
  }

  const migratedIds = toMigrate.map((m) => m.id);
  return { finalChildren, stats, ambiguityReport, migratedIds };
}

function firstIdOf(fragmentNode) {
  const idAttr = fragmentNode.attrs.get('id');
  if (idAttr) return Number(idAttr.value);
  return Number(fragmentNode.attrs.get('fromid').value);
}

// ---------------------------------------------------------------------------
// Serialization of the full file
// ---------------------------------------------------------------------------

function serializeFile(header, headerNewline, rootTag, children) {
  const body = children.map((c) => serializeNode(c, 1)).join('\r\n');
  return `${header}${headerNewline}<${rootTag}>\r\n${body}\r\n</${rootTag}>\r\n`;
}

// ---------------------------------------------------------------------------
// Guard: ids 1-20 must remain byte-identical
// ---------------------------------------------------------------------------

function assertPreservedIdsUntouched(currentRoot, finalChildren) {
  const origById = new Map();
  currentRoot.children.forEach((n) => {
    if (n.tag === 'item') {
      const idAttr = n.attr('id');
      if (idAttr && PRESERVED_IDS.has(Number(idAttr.value))) origById.set(Number(idAttr.value), n.raw);
    }
  });
  const finalById = new Map();
  finalChildren.forEach((n) => {
    const idAttr = n.attrs.get('id');
    if (idAttr && PRESERVED_IDS.has(Number(idAttr.value))) {
      finalById.set(Number(idAttr.value), n.raw !== null ? n.raw : serializeNode(n, 1));
    }
  });
  for (const [id, rawOrig] of origById) {
    const rawFinal = finalById.get(id);
    if (rawFinal === undefined) throw new Error(`GUARD FAILED: preserved id ${id} missing from output`);
    if (rawFinal !== rawOrig) throw new Error(`GUARD FAILED: preserved id ${id} was modified`);
  }
}

// ---------------------------------------------------------------------------
// Validation against items.otb
// ---------------------------------------------------------------------------

// Only checks Server IDs actually touched by this migration (the 74's own
// id range, 21-5089 after excluding the preserved fluids). Ids outside that
// range belong to the pre-existing modern items.xml and are out of scope --
// flagging them would just be noise about content this script never touched.
function validateAgainstOtb(migratedIds) {
  const otbIds = readOtbServerIds(FILE_OTB);
  return migratedIds.filter((id) => !otbIds.has(id));
}

// ---------------------------------------------------------------------------
// Well-formed check: reparse the serialized output
// ---------------------------------------------------------------------------

function assertWellFormed(text) {
  const { root } = parseXmlFile(text);
  if (root.tag !== 'items') throw new Error('Reparsed output root tag mismatch');
  return root.children.length;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log(DRY_RUN ? 'Running in --dry-run mode (no files will be written).' : 'Running for real (will write and back up items.xml).');

  console.log(`Reading 74 datapack: ${FILE_74}`);
  const data74 = loadItems(FILE_74);
  console.log(`  ${data74.root.children.length} items`);

  console.log(`Translating 7.4 Server IDs to Client IDs: ${FILE_OTB_74}`);
  const translationReport = translate74ToClientIds(data74.root, readOtbIdPairs(FILE_OTB_74));
  console.log(`  missing in 7.4 otb: ${translationReport.missingInOtb.length}, shared client id (dropped): ${translationReport.sharedClientId.length}, id attributes left untranslated: ${translationReport.attrsUntranslated.length}`);

  console.log(`Reading current items.xml: ${FILE_CURRENT}`);
  const dataCurrent = loadItems(FILE_CURRENT);
  console.log(`  ${dataCurrent.root.children.length} nodes`);

  const { finalChildren, stats, ambiguityReport, migratedIds } = migrate(data74.root, dataCurrent.root);

  console.log('\n-- Migration stats --');
  console.log(stats);
  console.log(`ambiguous name matches: ${ambiguityReport.length} (see report file)`);

  console.log('\nChecking ids 1-20 are untouched...');
  assertPreservedIdsUntouched(dataCurrent.root, finalChildren);
  console.log('  OK');

  const output = serializeFile(dataCurrent.header, dataCurrent.headerNewline, dataCurrent.root.tag, finalChildren);

  console.log('\nValidating output is well-formed XML...');
  const reparsedCount = assertWellFormed(output);
  console.log(`  OK (${reparsedCount} top-level nodes)`);

  console.log('\nValidating every migrated Server ID exists in items.otb...');
  const missingIds = validateAgainstOtb(migratedIds);
  if (missingIds.length > 0) {
    console.error(`  WARNING: ${missingIds.length} migrated ids have no items.otb entry (would be silently dropped by the C++ loader):`);
    console.error('  ', missingIds.slice(0, 50));
  } else {
    console.log('  OK: every migrated id has a matching items.otb entry.');
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `migration-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ stats, translationReport, ambiguityReport, missingOtbIds: missingIds }, null, 2));
  console.log(`\nReport written to ${reportPath}`);

  if (DRY_RUN) {
    console.log('\nDry run complete. No files were modified.');
    return;
  }

  const backupPath = `${FILE_CURRENT}.${timestamp}.bak`;
  fs.copyFileSync(FILE_CURRENT, backupPath);
  console.log(`Backup written to ${backupPath}`);

  fs.writeFileSync(FILE_CURRENT, output, 'latin1');
  console.log(`Wrote ${FILE_CURRENT} (${output.length} bytes)`);
}

if (require.main === module) {
  main();
}

module.exports = { migrate, buildCurrentIndex, classifyMatch, mergeItem, splitRange, serializeFile };
