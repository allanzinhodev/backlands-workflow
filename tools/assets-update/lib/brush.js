'use strict';
// Leitura dos brushes do NexaMap (mapeditor/data/860/*.xml).
//
// Um brush de ground cita ServerIDs em dois lugares:
//   <item id="..." chance="..."/>   os chaos em si
//   <border align="outer" id="174"/> referencia a um bloco do borders.xml, que
//                                    lista <borderitem edge="n" item="10114"/>
//
// Parser proprio e proposital: sao 4 XMLs pequenos e o formato e estavel; puxar
// uma dependencia de XML para ler <brush>/<borderitem> nao se paga.

const fs = require('fs');
const path = require('path');
const { MAPEDITOR_DATA } = require('./workspace');

// Ordem em que o materials.xml inclui os arquivos de brush.
const BRUSH_FILES = ['grounds.xml', 'borders.xml', 'walls.xml', 'doodads.xml', 'materials.xml'];

function readAttrs(rawAttrs) {
  const attrs = {};
  const re = /([\w-]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(rawAttrs)) !== null) attrs[m[1]] = m[2];
  return attrs;
}

/** Recorta o bloco <tag ...> ... </tag> que comeca em startIndex. */
function sliceBlock(xml, startIndex, tag) {
  const tagEnd = xml.indexOf('>', startIndex);
  if (tagEnd === -1) return null;
  if (xml[tagEnd - 1] === '/') return xml.slice(startIndex, tagEnd + 1); // self-closing
  const close = xml.indexOf(`</${tag}>`, tagEnd);
  if (close === -1) return null;
  return xml.slice(startIndex, close + tag.length + 3);
}

function findBrush(name) {
  for (const file of BRUSH_FILES) {
    const full = path.join(MAPEDITOR_DATA, file);
    if (!fs.existsSync(full)) continue;

    const xml = fs.readFileSync(full, 'utf8');
    const re = /<brush\s+([^>]*)>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const attrs = readAttrs(m[1]);
      if (attrs.name !== name) continue;
      return { file, attrs, block: sliceBlock(xml, m.index, 'brush') || '' };
    }
  }
  return null;
}

/** Nomes parecidos, para a mensagem de erro. */
function suggestBrushes(name) {
  const needle = String(name || '').toLowerCase();
  const found = [];
  for (const file of BRUSH_FILES) {
    const full = path.join(MAPEDITOR_DATA, file);
    if (!fs.existsSync(full)) continue;
    const xml = fs.readFileSync(full, 'utf8');
    const re = /<brush\s+([^>]*)>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const attrs = readAttrs(m[1]);
      if (attrs.name && attrs.name.toLowerCase().includes(needle)) {
        found.push(`${attrs.name}  (${file}, type=${attrs.type || '?'})`);
      }
    }
  }
  return found;
}

/** <border id="N"> do borders.xml -> [{ edge, serverId }] */
function loadBorder(borderId) {
  const full = path.join(MAPEDITOR_DATA, 'borders.xml');
  const xml = fs.readFileSync(full, 'utf8');
  const re = /<border\s+([^>]*)>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = readAttrs(m[1]);
    if (attrs.id !== String(borderId)) continue;

    const block = sliceBlock(xml, m.index, 'border') || '';
    const items = [];
    const itemRe = /<borderitem\s+([^>]*?)\/?>/g;
    let im;
    while ((im = itemRe.exec(block)) !== null) {
      const ia = readAttrs(im[1]);
      if (ia.item) items.push({ edge: ia.edge || '?', serverId: parseInt(ia.item, 10) });
    }
    return items;
  }
  return [];
}

// Tags que carregam um ServerID dentro de um brush que nao e de ground.
const ITEM_TAGS = new Set(['item', 'carpet', 'wall', 'table', 'door']);

/**
 * Descreve um brush: chaos, bordas e o resto dos itens citados.
 * @returns {{name,file,type,lookid,grounds,borders,others}}
 */
function describeBrush(name) {
  const brush = findBrush(name);
  if (!brush) {
    const hints = suggestBrushes(name);
    const extra = hints.length ? `\nTalvez seja um destes:\n  ${hints.slice(0, 10).join('\n  ')}` : '';
    throw new Error(`brush "${name}" nao encontrado em ${MAPEDITOR_DATA}.${extra}`);
  }

  const block = brush.block;
  const grounds = [];
  const borders = [];
  const others = [];
  const seenBorderIds = new Set();

  // <border align="outer" id="174"/> — o mesmo id pode aparecer duas vezes
  // (uma com to="none"); a lista de pecas e a mesma.
  const borderRe = /<border\s+([^>]*?)\/?>/g;
  let bm;
  while ((bm = borderRe.exec(block)) !== null) {
    const attrs = readAttrs(bm[1]);
    if (!attrs.id) continue;
    const id = parseInt(attrs.id, 10);
    if (seenBorderIds.has(id)) continue;
    seenBorderIds.add(id);
    borders.push({ id, align: attrs.align || 'outer', to: attrs.to || null, items: loadBorder(id) });
  }

  // Filhos diretos <item id chance/> sao os chaos do brush de ground.
  const itemRe = /<item\s+([^>]*?)\/?>/g;
  let im;
  while ((im = itemRe.exec(block)) !== null) {
    const attrs = readAttrs(im[1]);
    if (!attrs.id) continue;
    const serverId = parseInt(attrs.id, 10);
    const entry = { serverId, chance: attrs.chance ? parseInt(attrs.chance, 10) : null };
    if (brush.attrs.type === 'ground') grounds.push(entry);
    else others.push({ serverId, label: 'item' });
  }

  // Brushes que nao sao de ground guardam o id na propria tag (wall/carpet/...).
  if (brush.attrs.type !== 'ground') {
    const tagRe = /<(\w+)([^>]*?)\/?>/g;
    let tm;
    while ((tm = tagRe.exec(block)) !== null) {
      const tag = tm[1].toLowerCase();
      if (tag === 'item' || tag === 'brush' || tag === 'border' || !ITEM_TAGS.has(tag)) continue;
      const attrs = readAttrs(tm[2]);
      if (!attrs.id) continue;
      others.push({ serverId: parseInt(attrs.id, 10), label: `${tag}-${attrs.align || attrs.type || ''}`.replace(/-$/, '') });
    }
  }

  return {
    name,
    file: brush.file,
    type: brush.attrs.type || null,
    lookid: brush.attrs.lookid ? parseInt(brush.attrs.lookid, 10) : null,
    grounds,
    borders,
    others,
  };
}

module.exports = { describeBrush, findBrush, suggestBrushes, loadBorder, readAttrs, BRUSH_FILES };
