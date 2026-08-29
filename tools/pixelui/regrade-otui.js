// Passa as cores CINZA escritas direto nos .otui para a mesma rampa marrom que o
// regrade aplicou nos sprites.
//
// Recolorir so as imagens deixa o trabalho pela metade: o corpo das listas, as
// bordas e boa parte dos fundos sao literais hexadecimais no OTML, nao PNG. Um
// painel marrom com o interior cinza fica pior do que os dois cinza.
//
// Duas rampas, porque os papeis sao diferentes:
//   chrome (background-color, border-color*) -> a mesma rampa dos sprites
//   texto  (color)                           -> texto / dim / placeholder da paleta
//
//   node tools/pixelui/regrade-otui.js <client-dir> [--apply] [--text]
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || 'client';
const apply = process.argv.includes('--apply');
const doText = process.argv.includes('--text');

const RAMP = [
  [0, 0x00, 0x00, 0x00], [26, 0x15, 0x0e, 0x0c], [56, 0x23, 0x18, 0x15],
  [86, 0x33, 0x23, 0x1d], [116, 0x4e, 0x2f, 0x24], [150, 0x9a, 0x66, 0x51],
  [190, 0xc6, 0x8f, 0x66], [255, 0xeb, 0xbf, 0x90],
];

function chromeGrade(l) {
  for (let i = 0; i < RAMP.length - 1; i++) {
    const [l0, r0, g0, b0] = RAMP[i], [l1, r1, g1, b1] = RAMP[i + 1];
    if (l >= l0 && l <= l1) {
      const t = l1 === l0 ? 0 : (l - l0) / (l1 - l0);
      return [Math.round(r0 + (r1 - r0) * t), Math.round(g0 + (g1 - g0) * t), Math.round(b0 + (b1 - b0) * t)];
    }
  }
  return [0xeb, 0xbf, 0x90];
}

// Texto nao interpola: a paleta tem tres papeis e so tres.
function textGrade(l) {
  if (l >= 176) return [0xeb, 0xbf, 0x90];   // texto
  if (l >= 128) return [0xd0, 0xa8, 0x80];   // texto secundario
  if (l >= 96)  return [0xa8, 0x7f, 0x68];   // dim
  return [0x6b, 0x4d, 0x40];                 // placeholder / desabilitado
}

function lum(r, g, b) { return Math.round(0.299 * r + 0.587 * g + 0.114 * b); }
function isGrey(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx - mn <= 12 && mx > 24 && mx < 232;
}
function hex(c) { return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }

function walk(d, acc) {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.otui$/i.test(e.name)) acc.push(p);
  }
  return acc;
}

const PROP = doText
  ? /^(\s*)(background-color|border-color[a-z-]*|color)(\s*:\s*)(#[0-9a-fA-F]{6})(\s*)$/
  : /^(\s*)(background-color|border-color[a-z-]*)(\s*:\s*)(#[0-9a-fA-F]{6})(\s*)$/;

const files = [];
for (const d of ['modules', 'mods', 'data/styles']) walk(path.join(root, d), files);

let touched = 0, fileCount = 0;
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let hit = false;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(PROP);
    if (!m) continue;
    const h = m[4];
    const r = parseInt(h.substr(1, 2), 16), g = parseInt(h.substr(3, 2), 16), b = parseInt(h.substr(5, 2), 16);
    if (!isGrey(r, g, b)) continue;
    const isText = m[2] === 'color';
    const out = hex(isText ? textGrade(lum(r, g, b)) : chromeGrade(lum(r, g, b)));
    if (out === h.toLowerCase()) continue;
    lines[i] = m[1] + m[2] + m[3] + out + m[5];
    touched++; hit = true;
  }
  if (hit) {
    fileCount++;
    if (apply) fs.writeFileSync(file, lines.join('\n'));
  }
}
console.log(`${touched} cores ${apply ? 'trocadas' : 'a trocar'} em ${fileCount} arquivos${doText ? ' (chrome + texto)' : ' (so chrome)'}`);

// --- Lua ---------------------------------------------------------------
// Parte do chrome nao esta no OTML: linha de lista alternada, fundo de tooltip e
// barra de status sao pintados em runtime. Sem isto o interior das listas fica
// cinza dentro de janelas ja marrons.
//
// So `setBackgroundColor`: e a unica chamada em que da para afirmar o papel da
// cor. Os outros ~530 hex cinza em .lua estao em contexto que o script nao sabe
// ler (constantes, cores de estado, cor de mapa) e ficam de fora de proposito.
function walkLua(d, acc) {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkLua(p, acc);
    else if (/\.lua$/i.test(e.name)) acc.push(p);
  }
  return acc;
}

const luaFiles = [];
for (const d of ['modules', 'mods']) walkLua(path.join(root, d), luaFiles);

let luaTouched = 0, luaFileCount = 0;
for (const file of luaFiles) {
  const src = fs.readFileSync(file, 'utf8');
  let hit = false;
  const out = src.split('\n').map(line => {
    if (!/etBackgroundColor/.test(line)) return line;
    return line.replace(/#([0-9a-fA-F]{6})/g, (whole, h) => {
      const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
      if (!isGrey(r, g, b)) return whole;
      const rep = hex(chromeGrade(lum(r, g, b)));
      if (rep === whole.toLowerCase()) return whole;
      luaTouched++; hit = true;
      return rep;
    });
  }).join('\n');
  if (hit) {
    luaFileCount++;
    if (apply) fs.writeFileSync(file, out);
  }
}
console.log(`${luaTouched} fundos ${apply ? 'trocados' : 'a trocar'} em ${luaFileCount} arquivos .lua`);
