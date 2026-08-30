// Recoloriza os sprites que o CLIENTE diz usar, nao os que a pasta contem.
//
// regrade-batch.js decide por lista de pastas mais referencia no fonte, e erra
// dos dois lados: nao ve caminho montado em runtime
// (setImageSource("/images/topbuttons/%s.png", v)) e recoloriza arte morta que so
// aparece num comentario. `tools/imgsources.lua` percorre a arvore de widgets do
// cliente com tudo aberto e devolve exatamente o que esta preso a um widget. Este
// script consome essa lista.
//
//   node tools/pixelui/regrade-live.js <lista.txt> <client-dir> [--apply]
//
// A lista e a saida crua do driver: uma linha de resumo e depois um caminho de
// resource por linha.
const fs = require('fs');
const path = require('path');
const { readPNG, writePNG, px, setPx } = require('./pngcodec');

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
  return [0xeb, 0xbf, 0x90];
}

function isNeutralGrey(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx - mn <= 12 && mx > 24 && mx < 232;
}

// O nome do sprite as vezes E a semantica: um icone chamado `-grey`, `white` ou
// `-color` esta cinza de proposito - estado desligado, chave de cor, marcador de
// condicao do jogador. Passar a rampa neles apaga a informacao, nao a skin.
const SEMANTICO = /(grey|gray|white|color|colour)/i;
// ...menos onde "grey" descreve a placa da skin ANTIGA e nao um estado. Sao dois
// fundos de botao. button-blessings-grey-idle fica de fora de proposito: ali o
// cinza e o estado ocioso ao lado de uma variante colorida.
const PLACA_ANTIGA = /^(button-grey-up|button-verydarkgrey-down)$/i;
// Modo de combate e estado do jogador tem a mesma armadilha em pasta inteira:
// redfistmode, whitehandmode e whitedovemode sao o mesmo desenho em cores que
// significam coisas diferentes, e o jogador le a cor, nao a forma.
const EXCLUIDOS = /images\/game\/(combatmodes|states)\//i;

const listaPath = process.argv[2];
const root = process.argv[3] || 'client';
const apply = process.argv.includes('--apply');
if (!listaPath) {
  console.error('uso: node regrade-live.js <lista.txt> <client-dir> [--apply]');
  process.exit(1);
}

const refs = fs.readFileSync(listaPath, 'utf8').split('\n')
  .map(s => s.trim().replace(/\r$/, ''))
  .filter(s => s.startsWith('/'));

let feitos = 0, pulados = 0, semantico = 0, jaOk = 0;
for (const ref of refs) {
  // O cliente devolve o caminho de resource, que tem tres formas. `/images/x` e
  // `/data/images/x` sao a mesma coisa e vivem em data/. Mas alguns mods trazem a
  // propria arvore e o resource sai como `/mods/game_cyclopedia/images/...`, que
  // NAO esta em data/ - tratar tudo igual mandava 70 sprites para "sem arquivo",
  // entre eles a faixa de abas e os rotulos assados do Cyclopedia.
  const file = ref.startsWith('/mods/')
    ? path.join(root, ref.slice(1) + '.png')
    : path.join(root, 'data', ref.replace(/^\/data\//, '').replace(/^\//, '') + '.png');
  if (!fs.existsSync(file)) { pulados++; continue; }

  const nome = path.basename(file, '.png');
  if ((SEMANTICO.test(nome) && !PLACA_ANTIGA.test(nome)) || EXCLUIDOS.test(ref)) { semantico++; continue; }

  let img;
  try { img = readPNG(file); } catch (e) { pulados++; continue; }
  let opaco = 0, cinza = 0;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const p = px(img, x, y);
      if (p[3] < 8) continue;
      opaco++;
      if (isNeutralGrey(p[0], p[1], p[2])) cinza++;
    }
  }
  if (opaco < 64 || cinza / opaco < 0.6) { jaOk++; continue; }

  if (apply) {
    for (let y = 0; y < img.h; y++) {
      for (let x = 0; x < img.w; x++) {
        const p = px(img, x, y);
        if (p[3] === 0) continue;
        if (!isNeutralGrey(p[0], p[1], p[2])) continue;   // acento colorido fica
        const [r, g, b] = grade(p[0], p[1], p[2]);
        setPx(img, x, y, Buffer.from([r, g, b, p[3]]));
      }
    }
    writePNG(img, file);
  }
  feitos++;
  console.log(`${apply ? 'RECOLOR' : 'seria  '} ${(cinza / opaco * 100).toFixed(0).padStart(3)}%  ${ref}`);
}
console.log(`\n${feitos} sprites vivos ${apply ? 'recolorizados' : 'a recolorizar'}; ` +
  `${jaOk} ja na paleta, ${semantico} onde o cinza e a informacao, ${pulados} sem arquivo.`);
