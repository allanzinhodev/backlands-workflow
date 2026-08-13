'use strict';
// Aponta as sprites dos itens removidos do servidor para a sprite vazia (id 0).
//
//   node tools/sprites/blank-sprites.js [--dry-run]
//
// Abordagem (decidida em TODO.md, Feature 2): NÃO remover ThingType. Remover um
// objeto do .dat desloca todos os ClientIDs seguintes e invalida o items.otb.
// Em vez disso zera as referências de sprite, o que preserva os ClientIDs e
// deixa as sprites antigas órfãs para uma limpeza posterior.
//
// A lista de alvos vem de server/tools/reference/items_definition_removal_report.json
// (os 1159 equipamentos não-clássicos) traduzida de ServerID para ClientID pelo
// items.otb.backup-before-removal — o items.otb atual já não tem esses nós.

const fs = require('fs');
const path = require('path');
const dat = require('./dat');
const otb = require('./otb');
const { readOtfi, defaultAssetDir } = require('./otfi');

const ROOT = path.resolve(__dirname, '..', '..');
const SERVER = path.join(ROOT, 'server');
const REPORT = path.join(SERVER, 'tools', 'reference', 'items_definition_removal_report.json');
const OTB_BACKUP = path.join(SERVER, 'data', 'items', 'items.otb.backup-before-removal');
const OTB_CURRENT = path.join(SERVER, 'data', 'items', 'items.otb');
const OUT_REPORT = path.join(__dirname, 'blank_sprites_report.json');

const DRY_RUN = process.argv.includes('--dry-run');
const assetDir = defaultAssetDir();
const datPath = path.join(assetDir, 'Tibia.dat');
const sprPath = path.join(assetDir, 'Tibia.spr');

for (const f of [REPORT, OTB_BACKUP, OTB_CURRENT, datPath]) {
  if (!fs.existsSync(f)) { console.error('Falta:', f); process.exit(1); }
}

// ---------------------------------------------------------------- alvos
const removal = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const removedServerIds = removal.removed.map((r) => r.id);
const nameOf = new Map(removal.removed.map((r) => [r.id, r.name]));

const backup = otb.readMapping(OTB_BACKUP);
const current = otb.readMapping(OTB_CURRENT);

console.log('itens removidos do servidor :', removedServerIds.length);
console.log('itens no otb (antes/depois) :', backup.count, '/', current.count);

const keptClientIds = new Set(current.serverToClient.values());
const targets = [];
const unmapped = [];
const shared = [];

for (const sid of removedServerIds) {
  const cid = backup.serverToClient.get(sid);
  if (cid === undefined) { unmapped.push(sid); continue; }
  // Um ClientID pode ser usado por mais de um ServerID. Se algum item que FICOU
  // aponta para o mesmo ClientID, esvaziar apagaria a sprite de um item vivo.
  if (keptClientIds.has(cid)) { shared.push({ serverId: sid, clientId: cid }); continue; }
  targets.push({ serverId: sid, clientId: cid, name: nameOf.get(sid) });
}

console.log('sem mapeamento no otb       :', unmapped.length);
console.log('clientId compartilhado      :', shared.length, '(preservados)');
console.log('alvos                       :', targets.length);
if (shared.length) {
  console.log('  preservados por seguranca:', shared.slice(0, 10).map((s) => s.clientId).join(', '));
}

// ---------------------------------------------------------------- .dat
const features = readOtfi(path.join(assetDir, 'Tibia.otfi'));
const buf = fs.readFileSync(datPath);
const parsed = dat.parse(buf, features);

if (parsed.bytesConsumed !== parsed.totalBytes) {
  console.error('ABORTADO: o parser nao consumiu o arquivo inteiro.');
  process.exit(1);
}

const usedBefore = dat.referencedSprites(buf, parsed);
const clientIds = targets.map((t) => t.clientId);
const notInDat = clientIds.filter((c) => !parsed.byId.item.has(c));

const result = dat.blankSprites(buf, parsed, clientIds);
const usedAfter = dat.referencedSprites(result.buffer, parsed);

// Sprites que perderam toda referencia.
const orphaned = [];
for (const id of result.freed) if (!usedAfter.has(id)) orphaned.push(id);

console.log('\nclientIds fora do .dat      :', notInDat.length);
console.log('objetos esvaziados          :', result.blankedThings.toLocaleString('pt-BR'));
console.log('referencias zeradas         :', result.blankedRefs.toLocaleString('pt-BR'));
console.log('sprites usadas antes/depois :', usedBefore.size.toLocaleString('pt-BR'), '->', usedAfter.size.toLocaleString('pt-BR'));
console.log('sprites que ficaram orfas   :', orphaned.length.toLocaleString('pt-BR'));

const sprSize = fs.statSync(sprPath).size;
const share = orphaned.length / usedBefore.size;
console.log('\npotencial de reducao do .spr:', (share * 100).toFixed(2) + '%',
  '(~' + (sprSize * share / 1024 / 1024).toFixed(0) + ' MB de ' + (sprSize / 1024 / 1024).toFixed(0) + ' MB)');

// ---------------------------------------------------------------- validacao
const diffBytes = (() => { let n = 0; for (let i = 0; i < buf.length; i++) if (buf[i] !== result.buffer[i]) n++; return n; })();
const maxExpected = result.blankedRefs * (features.extended ? 4 : 2);
console.log('\nbytes alterados             :', diffBytes, '(teto', maxExpected + ')');
if (diffBytes > maxExpected) { console.error('ABORTADO: alterou mais bytes do que o esperado.'); process.exit(1); }
if (result.buffer.length !== buf.length) { console.error('ABORTADO: tamanho mudou.'); process.exit(1); }

const report = {
  dryRun: DRY_RUN, ranAt: new Date().toISOString(),
  removedServerIds: removedServerIds.length,
  targets: targets.length, unmapped, sharedClientIds: shared, notInDat,
  blankedThings: result.blankedThings, blankedRefs: result.blankedRefs,
  spritesUsedBefore: usedBefore.size, spritesUsedAfter: usedAfter.size,
  orphanedSprites: orphaned.length,
  bytesChanged: diffBytes,
  orphanedSpriteIds: orphaned.sort((a, b) => a - b),
  items: targets,
};

if (DRY_RUN) {
  console.log('\n=== DRY RUN — nada foi escrito ===');
} else {
  fs.writeFileSync(datPath + '.backup-before-blank', buf);
  fs.writeFileSync(datPath, result.buffer);
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2) + '\n');
  console.log('\nbackup   : Tibia.dat.backup-before-blank');
  console.log('atualizado: Tibia.dat');
  console.log('relatorio : tools/sprites/blank_sprites_report.json');
  console.log('\nPROXIMO PASSO: compactar o .spr removendo as', orphaned.length, 'sprites orfas');
}
