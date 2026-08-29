// Passa um sprite da rampa cinza antiga para a rampa marrom da skin nova.
//
// Isto NAO redesenha nada: mapeia a luminancia de cada pixel por uma rampa de
// cor e mantem o desenho e o ruido onde estao. A arte cinza do Tibia e
// dessaturada, entao a luminancia carrega a forma inteira - borda clara, sombra,
// preenchimento - e trocar so a cor preserva relevo e textura.
//
// Os pontos de controle saem da arte que JA foi reskinada (popupwindow.png):
// #000000, #150e0c, #231815, #33231d, #4e2f24, #9a6651, #c68f66, #ebbf90. Nenhum
// tom novo entra - a paleta e fechada (ver a skill backlands-client-ui).
//
//   node tools/pixelui/regrade.js <in.png> <out.png>
//   node tools/pixelui/regrade.js --check <in.png>     # so imprime o mapeamento
const { readPNG, writePNG, px, setPx } = require('./pngcodec');

// luminancia -> cor da paleta fechada, interpolando entre os pontos
const RAMP = [
  [0,   0x00, 0x00, 0x00],  // ink
  [26,  0x15, 0x0e, 0x0c],  // panel shadow
  [56,  0x23, 0x18, 0x15],  // panel
  [86,  0x33, 0x23, 0x1d],  // panel highlight
  [116, 0x4e, 0x2f, 0x24],  // gold dark
  [150, 0x9a, 0x66, 0x51],  // gold mid
  [190, 0xc6, 0x8f, 0x66],  // gold
  [255, 0xeb, 0xbf, 0x90],  // gold hi
];

function grade(r, g, b) {
  // Rec. 601: e o que casa com a percepcao de brilho da arte original
  const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  for (let i = 0; i < RAMP.length - 1; i++) {
    const [l0, r0, g0, b0] = RAMP[i];
    const [l1, r1, g1, b1] = RAMP[i + 1];
    if (l >= l0 && l <= l1) {
      const t = l1 === l0 ? 0 : (l - l0) / (l1 - l0);
      return [
        Math.round(r0 + (r1 - r0) * t),
        Math.round(g0 + (g1 - g0) * t),
        Math.round(b0 + (b1 - b0) * t),
      ];
    }
  }
  const last = RAMP[RAMP.length - 1];
  return [last[1], last[2], last[3]];
}

const args = process.argv.slice(2);
if (args[0] === '--check') {
  console.log(' L   ->  cor');
  for (let l = 0; l <= 255; l += 15) {
    const [r, g, b] = grade(l, l, l);
    console.log(String(l).padStart(3) + '  ->  #' +
      [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''));
  }
  process.exit(0);
}

const [inFile, outFile] = args;
if (!inFile || !outFile) {
  console.log('usage: node tools/pixelui/regrade.js <in.png> <out.png>');
  console.log('       node tools/pixelui/regrade.js --check <in.png>');
  process.exit(1);
}

const img = readPNG(inFile);
let changed = 0;
for (let y = 0; y < img.h; y++) {
  for (let x = 0; x < img.w; x++) {
    const p = px(img, x, y);
    if (p[3] === 0) continue;
    const [r, g, b] = grade(p[0], p[1], p[2]);
    if (r !== p[0] || g !== p[1] || b !== p[2]) changed++;
    setPx(img, x, y, Buffer.from([r, g, b, p[3]]));
  }
}
writePNG(img, outFile);   // pngcodec assina (img, file)
console.log(`${outFile}  ${img.w}x${img.h}  ${changed} pixels recolorizados`);
