'use strict';
// Aceite do codec .spr (TODO F2.T2).
//
//   node tools/sprites/spr-roundtrip-test.js [amostra]
//
// O teste decisivo: para cada sprite, decode -> encode tem de devolver
// exatamente os bytes RLE originais. Se o encoder divergir do encoder que
// gerou o arquivo, qualquer edicao corrompe o atlas em silencio.
//
// Por padrao varre TODOS os sprites. Passe um numero para amostrar.

const fs = require('fs');
const path = require('path');
const spr = require('./spr');
const { readOtfi, defaultAssetDir } = require('./otfi');

const assetDir = defaultAssetDir();
const sprPath = path.join(assetDir, 'Tibia.spr');
const features = readOtfi(path.join(assetDir, 'Tibia.otfi'));
const sample = process.argv[2] ? parseInt(process.argv[2], 10) : 0;

console.log('arquivo :', sprPath);
console.log('features:', JSON.stringify(features));

const buf = fs.readFileSync(sprPath);
const parsed = spr.parse(buf, features.extended);

console.log('assinatura:', parsed.signature.toString(16).toUpperCase());
console.log('sprites   :', parsed.count.toLocaleString('pt-BR'));
console.log('');

const step = sample > 0 ? Math.max(1, Math.floor(parsed.count / sample)) : 1;

let checked = 0;
let empty = 0;
let mismatch = 0;
const failures = [];
const t0 = Date.now();

for (let id = 1; id <= parsed.count; id += step) {
  const original = spr.rawSpriteData(buf, parsed, id);
  if (!original) { empty++; continue; }

  const rgba = spr.decode(original, features.transparency);
  const reencoded = spr.encode(rgba, features.transparency);

  checked++;
  if (!reencoded.equals(original)) {
    mismatch++;
    if (failures.length < 5) {
      failures.push({ id, originalLen: original.length, reencodedLen: reencoded.length });
    }
  }
}

const ms = Date.now() - t0;
console.log('sprites conferidos :', checked.toLocaleString('pt-BR'));
console.log('sprites vazios     :', empty.toLocaleString('pt-BR'));
console.log('divergentes        :', mismatch.toLocaleString('pt-BR'));
console.log('tempo              :', (ms / 1000).toFixed(1) + ' s');

if (mismatch > 0) {
  console.log('\nprimeiras divergencias:');
  for (const f of failures) {
    console.log('  sprite ' + f.id + ': original ' + f.originalLen + ' bytes, reencodado ' + f.reencodedLen);
  }
  console.log('\nFALHOU');
  process.exit(1);
}

console.log('\nROUND-TRIP EXATO EM TODOS OS SPRITES CONFERIDOS');
