// Procura dois fundos que o olho le como um so.
//
// As varreduras existentes medem TEXTO: uicontrast.ps1 pergunta se o glifo
// aparece contra o fundo dele, uisweep/uideep medem geometria. Nenhuma compara
// duas faixas de FUNDO entre si. O defeito que escapa por essa fresta e a lista
// zebrada cujas linhas alternam #281b17 e #2c1e19 - 4 unidades de luminancia, a
// alternancia simplesmente nao existe na tela - e a linha selecionada pintada
// #35241d contra linhas #2c1e19, que some do mesmo jeito. As duas passaram
// limpas nas cinco varreduras e so apareceram medindo uma coluna a mao.
//
// O teste: pegue as cores que cobrem area relevante da janela, olhe so os pares
// que de fato se TOCAM (compartilham fronteira de pixel) e reclame quando a
// diferenca de luminancia entre elas for pequena demais para ser percebida.
//
//   node bgcontrast.js <shot.png> [--min-area 1.5] [--delta 10]
//   node bgcontrast.js <pasta-de-recortes> [...]
//
// --min-area  % da imagem que uma cor precisa cobrir para contar como fundo
// --delta     diferenca de luminancia abaixo da qual o par e indistinguivel
const fs = require('fs');
const path = require('path');
const { readPNG, hex } = require('./pngcodec');

// Rec. 709: o olho pesa verde muito mais que azul, e media aritmetica mente.
const luma = c => 0.2126 * parseInt(c.slice(1, 3), 16)
               + 0.7152 * parseInt(c.slice(3, 5), 16)
               + 0.0722 * parseInt(c.slice(5, 7), 16);

function analisa(file, minArea, delta) {
  const img = readPNG(file);
  const total = img.w * img.h;
  const grid = new Array(img.h);
  const area = {};
  for (let y = 0; y < img.h; y++) {
    grid[y] = new Array(img.w);
    for (let x = 0; x < img.w; x++) {
      const c = hex(img, x, y);
      grid[y][x] = c;
      area[c] = (area[c] || 0) + 1;
    }
  }

  // so cores com area de fundo; texto e detalhe ficam de fora por serem pequenos
  const fundos = Object.keys(area).filter(c => c !== 'clear' && 100 * area[c] / total >= minArea);

  // fronteira compartilhada: quantos pixels de A encostam em B (4-vizinhos)
  const toca = {};
  const par = (a, b) => a < b ? a + '|' + b : b + '|' + a;
  const ehFundo = new Set(fundos);
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      const a = grid[y][x];
      if (!ehFundo.has(a)) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= img.w || ny >= img.h) continue;
        const b = grid[ny][nx];
        if (b === a || !ehFundo.has(b)) continue;
        const k = par(a, b);
        toca[k] = (toca[k] || 0) + 1;
      }
    }

  const achados = [];
  for (const [k, n] of Object.entries(toca)) {
    const [a, b] = k.split('|');
    const d = Math.abs(luma(a) - luma(b));
    if (d >= delta) continue;
    // fronteira curta e so um detalhe encostando; nao e duas faixas de fundo
    if (n < 24) continue;
    // Halo de antialias nao e fundo: ele abraca cada glifo, entao a fronteira e
    // enorme para a area que ocupa. Faixa de fundo e o contrario - muita area,
    // pouca borda. Sem este corte a ferramenta reclama de todo texto da tela.
    const menor = Math.min(area[a], area[b]);
    if (n / menor > 0.15) continue;
    achados.push({ a, b, d, n, aPct: 100 * area[a] / total, bPct: 100 * area[b] / total });
  }
  achados.sort((x, y) => x.d - y.d);
  return { img, total, achados };
}

const args = process.argv.slice(2);
const alvo = args[0];
const opt = (nome, def) => {
  const i = args.indexOf('--' + nome);
  return i === -1 ? def : parseFloat(args[i + 1]);
};
if (!alvo) {
  console.error('uso: node bgcontrast.js <shot.png|pasta> [--min-area 1.5] [--delta 10]');
  process.exit(2);
}
const minArea = opt('min-area', 1.5);
const delta = opt('delta', 10);

const arquivos = fs.statSync(alvo).isDirectory()
  ? fs.readdirSync(alvo).filter(f => f.endsWith('.png')).sort().map(f => path.join(alvo, f))
  : [alvo];

let comProblema = 0;
for (const f of arquivos) {
  let r;
  try { r = analisa(f, minArea, delta); } catch (e) { console.log(`${path.basename(f)}: ${e.message}`); continue; }
  if (!r.achados.length) continue;
  comProblema++;
  console.log(`\n${path.basename(f)}  ${r.img.w}x${r.img.h}`);
  for (const a of r.achados)
    console.log(`  ${a.a} (${a.aPct.toFixed(1)}%) vs ${a.b} (${a.bPct.toFixed(1)}%)`
      + `  luma ${a.d.toFixed(1)}  fronteira ${a.n}px`);
}
console.log(`\n${arquivos.length} imagem(ns), ${comProblema} com fundos indistinguiveis`
  + ` (area >= ${minArea}%, luma < ${delta})`);
