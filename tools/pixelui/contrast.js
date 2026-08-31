// Texto que nao da para ler porque nao contrasta com o fundo.
//
// A auditoria de geometria diz onde o texto cai; nao diz se ele APARECE. Texto
// sem contraste e pior que texto cortado - o cortado ainda mostra metade, o sem
// contraste some inteiro. Aconteceu com "Sell All" quando o botao ganhou a placa
// escura `/images/ui/buttons-blue` e manteve a tinta escura que o estilo `Button`
// pinta para a placa dourada: nenhuma das cinco checagens de geometria viu, e a
// unica prova foi uma captura ampliada.
//
// A prova esta nos pixels: uma caixa de texto legivel tem duas populacoes de
// luminancia (glifo e fundo) separadas. Se toda a caixa cabe numa faixa estreita,
// nao ha glifo visivel ali.
//
//   node tools/pixelui/contrast.js <shot.png> <caixas.txt> [minimo]
//
// caixas.txt e a saida de tools/uiboxes.lua: "x y w h|caminho|texto" por linha.
const { readPNG, px } = require('./pngcodec');
const fs = require('fs');

const shot = process.argv[2];
const lista = process.argv[3];
const minimo = Number(process.argv[4] || 40);
if (!shot || !lista) {
  console.error('uso: node contrast.js <shot.png> <caixas.txt> [minimo]');
  process.exit(1);
}

const img = readPNG(shot);
const linhas = fs.readFileSync(lista, 'utf8').split('\n')
  .map(s => s.trim()).filter(s => /^\d+ \d+ \d+ \d+\|/.test(s));

const achados = [];
let medidas = 0;

for (const linha of linhas) {
  const [geo, caminho, texto] = linha.split('|');
  const [x, y, w, h] = geo.split(' ').map(Number);
  if (x < 0 || y < 0 || x + w > img.w || y + h > img.h) continue;

  // O percentil corta o outlier: uma borda de 1px do widget dentro da caixa
  // inventaria contraste que o texto nao tem.
  const lums = [];
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const p = px(img, i, j);
      if (p[3] < 8) continue;
      lums.push(Math.round(0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]));
    }
  }
  if (lums.length < 32) continue;
  medidas++;
  lums.sort((a, b) => a - b);
  const p5 = lums[Math.floor(lums.length * 0.05)];
  const p95 = lums[Math.floor(lums.length * 0.95)];
  const faixa = p95 - p5;
  if (faixa < minimo) {
    achados.push(`${String(faixa).padStart(3)}  ${caminho}  "${texto}"`);
  }
}

if (achados.length === 0) {
  console.log(`${medidas} caixas de texto medidas, todas com contraste >= ${minimo}`);
} else {
  console.log(`${medidas} caixas medidas, ${achados.length} sem contraste (faixa p5-p95 < ${minimo}):`);
  console.log(achados.join('\n'));
}
