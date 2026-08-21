'use strict';
// Monta e desmonta a folha PNG.
//
// A folha e uma grade exata de celulas de 32x32, sem margem: cada bloco e um
// frame da animacao, e os blocos se repetem lado a lado (ou empilhados, com
// frameLayout: "vertical"). No Aseprite: Import Sprite Sheet com o tamanho do
// bloco, e View > Grid Settings 32x32 para desenhar tile a tile.

const fs = require('fs');
const crypto = require('crypto');
const { PNG } = require('pngjs');

const { CELL, getLayout } = require('./layout');
const { spriteFramesOf } = require('./workspace');

const CELL_BYTES = CELL * CELL * 4;

// --------------------------------------------------------------- pixels

/**
 * Deixa o RGBA no mesmo espaco que o .spr guarda: sem alpha parcial e com o
 * transparente zerado nos quatro canais (e assim que spr.js::encode reconhece
 * transparencia). Devolve tambem o que precisou ser corrigido.
 */
function normalize(rgba, options = {}) {
  const out = Buffer.from(rgba);
  let partialAlpha = 0;
  let magenta = 0;

  for (let p = 0; p < out.length; p += 4) {
    const a = out[p + 3];
    const isMagenta = out[p] === 0xFF && out[p + 1] === 0x00 && out[p + 2] === 0xFF;

    if (a === 0 || (options.magentaAsAlpha && isMagenta && a === 0xFF)) {
      out[p] = 0; out[p + 1] = 0; out[p + 2] = 0; out[p + 3] = 0;
      continue;
    }
    if (a < 0xFF) { partialAlpha++; out[p + 3] = 0xFF; }
    if (isMagenta) magenta++;
  }

  return { data: out, partialAlpha, magenta };
}

function hash(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
}

function isBlank(rgba) {
  for (let i = 0; i < rgba.length; i++) if (rgba[i] !== 0) return false;
  return true;
}

// --------------------------------------------------------------- resolucao

/**
 * Resolve os tiles do spec: ServerID -> ClientID -> sprite ids por frame,
 * e a posicao de cada um na grade.
 */
function resolveTiles(spec, assets) {
  const layout = getLayout(spec.layout);
  const warnings = [];
  const placed = [];
  const extras = [];
  const seenSprites = new Map(); // primeiro sprite id -> tile que ficou com a celula

  for (const entry of spec.tiles) {
    const serverId = entry.serverId;
    const clientId = entry.clientId || assets.mapping.serverToClient.get(serverId);

    if (!clientId) {
      warnings.push(`ServerID ${serverId} nao tem ClientID no items.otb — fora da folha`);
      continue;
    }

    const resolved = spriteFramesOf(assets, clientId);
    if (!resolved) {
      warnings.push(`ClientID ${clientId} (ServerID ${serverId}) nao existe no Tibia.dat — fora da folha`);
      continue;
    }

    const g = resolved.group;
    if (g.width !== 1 || g.height !== 1 || g.layers !== 1 || g.patternX !== 1 || g.patternY !== 1 || g.patternZ !== 1) {
      warnings.push(`ServerID ${serverId} tem geometria ${g.width}x${g.height} layers=${g.layers} pattern=${g.patternX}/${g.patternY}/${g.patternZ} — a folha so trata 1x1 sem camadas nem padroes`);
      continue;
    }

    const tile = {
      slot: entry.slot || null,
      label: entry.label || entry.slot || 'item',
      serverId,
      clientId,
      frames: resolved.frames.map((ids) => ids[0]),
      frameCount: g.frames,
      animation: g.animation,
      row: entry.row,
      col: entry.col,
    };

    const key = tile.frames[0];
    if (seenSprites.has(key)) {
      const owner = seenSprites.get(key);
      tile.duplicateOf = owner.serverId;
      warnings.push(`ServerID ${serverId} usa os mesmos sprites de ${owner.serverId} (spr ${key}) — sem celula propria`);
      continue;
    }
    seenSprites.set(key, tile);

    const slotPos = tile.slot && layout.slots[tile.slot];
    if (Number.isInteger(tile.row) && Number.isInteger(tile.col)) placed.push(tile);
    else if (slotPos) { tile.row = slotPos[0]; tile.col = slotPos[1]; placed.push(tile); }
    else extras.push(tile);
  }

  // Extras entram em linhas abaixo da ilha, da esquerda para a direita.
  extras.forEach((tile, i) => {
    tile.row = layout.rows + Math.floor(i / layout.cols);
    tile.col = i % layout.cols;
    placed.push(tile);
  });

  const extraRows = Math.ceil(extras.length / layout.cols);
  const frameCount = placed.reduce((max, t) => Math.max(max, t.frameCount), 1);

  return { layout, tiles: placed, warnings, extraRows, frameCount };
}

