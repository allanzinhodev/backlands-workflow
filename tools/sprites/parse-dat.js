'use strict';
// Lê o Tibia.dat e reporta o que encontrou. Só leitura.
//
//   node tools/sprites/parse-dat.js [caminho/Tibia.dat]
//
// Sem argumento usa client/data/things/860/Tibia.dat.

const fs = require('fs');
const path = require('path');
const dat = require('./dat');
const { readOtfi, defaultAssetDir } = require('./otfi');

const assetDir = defaultAssetDir();
const datPath = process.argv[2] || path.join(assetDir, 'Tibia.dat');
const features = readOtfi(path.join(path.dirname(datPath), 'Tibia.otfi'));

console.log('arquivo :', datPath);
console.log('features:', JSON.stringify(features));

const buf = fs.readFileSync(datPath);
const t0 = Date.now();
const parsed = dat.parse(buf, features);
const ms = Date.now() - t0;

console.log('\nassinatura :', parsed.signature.toString(16).toUpperCase().padStart(8, '0'));
console.log('itens      :', parsed.counts.itemCount.toLocaleString('pt-BR'));
console.log('outfits    :', parsed.counts.outfitCount.toLocaleString('pt-BR'));
console.log('efeitos    :', parsed.counts.effectCount.toLocaleString('pt-BR'));
console.log('misseis    :', parsed.counts.missileCount.toLocaleString('pt-BR'));
console.log('objetos    :', parsed.things.length.toLocaleString('pt-BR'));

const consumed = parsed.bytesConsumed;
const ok = consumed === parsed.totalBytes;
console.log('\nbytes lidos:', consumed.toLocaleString('pt-BR'), '/', parsed.totalBytes.toLocaleString('pt-BR'));
console.log('consumo exato do arquivo:', ok ? 'SIM' : 'NAO (sobraram ' + (parsed.totalBytes - consumed) + ')');

const refs = parsed.things.reduce((n, t) => n + t.spriteOffsets.length, 0);
const used = dat.referencedSprites(buf, parsed);
console.log('\nreferencias a sprite:', refs.toLocaleString('pt-BR'));
console.log('sprite ids distintos:', used.size.toLocaleString('pt-BR'));
let max = 0;
for (const id of used) if (id > max) max = id;
console.log('maior sprite id     :', max.toLocaleString('pt-BR'));
console.log('tempo               :', ms + ' ms');

if (!ok) process.exit(1);
