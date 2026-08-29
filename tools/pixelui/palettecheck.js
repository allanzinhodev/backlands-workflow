// Quais sprites de UI ainda estao na arte cinza antiga.
//
// A skin nova e marrom/cobre e tem paleta fechada (ver a skill backlands-client-ui).
// A arte antiga do Tibia e cinza dessaturada com ruido. A diferenca e medivel sem
// olhar: num pixel cinza os tres canais sao quase iguais, e a arte nova quase nao
// tem pixel assim fora do preto e do branco puros.
//
//   node tools/pixelui/palettecheck.js <dir> [limiar]
//
// Imprime, por arquivo, a fracao de pixels opacos que sao cinza neutro. Acima do
// limiar (default 0.6) o sprite ainda e o antigo.
const fs = require('fs');
const path = require('path');
const { readPNG, px } = require('./pngcodec');

const dir = process.argv[2];
const limit = parseFloat(process.argv[3] || '0.6');
if (!dir) {
  console.log('usage: node tools/pixelui/palettecheck.js <dir> [limiar]');
  process.exit(1);
}

// Cinza neutro: canais dentro de 12 um do outro, e nem quase-preto nem quase-branco
// (preto e branco puros existem nas duas paletas e nao distinguem nada).
function isNeutralGrey(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn > 12) return false;
  return mx > 24 && mx < 232;
}

function walk(d, acc) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.toLowerCase().endsWith('.png')) acc.push(p);
  }
  return acc;
}

const rows = [];
for (const file of walk(dir, [])) {
  let img;
  try { img = readPNG(file); } catch (e) { continue; }
  let opaque = 0, grey = 0;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const p = px(img, x, y);
      if (p[3] < 8) continue;
      opaque++;
      if (isNeutralGrey(p[0], p[1], p[2])) grey++;
    }
  }
  if (opaque < 64) continue;   // icone minusculo: a amostra nao diz nada
  rows.push({ file, frac: grey / opaque, opaque });
}

rows.sort((a, b) => b.frac - a.frac);
let flagged = 0;
for (const r of rows) {
  if (r.frac < limit) continue;
  flagged++;
  console.log(`${(r.frac * 100).toFixed(0).padStart(3)}%  ${String(r.opaque).padStart(7)}px  ${r.file}`);
}
console.log(`\n${flagged} de ${rows.length} sprites ainda majoritariamente cinza (limiar ${limit * 100}%)`);
