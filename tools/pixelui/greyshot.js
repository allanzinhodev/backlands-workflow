// Onde ainda aparece a skin velha, medido na tela e nao no disco.
//
// palettecheck.js varre arquivos, e por arquivo a resposta engana: `data/images`
// tem 836 sprites majoritariamente cinza, mas a maioria e arte de conteudo (icone
// de item, retrato de criatura, pagina de wiki) que deve continuar colorida, e
// muitos nem sao desenhados. O que importa e o que o jogador ve.
//
// Cinza neutro (r~g~b) e a assinatura da skin antiga: a paleta fechada do
// Backlands nao tem nenhum tom neutro, e arte de conteudo raramente tem area
// grande de cinza exato. Entao a fracao de pixel neutro numa captura de janela e
// uma medida direta de quanto daquela tela ficou para tras.
const { readPNG, px } = require('./pngcodec');
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) { console.error('uso: node greyshot.js <dir-de-capturas> [tolerancia]'); process.exit(1); }
const tol = Number(process.argv[3] || 6);

const linhas = [];
for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.png'))) {
  const img = readPNG(path.join(dir, f));
  let neutro = 0, total = 0;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const [r, g, b, a] = px(img, x, y);
      if (a < 8) continue;
      total++;
      // preto e branco puros nao contam: sao borda e realce legitimos da paleta
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn <= tol && mx > 24 && mn < 232) neutro++;
    }
  }
  if (!total) continue;
  linhas.push({ f, pct: neutro / total, neutro });
}

linhas.sort((a, b) => b.pct - a.pct);
for (const l of linhas) {
  console.log(`${(l.pct * 100).toFixed(1).padStart(5)}%  ${String(l.neutro).padStart(8)}px  ${l.f}`);
}
const sujas = linhas.filter(l => l.pct >= 0.02).length;
console.log(`\n${sujas} de ${linhas.length} capturas com 2% ou mais de cinza neutro`);
