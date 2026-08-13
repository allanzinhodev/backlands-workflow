'use strict';
// Critério de aceite do parser (TODO F2.T1/F2.T3/F2.T4).
//
//   node tools/sprites/roundtrip-test.js
//
// 1) CONSUMO EXATO   — o parser termina exatamente no fim do arquivo. Qualquer
//    desalinhamento de flag ou de sprite index sobra ou falta byte.
// 2) IDENTIDADE      — esvaziar com lista vazia devolve bytes idênticos.
// 3) ASSINATURA      — bate com a variante 8.60 esperada.
// 4) COERÊNCIA .spr  — o maior sprite id do .dat não passa da contagem do .spr.
// 5) ALVO ISOLADO    — esvaziar um objeto altera só as referências dele.

const fs = require('fs');
const path = require('path');
const dat = require('./dat');
const { readOtfi, defaultAssetDir } = require('./otfi');

const assetDir = process.argv[2] || defaultAssetDir();
const datPath = path.join(assetDir, 'Tibia.dat');
const sprPath = path.join(assetDir, 'Tibia.spr');

// 8.60 v2 (objectbuilder/src/config/versions.xml:31). v1 seria 0x4C28B721.
const EXPECTED_DAT_SIGNATURE = 0x4C2C7993;

const features = readOtfi(path.join(assetDir, 'Tibia.otfi'));
const buf = fs.readFileSync(datPath);
const parsed = dat.parse(buf, features);

let failures = 0;
const check = (label, ok, detail) => {
  console.log((ok ? '  OK   ' : '  FALHOU ') + label + (detail ? ' — ' + detail : ''));
  if (!ok) failures++;
};

console.log('assets  :', assetDir);
console.log('features:', JSON.stringify(features));
console.log('');

// ---------------------------------------------------------------- 1
check('consumo exato do arquivo',
  parsed.bytesConsumed === parsed.totalBytes,
  parsed.bytesConsumed.toLocaleString('pt-BR') + ' / ' + parsed.totalBytes.toLocaleString('pt-BR') + ' bytes');

// ---------------------------------------------------------------- 2
const identity = dat.blankSprites(buf, parsed, []);
check('identidade (lista vazia)',
  identity.buffer.length === buf.length && identity.buffer.equals(buf),
  buf.length.toLocaleString('pt-BR') + ' bytes idênticos');

// ---------------------------------------------------------------- 3
check('assinatura do .dat',
  parsed.signature === EXPECTED_DAT_SIGNATURE,
  '0x' + parsed.signature.toString(16).toUpperCase() + ' (8.60 v2)');

// ---------------------------------------------------------------- 4
const fd = fs.openSync(sprPath, 'r');
const head = Buffer.alloc(8);
fs.readSync(fd, head, 0, 8, 0);
fs.closeSync(fd);
const sprCount = features.extended ? head.readUInt32LE(4) : head.readUInt16LE(4);
const used = dat.referencedSprites(buf, parsed);
let maxId = 0;
for (const id of used) if (id > maxId) maxId = id;
check('maior sprite id cabe no .spr',
  maxId <= sprCount,
  'max ' + maxId.toLocaleString('pt-BR') + ' <= ' + sprCount.toLocaleString('pt-BR'));

// ---------------------------------------------------------------- 5
// Escolhe um item com sprites e confere que só ele muda.
const sample = parsed.things.find((t) => t.category === 'item' && t.spriteOffsets.length > 2);
const one = dat.blankSprites(buf, parsed, [sample.id]);
let differing = 0;
for (let i = 0; i < buf.length; i++) if (buf[i] !== one.buffer[i]) differing++;
const expectedBytes = sample.spriteOffsets.length * (features.extended ? 4 : 2);
check('esvaziar um objeto toca só as referências dele',
  differing <= expectedBytes && one.blankedThings === 1,
  'item ' + sample.id + ': ' + differing + ' bytes alterados, teto ' + expectedBytes);

console.log('');
console.log(failures === 0 ? 'TODOS OS TESTES PASSARAM' : failures + ' TESTE(S) FALHARAM');
process.exit(failures === 0 ? 0 : 1);
