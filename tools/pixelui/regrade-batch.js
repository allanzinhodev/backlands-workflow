// Passa para a paleta marrom todos os sprites de chrome que ainda estao cinzas.
//
// Roda o mesmo criterio do palettecheck (a arte antiga e cinza neutro, a nova nao
// e) para decidir o que tocar, cruza com quem ainda referencia o sprite, e so
// entao recolore. Sprite ja reskinado nao entra - passar a rampa nele deslocaria
// as cores que ja estao certas.
//
// Trata so o chrome: moldura, painel, fundo, barra, campo. Icone e arte de jogo
// ficam de fora, porque ali o cinza pode ser intencional.
//
//   node tools/pixelui/regrade-batch.js <client-dir> [--apply]
const fs = require('fs');
const path = require('path');
const { readPNG, writePNG, px, setPx } = require('./pngcodec');

const root = process.argv[2] || 'client';
const apply = process.argv.includes('--apply');

// Botao, seta, checkbox e slider sao chrome tanto quanto moldura e painel. Icone
// de jogo fica de fora: la o cinza pode ser a cor certa.
const CHROME = /(frame|panel|background|window|scroll|separator|textedit|combobox|progress|percent|infopanel|console|boxc|dither|header|tab|border|backdrop|button|arrow|checkbox|slider|rotate|erase|void|topbar|bg|health|mana|cond|chat|channel|menubox|spinbox|slot|hidden-menu|notification|poll)/i;

const RAMP = [
  [0, 0x00, 0x00, 0x00], [26, 0x15, 0x0e, 0x0c], [56, 0x23, 0x18, 0x15],
  [86, 0x33, 0x23, 0x1d], [116, 0x4e, 0x2f, 0x24], [150, 0x9a, 0x66, 0x51],
  [190, 0xc6, 0x8f, 0x66], [255, 0xeb, 0xbf, 0x90],
];

function grade(r, g, b) {
  const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  for (let i = 0; i < RAMP.length - 1; i++) {
    const [l0, r0, g0, b0] = RAMP[i], [l1, r1, g1, b1] = RAMP[i + 1];
    if (l >= l0 && l <= l1) {
      const t = l1 === l0 ? 0 : (l - l0) / (l1 - l0);
      return [Math.round(r0 + (r1 - r0) * t), Math.round(g0 + (g1 - g0) * t), Math.round(b0 + (b1 - b0) * t)];
    }
  }
  return [RAMP[7][1], RAMP[7][2], RAMP[7][3]];
}

function isNeutralGrey(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx - mn <= 12 && mx > 24 && mx < 232;
}

function walk(d, acc, filter) {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc, filter);
    else if (filter(e.name)) acc.push(p);
  }
  return acc;
}

const sources = [];
for (const d of ['modules', 'mods', 'data/styles', 'layouts']) {
  walk(path.join(root, d), sources, n => /\.(otui|lua|otmod)$/i.test(n));
}
const text = sources.map(f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } });

function refCount(ref) {
  let n = 0;
  for (const t of text) {
    let i = 0;
    while ((i = t.indexOf(ref, i)) !== -1) {
      const after = t[i + ref.length];
      if (!after || !/[\w-]/.test(after)) n++;
      i += ref.length;
    }
  }
  return n;
}

let done = 0, skipped = 0;
// Alguns mods trazem a propria arvore de imagens em vez de usar data/images/ui -
// game_cyclopedia sozinho tem 204 PNGs. Sem elas a janela fica com moldura nova
// e miolo cinza.
const IMAGE_ROOTS = [
  'data/images/ui',
  'mods/game_cyclopedia/images',
  'mods/game_proficiency/images',
  'mods/game_forge/images',
  'mods/game_podium_monster/images',
  'mods/game_highscores/images',
  // data/images/game guarda arte de jogo E chrome. So as subpastas que sao chrome
  // entram; o filtro de nome (CHROME) ainda decide dentro delas.
  'data/images/game/topbar',
  'data/images/game/console',
  'data/images/game/entergame',
  'data/images/game/slots',
  'data/images/game/container',
  'data/images/game/containers',
  'data/images/game/combatmodes',
  'data/images/game/actionbar',
  'data/images/game/minimap',
];
const allImages = [];
for (const d of IMAGE_ROOTS) walk(path.join(root, d), allImages, n => n.toLowerCase().endsWith('.png'));

for (const file of allImages) {
  const base = path.basename(file, '.png');
  if (!CHROME.test(base)) continue;

  let img;
  try { img = readPNG(file); } catch (e) { continue; }
  let opaque = 0, g = 0;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const p = px(img, x, y);
      if (p[3] < 8) continue;
      opaque++;
      if (isNeutralGrey(p[0], p[1], p[2])) g++;
    }
  }
  if (opaque < 64 || g / opaque < 0.75) { skipped++; continue; }

  // A .otui referencia por caminho de resource: o que esta em data/ perde o
  // 'data/', o que esta em mods/<x>/images/ perde o 'mods/'.
  let rel = path.relative(root, file).replace(/\\/g, '/').replace(/\.png$/, '');
  rel = rel.startsWith('data/') ? rel.slice(5) : rel.replace(/^mods\//, '');
  const ref = '/' + rel;
  const refs = refCount(ref);
  if (refs === 0) { skipped++; continue; }

  if (apply) {
    for (let y = 0; y < img.h; y++) {
      for (let x = 0; x < img.w; x++) {
        const p = px(img, x, y);
        if (p[3] === 0) continue;
        if (!isNeutralGrey(p[0], p[1], p[2])) continue;   // acento colorido fica
        const [r, gg, b] = grade(p[0], p[1], p[2]);
        setPx(img, x, y, Buffer.from([r, gg, b, p[3]]));
      }
    }
    writePNG(img, file);
  }
  done++;
  console.log(`${apply ? 'RECOLOR' : 'seria  '} ${String(refs).padStart(3)} refs  ${ref}`);
}
console.log(`\n${done} sprites de chrome ${apply ? 'recolorizados' : 'a recolorizar'}; ${skipped} ignorados (ja reskinados ou sem referencia).`);
