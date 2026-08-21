'use strict';
// Teste de aceite do gravador. Roda sobre um .spr sintetico no diretorio
// temporario — nao encosta nos assets do cliente.
//
//   node tools/assets-update/selftest.js
//
// 1) LEITURA        — SprFile devolve os mesmos pixels que o codec de referencia.
// 2) GRAVACAO       — trocar um sprite muda so aquele sprite.
// 3) LEITOR EXTERNO — tools/sprites/spr.js le o arquivo gravado e concorda.
// 4) REVERT         — writeRaw com os bytes anteriores devolve o estado exato.
// 5) VAZIO          — sprite todo transparente vira endereco 0.
// 6) FOLHA          — cortar a PNG devolve exatamente os pixels que entraram.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { PNG } = require('pngjs');

const codec = require('../sprites/spr');
const { SprFile } = require('./lib/sprfile');
const sheetLib = require('./lib/sheet');

const FEATURES = { extended: true, transparency: false };
const COUNT = 8;

let failures = 0;
const check = (label, ok, detail) => {
  console.log((ok ? '  OK   ' : '  FALHOU ') + label + (detail ? ' — ' + detail : ''));
  if (!ok) failures++;
};

/** Padrao deterministico e reconhecivel por sprite. */
function makeSprite(seed) {
  const rgba = Buffer.alloc(codec.SPRITE_PIXEL_COUNT * 4);
  for (let i = 0; i < codec.SPRITE_PIXEL_COUNT; i++) {
    const p = i * 4;
    if ((i + seed) % 7 === 0) continue; // buraco transparente
    rgba[p] = (i * 3 + seed * 31) & 0xFF;
    rgba[p + 1] = (i * 5 + seed * 17) & 0xFF;
    rgba[p + 2] = (i * 7 + seed * 11) & 0xFF;
    rgba[p + 3] = 0xFF;
  }
  return rgba;
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'assets-update-'));
const sprPath = path.join(dir, 'Test.spr');

// ---- monta o .spr sintetico com o writer de referencia -------------------
const originals = [];
const replacements = new Map();
for (let id = 1; id <= COUNT; id++) {
  const rgba = id === COUNT ? Buffer.alloc(codec.SPRITE_PIXEL_COUNT * 4) : makeSprite(id);
  originals.push(rgba);
  replacements.set(id, codec.encode(rgba, FEATURES.transparency));
}
const head = Buffer.alloc(8 + COUNT * 4);
head.writeUInt32LE(0x4C220594, 0); // assinatura do .spr 8.60
head.writeUInt32LE(COUNT, 4);
const empty = codec.parse(head, true);
fs.writeFileSync(sprPath, codec.rebuild(head, empty, replacements));

// ---------------------------------------------------------------- 1
let spr = new SprFile(sprPath, FEATURES, false);
let readOk = true;
for (let id = 1; id <= COUNT; id++) {
  if (!spr.readRGBA(id).equals(originals[id - 1])) readOk = false;
}
check('leitura bate com o codec de referencia', readOk && spr.count === COUNT,
  `${spr.count} sprites, assinatura 0x${spr.signature.toString(16).toUpperCase()}`);
spr.close();

// ---------------------------------------------------------------- 2
const target = 3;
const edited = makeSprite(99);
spr = new SprFile(sprPath, FEATURES, true);
const previous = spr.writeRGBA(target, edited);
spr.close();

spr = new SprFile(sprPath, FEATURES, false);
let isolated = spr.readRGBA(target).equals(edited);
for (let id = 1; id <= COUNT; id++) {
  if (id === target) continue;
  if (!spr.readRGBA(id).equals(originals[id - 1])) isolated = false;
}
check('gravar um sprite nao toca nos outros', isolated,
  `sprite ${target} trocado, ${COUNT - 1} intactos`);
spr.close();

// ---------------------------------------------------------------- 3
const raw = fs.readFileSync(sprPath);
const parsed = codec.parse(raw, true);
let externalOk = parsed.count === COUNT;
for (let id = 1; id <= COUNT; id++) {
  const expected = id === target ? edited : originals[id - 1];
  const got = codec.decode(codec.rawSpriteData(raw, parsed, id), FEATURES.transparency);
  if (!got.equals(expected)) externalOk = false;
}
check('leitor independente concorda com o arquivo gravado', externalOk,
  `${raw.length} bytes`);

// ---------------------------------------------------------------- 4
spr = new SprFile(sprPath, FEATURES, true);
spr.writeRaw(target, previous.raw);
spr.close();
spr = new SprFile(sprPath, FEATURES, false);
check('revert devolve os pixels anteriores',
  spr.readRGBA(target).equals(originals[target - 1]),
  `sprite ${target}`);
spr.close();

// ---------------------------------------------------------------- 5
spr = new SprFile(sprPath, FEATURES, true);
spr.writeRGBA(2, Buffer.alloc(codec.SPRITE_PIXEL_COUNT * 4));
spr.close();
spr = new SprFile(sprPath, FEATURES, false);
check('sprite todo transparente vira endereco 0',
  spr.addressOf(2) === 0 && sheetLib.isBlank(spr.readRGBA(2)),
  'endereco ' + spr.addressOf(2));
spr.close();

// ---------------------------------------------------------------- 6
const png = new PNG({ width: 64, height: 32 });
png.data.fill(0);
sheetLib.writeCell(png, 0, 0, originals[0]);
sheetLib.writeCell(png, 32, 0, originals[1]);
const back0 = sheetLib.readCell(png, 0, 0);
const back1 = sheetLib.readCell(png, 32, 0);
check('corte da folha devolve os pixels inteiros',
  back0.equals(originals[0]) && back1.equals(originals[1]),
  'duas celulas de 32x32');

fs.rmSync(dir, { recursive: true, force: true });

console.log('');
console.log(failures === 0 ? 'TODOS OS TESTES PASSARAM' : failures + ' TESTE(S) FALHARAM');
process.exit(failures === 0 ? 0 : 1);
