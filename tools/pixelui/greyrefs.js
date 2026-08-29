// Cruza os sprites que ainda estao na arte cinza antiga com quem os referencia,
// para saber por onde comecar a redesenhar.
//
// Sozinho, o palettecheck diz que 260 de 412 sprites ainda sao cinza - numero
// grande demais para virar plano. O que importa e quais deles alguma tela ainda
// desenha, e quantas vezes. Um sprite cinza que ninguem referencia e lixo; um
// referenciado 40 vezes aparece em 40 lugares.
//
//   node tools/pixelui/greyrefs.js <client-dir> [limiar]
const fs = require('fs');
const path = require('path');
const { readPNG, px } = require('./pngcodec');

const root = process.argv[2] || 'client';
const limit = parseFloat(process.argv[3] || '0.75');

function isNeutralGrey(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn > 12) return false;
  return mx > 24 && mx < 232;
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

// 1. quais sprites de UI ainda sao cinza
const grey = [];
for (const file of walk(path.join(root, 'data/images/ui'), [], n => n.toLowerCase().endsWith('.png'))) {
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
  if (opaque < 64 || g / opaque < limit) continue;
  // caminho como as .otui escrevem: /images/ui/<...> sem extensao
  const rel = path.relative(path.join(root, 'data'), file).replace(/\\/g, '/').replace(/\.png$/, '');
  grey.push({ file, ref: '/' + rel, name: path.basename(file, '.png') });
}

// 2. quem referencia cada um
const sources = [];
for (const d of ['modules', 'mods', 'data/styles', 'layouts']) {
  walk(path.join(root, d), sources, n => /\.(otui|lua|otmod)$/i.test(n));
}
const text = sources.map(f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } });

for (const s of grey) {
  let n = 0;
  const needle = s.ref;
  for (const t of text) {
    let i = 0;
    while ((i = t.indexOf(needle, i)) !== -1) {
      // '/images/ui/button' nao pode contar '/images/ui/button-grey-up'
      const after = t[i + needle.length];
      if (!after || !/[\w-]/.test(after)) n++;
      i += needle.length;
    }
  }
  s.refs = n;
}

grey.sort((a, b) => b.refs - a.refs);
const used = grey.filter(s => s.refs > 0);
const dead = grey.length - used.length;

console.log('REFS  SPRITE');
console.log('-'.repeat(70));
for (const s of used) console.log(String(s.refs).padStart(4) + '  ' + s.ref);
console.log('');
console.log(`${used.length} sprites cinza ainda referenciados; ${dead} cinza sem nenhuma referencia.`);