/** Geometria da folha + a lista completa de celulas (tile x frame). */
function buildPlan(spec, assets) {
  const resolved = resolveTiles(spec, assets);
  const { layout, tiles, extraRows, frameCount } = resolved;

  const blockCols = layout.cols;
  const blockRows = layout.rows + extraRows;
  const blockW = blockCols * CELL;
  const blockH = blockRows * CELL;
  const vertical = spec.frameLayout === 'vertical';

  const geometry = {
    layout: layout.name,
    frameLayout: vertical ? 'vertical' : 'horizontal',
    frames: frameCount,
    cell: CELL,
    blockCols, blockRows, blockWidth: blockW, blockHeight: blockH,
    width: vertical ? blockW : blockW * frameCount,
    height: vertical ? blockH * frameCount : blockH,
  };

  const ground = tiles.find((t) => t.slot === 'ground');
  const cells = [];

  for (let f = 0; f < frameCount; f++) {
    const originX = vertical ? 0 : f * blockW;
    const originY = vertical ? f * blockH : 0;

    const push = (tile, row, col, context) => {
      const spriteId = tile.frames[f % tile.frameCount];
      cells.push({
        frame: f, row, col, context: !!context,
        slot: tile.slot, label: tile.label,
        serverId: tile.serverId, clientId: tile.clientId, spriteId,
        x: originX + col * CELL, y: originY + row * CELL,
      });
    };

    for (const tile of tiles) push(tile, tile.row, tile.col, false);
    if (ground) for (const [row, col] of layout.groundContext) push(ground, row, col, true);
  }

  return { ...resolved, geometry, cells };
}

// --------------------------------------------------------------- PNG

function readCell(png, x, y) {
  const cell = Buffer.alloc(CELL_BYTES);
  for (let row = 0; row < CELL; row++) {
    const src = ((y + row) * png.width + x) * 4;
    png.data.copy(cell, row * CELL * 4, src, src + CELL * 4);
  }
  return cell;
}

function writeCell(png, x, y, rgba) {
  for (let row = 0; row < CELL; row++) {
    const dst = ((y + row) * png.width + x) * 4;
    rgba.copy(png.data, dst, row * CELL * 4, (row + 1) * CELL * 4);
  }
}

/** Escreve a folha lendo os pixels direto do .spr. */
function writeSheet(filePath, plan, spr) {
  const png = new PNG({ width: plan.geometry.width, height: plan.geometry.height });
  png.data.fill(0);

  const cache = new Map();
  for (const cell of plan.cells) {
    if (!cell.spriteId) continue;
    let rgba = cache.get(cell.spriteId);
    if (!rgba) { rgba = spr.readRGBA(cell.spriteId); cache.set(cell.spriteId, rgba); }
    writeCell(png, cell.x, cell.y, rgba);
    cell.hash = hash(rgba);
  }

  fs.writeFileSync(filePath, PNG.sync.write(png));
  return png;
}

/** Le a folha editada e devolve o RGBA normalizado de cada celula. */
function readSheet(filePath, plan, options = {}) {
  const png = PNG.sync.read(fs.readFileSync(filePath));
  const { width, height } = plan.geometry;

  if (png.width !== width || png.height !== height) {
    throw new Error(
      `a folha tem ${png.width}x${png.height} e o esperado e ${width}x${height}. ` +
      'Nao redimensione a imagem — o corte em celulas de 32x32 depende disso.'
    );
  }

  let partialAlpha = 0;
  let magenta = 0;
  const cells = plan.cells.map((cell) => {
    const raw = readCell(png, cell.x, cell.y);
    const norm = normalize(raw, options);
    partialAlpha += norm.partialAlpha;
    magenta += norm.magenta;
    return { ...cell, data: norm.data, hash: hash(norm.data) };
  });

  return { cells, partialAlpha, magenta };
}

/**
 * Regrava na folha as celulas dos sprites indicados.
 *
 * Um mesmo sprite id aparece em mais de uma celula por dois motivos: as copias
 * de contexto do chao, e animacoes que reusam o mesmo desenho em frames
 * diferentes. Depois de gravar no .spr, essas outras celulas ainda mostram o
 * desenho antigo — e, na rodada seguinte, apareceriam como "alteracao" de volta
 * ao que era. Sincronizar aqui e o que mantem a folha coerente.
 *
 * @param {Map<number, Buffer>} updates  sprite id -> RGBA aplicado
 * @returns {number} celulas regravadas
 */
function syncSheet(filePath, cells, updates) {
  if (updates.size === 0) return 0;
  const png = PNG.sync.read(fs.readFileSync(filePath));
  let touched = 0;

  for (const cell of cells) {
    const rgba = updates.get(cell.spriteId);
    if (!rgba) continue;
    if (cell.hash && cell.hash === hash(rgba)) continue; // ja esta com o desenho novo
    writeCell(png, cell.x, cell.y, rgba);
    touched++;
  }

  if (touched) fs.writeFileSync(filePath, PNG.sync.write(png));
  return touched;
}

module.exports = {
  CELL, CELL_BYTES, normalize, hash, isBlank,
  resolveTiles, buildPlan, writeSheet, readSheet, syncSheet, readCell, writeCell,
};
