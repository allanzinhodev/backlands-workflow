#!/usr/bin/env node
/**
 * Converts 74/world/map-spawn.xml (mixed <spawn>/<monster> standard blocks
 * plus a majority of flat <tvpspawn> entries) into the current server's
 * plain <spawn><monster/></spawn> / <spawn><npc/></spawn> format
 * (server/src/spawn.cpp::loadFromXml -- confirmed it accepts <monster>
 * and <npc> children directly inside <spawn>, with x/y as offsets
 * relative to the spawn's centerx/centery).
 *
 * <tvpspawn amount="N"> has no per-copy position data (the 7.4 tool that
 * produced it just declared "N of this monster somewhere in this radius").
 * The current server's <monster> is a single fixed position (no random
 * scatter within the radius), so N copies at the same x=0,y=0 offset
 * would all spawn stacked on the same tile. To approximate "N monsters
 * spread within the radius" we place them on a small deterministic ring
 * pattern around the center, sized to the spawn's own radius -- not a
 * real position recovered from the source data, just a reasonable
 * placeholder so N>1 spawns don't stack.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');

function collectServerMonsterNames(monstersDir) {
  const names = new Set();
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.lua')) continue;
      const text = fs.readFileSync(full, 'utf8');
      const m = /monster\.name\s*=\s*"([^"]*)"/m.exec(text) || /Game\.createMonsterType\("([^"]*)"\)/.exec(text);
      if (m) names.add(m[1].trim().toLowerCase());
    }
  }
  walk(monstersDir);
  return names;
}

// 7.4 spawn monster names that don't match the migrated monster file's
// display name 1:1 -- same synonym table used in tools/monsters-migrate
// (beholder -> bonelord, since that migration renamed the monster), plus
// the "disguised as Demon" boss that got its own display name
// (classic74/demon_illusion.lua). "Training Monk" has no 7.4 monster XML
// at all (never had its own file in 74/monster/monsters/) -- mapped to
// the closest existing migrated monster (Monk) as a content judgment
// call, not a technical correspondence; flagged in the report either way.
const MONSTER_NAME_FIXUPS = {
  'beholder': 'Bonelord',
  'elder beholder': 'Elder Bonelord',
  'illusion': 'Demon Illusion',
  'training monk': 'Monk',
};

// <tvpspawn npcname="..."> is the 7.4 NPC file name (lowercase), not the NPC's
// display name. The server and the map editor match NPC names ignoring case,
// but "cobra npc"/"demon skeleton npc" match nothing, so the spawn gets the
// display name from the name="..." of 74/npc/<npcname>.xml. Two of them
// are named "Cobra"/"Demon Skeleton" there, which are also monster names (954
// spawns); the map editor keys creatures by name only, so the Canary scripts
// (server/data/npc/crystalserver/quests/cobra.lua, services/demon_skeleton.lua)
// were renamed and these fixups use the new names.
const NPC_NAME_FIXUPS = {
  'cobra npc': 'Cobra Statue',
  'demon skeleton npc': 'Demon Skeleton Guard',
};

function collect74NpcNames(npcDir) {
  const names = new Map();
  for (const file of fs.readdirSync(npcDir)) {
    if (!file.endsWith('.xml')) continue;
    const m = /<npc[^>]*\sname="([^"]+)"/.exec(fs.readFileSync(path.join(npcDir, file), 'latin1'));
    if (m) names.set(file.slice(0, -4).toLowerCase(), m[1]);
  }
  return names;
}

// Applies MONSTER_NAME_FIXUPS to name="..." attributes inside a raw
// <spawn>...</spawn> block's <monster> children (used for the 36
// standard blocks copied otherwise-verbatim from the source).
function applyNameFixups(blockText) {
  return blockText.replace(/(<monster name=")([^"]*)(")/g, (whole, pre, name, post) => {
    const fixed = MONSTER_NAME_FIXUPS[name.trim().toLowerCase()] || name;
    return pre + fixed + post;
  });
}

// Deterministic offsets for the Nth (0-indexed) of `total` copies, kept
// within `radius` tiles of the center. Single copy stays at the center
// (matches the common amount="1" case and single <monster> semantics).
//
// `seed` (derived from the spawn's own center coordinates) rotates each
// spawn's ring by a different amount, so two nearby <tvpspawn> entries
// with the same amount/radius don't compute identical absolute offsets
// and collide on the same tile -- confirmed happening for real (server
// boot log showed ~3200 "Couldn't spawn monster" pairs on the exact same
// position, same monster name, traced back to two separate spawn blocks
// producing the same x="3" y="0" offset).
function offsetFor(index, total, radius, seed) {
  if (total <= 1) return { x: 0, y: 0 };
  const seedAngle = ((seed % 360) / 360) * 2 * Math.PI;
  const angle = seedAngle + (2 * Math.PI * index) / total;
  const r = Math.max(2, Math.min(radius, 5)); // small ring, not the full radius
  return { x: Math.round(Math.cos(angle) * r), y: Math.round(Math.sin(angle) * r) };
}

function parseAttrs(tagText) {
  const attrs = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(tagText))) attrs[m[1]] = m[2];
  return attrs;
}

function convert(inputPath, outputPath, dryRun) {
  const text = fs.readFileSync(inputPath, 'latin1');
  const lines = text.split(/\r?\n/);

  const standardSpawns = []; // raw <spawn>...</spawn> blocks, copied verbatim
  const tvpEntries = [];

  let i = 0;
  let inStandardSpawn = false;
  let standardBuffer = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('<tvpspawn')) {
      tvpEntries.push(parseAttrs(trimmed));
      i++;
      continue;
    }

    if (trimmed.startsWith('<spawn ') || trimmed === '<spawn>') {
      inStandardSpawn = true;
      standardBuffer = [line];
      i++;
      continue;
    }

    if (inStandardSpawn) {
      standardBuffer.push(line);
      if (trimmed === '</spawn>') {
        standardSpawns.push(applyNameFixups(standardBuffer.join('\n')));
        inStandardSpawn = false;
        standardBuffer = [];
      }
      i++;
      continue;
    }

    i++;
  }

  console.log('standard <spawn> blocks (name-fixed, otherwise verbatim):', standardSpawns.length);
  console.log('<tvpspawn> entries to convert:', tvpEntries.length);

  const npcNames74 = collect74NpcNames(path.join(REPO, '74/npc'));
  const unresolvedNpcs = new Set();

  let monsterCount = 0, npcCount = 0, skipped = 0;
  const convertedBlocks = tvpEntries.map((attrs) => {
    const centerx = attrs.centerx, centery = attrs.centery, centerz = attrs.centerz;
    const radius = attrs.radius || '1';
    if (!centerx || !centery || !centerz) { skipped++; return null; }

    const children = [];
    if (attrs.monstername) {
      const key = attrs.monstername.trim().toLowerCase();
      const fixedName = MONSTER_NAME_FIXUPS[key] || attrs.monstername;
      const amount = Math.max(1, Number(attrs.amount) || 1);
      const spawntime = attrs.spawntime || '60';
      const seed = (Number(centerx) * 7 + Number(centery) * 13 + Number(centerz) * 31) % 360;
      for (let k = 0; k < amount; k++) {
        const off = offsetFor(k, amount, Number(radius), seed);
        children.push(`\t\t<monster name="${escapeXml(fixedName)}" x="${off.x}" y="${off.y}" spawntime="${spawntime}" />`);
        monsterCount++;
      }
    } else if (attrs.npcname) {
      const key = attrs.npcname.trim().toLowerCase();
      const npcName = NPC_NAME_FIXUPS[key] || npcNames74.get(key);
      if (!npcName) unresolvedNpcs.add(attrs.npcname);
      const dirAttr = attrs.direction ? ` direction="${attrs.direction}"` : '';
      children.push(`\t\t<npc name="${escapeXml(npcName || attrs.npcname)}" x="0" y="0"${dirAttr} />`);
      npcCount++;
    } else {
      skipped++;
      return null;
    }

    return `\t<spawn centerx="${centerx}" centery="${centery}" centerz="${centerz}" radius="${radius}">\n${children.join('\n')}\n\t</spawn>`;
  }).filter(Boolean);

  console.log('converted: monsters=', monsterCount, 'npcs=', npcCount, 'skipped (no name attr)=', skipped);
  console.log('npc names without a 74/npc xml or fixup (kept as is):', unresolvedNpcs.size ? [...unresolvedNpcs] : 0);

  const serverNames = collectServerMonsterNames(path.join(REPO, 'server/data/monsters'));
  const usedNames = new Set();
  const nameRe = /<monster name="([^"]*)"/g;
  let nm;
  while ((nm = nameRe.exec([...standardSpawns, ...convertedBlocks].join('\n')))) usedNames.add(nm[1].trim().toLowerCase());
  const unresolved = [...usedNames].filter((n) => !serverNames.has(n));
  console.log('distinct monster names referenced:', usedNames.size, '| unresolved (no matching monster file):', unresolved.length);
  if (unresolved.length) console.log('  ', unresolved);

  const header = '<?xml version="1.0"?>\n<spawns>\n';
  const footer = '\n</spawns>\n';
  const body = [...standardSpawns, ...convertedBlocks].join('\n');
  const output = header + body + footer;

  console.log('output size:', output.length, 'bytes');

  if (dryRun) {
    console.log('Dry run: not writing output file.');
    return;
  }

  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`Wrote ${outputPath}`);
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

if (require.main === module) {
  const [, , inputPath, outputPath, flag] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node convert-spawn.js <map-spawn.xml> <world-spawn.xml> [--dry-run]');
    process.exit(1);
  }
  convert(inputPath, outputPath, flag === '--dry-run');
}

module.exports = { convert };
