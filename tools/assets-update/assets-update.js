#!/usr/bin/env node
'use strict';
// tools/assets-update — edicao de sprites de brush do NexaMap por PNG.
//
//   init   <brush>   le o brush do editor e escreve specs/<slug>.json
//   export <slug>    monta work/<slug>/<slug>.png com as bordas na mesma imagem
//   status <slug>    compara a PNG com o Tibia.spr e diz o que falta gravar
//   apply  <slug>    grava no Tibia.spr so as celulas que mudaram
//   revert <slug>    desfaz a ultima gravacao
//   sync   <slug>    exporta se nao existe, senao aplica o que mudou (padrao)
//   list             specs disponiveis
//
// A cadeia e a do AGENTS.md: brush XML (ServerID) -> items.otb -> Tibia.dat
// (ClientID -> sprite ids) -> Tibia.spr (pixels). Nada aqui mexe em .dat, .otb
// ou XML: trocar os pixels de um sprite ja existente nao muda id nenhum.

const fs = require('fs');
const path = require('path');

const ws = require('./lib/workspace');
const brushes = require('./lib/brush');
const sheetLib = require('./lib/sheet');
const { EDGE_ORDER } = require('./lib/layout');

const BACKUP_SUFFIX = '.backup-before-assets-update';
const HISTORY_LIMIT = 5;

// ------------------------------------------------------------------ util

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function specPath(name) { return path.join(ws.SPECS_DIR, `${slugify(name)}.json`); }
function workDir(name) { return path.join(ws.WORK_DIR, slugify(name)); }
function sheetPath(name) { return path.join(workDir(name), `${slugify(name)}.png`); }
function statePath(name) { return path.join(workDir(name), 'state.json'); }

function loadSpec(name) {
  if (!name) throw new Error('informe o spec: assets-update.js <comando> <nome>. Veja os nomes com "list".');
  const file = specPath(name);
  if (!fs.existsSync(file)) {
    const available = fs.existsSync(ws.SPECS_DIR)
      ? fs.readdirSync(ws.SPECS_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
      : [];
    throw new Error(`spec "${name}" nao existe (${ws.relative(file)}).` +
      (available.length ? `\nDisponiveis: ${available.join(', ')}` : '\nCrie com: init "<nome do brush>"'));
  }
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  spec.name = spec.name || slugify(name);
  return spec;
}

function loadState(name) {
  const file = statePath(name);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveState(name, state) {
  fs.mkdirSync(workDir(name), { recursive: true });
  fs.writeFileSync(statePath(name), JSON.stringify(state, null, 2) + '\n');
}

function pad(text, width) { return String(text).padEnd(width); }
function padLeft(text, width) { return String(text).padStart(width); }

// ------------------------------------------------------------------ diff

/** Compara as celulas da folha com o que esta gravado no .spr agora. */
function diffAgainstSpr(cells, spr) {
  const groups = new Map();
  const needsNewSprite = [];

  for (const cell of cells) {
    if (!cell.spriteId) {
      if (!sheetLib.isBlank(cell.data)) needsNewSprite.push(cell);
      continue;
    }

    let group = groups.get(cell.spriteId);
    if (!group) {
      const current = spr.readRGBA(cell.spriteId);
      group = { spriteId: cell.spriteId, current, currentHash: sheetLib.hash(current), cells: [], changed: [] };
      groups.set(cell.spriteId, group);
    }
    group.cells.push(cell);
    if (cell.hash !== group.currentHash) group.changed.push(cell);
  }

  const changed = [];
  const conflicts = [];

  for (const group of groups.values()) {
    if (group.changed.length === 0) continue;
    const distinct = new Set(group.changed.map((c) => c.hash));
    if (distinct.size > 1) { conflicts.push(group); continue; }
    group.target = group.changed[0].data;
    group.targetHash = group.changed[0].hash;
    changed.push(group);
  }

  changed.sort((a, b) => a.spriteId - b.spriteId);
  return { groups: [...groups.values()], changed, conflicts, needsNewSprite };
}

function describeCell(cell) {
  return `${cell.label}${cell.context ? ' (contexto)' : ''} f${cell.frame}`;
}

function reportDiff(result, sheetInfo) {
  if (sheetInfo.partialAlpha) {
    console.log(`  ! ${sheetInfo.partialAlpha} pixels com alpha parcial foram tratados como opacos ` +
      '(o 8.60 grava transparency: false — ou o pixel esta la, ou nao esta).');
  }
  if (sheetInfo.magenta) {
    console.log(`  ! ${sheetInfo.magenta} pixels magenta puro (255,0,255). Se eram para ser buraco, ` +
      'apague de verdade ou rode com --magenta-as-alpha.');
  }

  for (const group of result.conflicts) {
    const versions = group.changed.map(describeCell).join(', ');
    console.log(`  X sprite ${group.spriteId}: as celulas ${versions} foram editadas de formas diferentes ` +
      'e compartilham o mesmo sprite. Deixe iguais e rode de novo.');
  }

  for (const cell of result.needsNewSprite) {
    console.log(`  X ${describeCell(cell)}: a celula estava vazia (sprite id 0) e agora tem pixels. ` +
      'Criar sprite nova ainda nao e suportado — precisa mexer no .dat.');
  }

  for (const group of result.changed) {
    const where = group.changed.map(describeCell).join(', ');
    console.log(`  ~ sprite ${padLeft(group.spriteId, 6)}  ${group.currentHash} -> ${group.targetHash}  [${where}]`);
  }
}

// ------------------------------------------------------------------ init

function cmdInit(args) {
  const brushName = args.positional[0];
  if (!brushName) throw new Error('uso: init "<nome do brush>" [--name=slug] [--title="..."]');

  const info = brushes.describeBrush(brushName);
  const name = args.flags.name || slugify(brushName);
  const tiles = [];

  info.grounds.forEach((ground, i) => {
    tiles.push({
      slot: i === 0 ? 'ground' : undefined,
      serverId: ground.serverId,
      label: i === 0 ? 'ground' : `ground-alt${i}`,
      chance: ground.chance,
    });
  });

  for (const border of info.borders) {
    const sorted = [...border.items].sort((a, b) => EDGE_ORDER.indexOf(a.edge) - EDGE_ORDER.indexOf(b.edge));
    for (const item of sorted) {
      tiles.push({ slot: item.edge, serverId: item.serverId, label: `${item.edge}`, border: border.id });
    }
  }

  for (const other of info.others) {
    tiles.push({ serverId: other.serverId, label: other.label });
  }

  const spec = {
    name,
    title: args.flags.title || brushName,
    brush: brushName,
    source: `mapeditor/data/860/${info.file}`,
    brushType: info.type,
    lookid: info.lookid,
    assetDir: 'client/data/things/860',
    layout: 'island5x5',
    frameLayout: 'horizontal',
    generatedAt: new Date().toISOString(),
    tiles: tiles.map((t) => JSON.parse(JSON.stringify(t))), // tira os undefined
  };

  fs.mkdirSync(ws.SPECS_DIR, { recursive: true });
  fs.writeFileSync(specPath(name), JSON.stringify(spec, null, 2) + '\n');

  console.log(`[SPEC] ${ws.relative(specPath(name))}`);
  console.log(`       brush "${brushName}" (${info.file}, type=${info.type}) — ${tiles.length} tiles`);
  console.log(`       proximo passo: node ${path.basename(__filename)} export ${name}`);
}

// ---------------------------------------------------------------- export

function cmdExport(args) {
  const spec = loadSpec(args.positional[0]);
  const assets = ws.loadAssets(args.flags.assets || spec.assetDir);
  const plan = sheetLib.buildPlan(spec, assets);
  const spr = ws.openSpr(assets, false);

  try {
    const file = sheetPath(spec.name);
    if (fs.existsSync(file) && !args.flags.force) {
      const existing = sheetLib.readSheet(file, plan, { magentaAsAlpha: args.flags['magenta-as-alpha'] });
      const pending = diffAgainstSpr(existing.cells, spr);
      const edits = pending.changed.length + pending.conflicts.length + pending.needsNewSprite.length;
      if (edits) {
        throw new Error(`${ws.relative(file)} tem ${edits} celula(s) editadas que ainda nao foram ` +
          'gravadas. Rode "apply" antes, ou "export --force" para descartar o desenho.');
      }
    }

    fs.mkdirSync(workDir(spec.name), { recursive: true });
    sheetLib.writeSheet(file, plan, spr);

    for (const warning of plan.warnings) console.log(`  ! ${warning}`);

    const state = {
      spec: spec.name,
      sheet: path.basename(file),
      exportedAt: new Date().toISOString(),
      assets: {
        dat: ws.relative(assets.paths.dat),
        spr: ws.relative(assets.paths.spr),
        datSignature: '0x' + assets.dat.signature.toString(16).toUpperCase(),
        sprSignature: '0x' + spr.signature.toString(16).toUpperCase(),
        sprCount: spr.count,
        features: assets.features,
      },
      geometry: plan.geometry,
      warnings: plan.warnings,
      cells: plan.cells.map((c) => ({
        frame: c.frame, row: c.row, col: c.col, slot: c.slot, label: c.label,
        serverId: c.serverId, clientId: c.clientId, spriteId: c.spriteId,
        context: c.context, x: c.x, y: c.y, hash: c.hash,
      })),
      history: (loadState(spec.name) || {}).history || [],
    };
    saveState(spec.name, state);

    const g = plan.geometry;
    const uniques = new Set(plan.cells.map((c) => c.spriteId).filter(Boolean)).size;
    console.log(`[PNG ] ${ws.relative(file)}  ${g.width}x${g.height}`);
    console.log(`       ${g.frames} frames de ${g.blockWidth}x${g.blockHeight} (${g.frameLayout}), ` +
      `${plan.tiles.length} tiles, ${uniques} sprites unicas`);
    console.log(`       Aseprite: Import Sprite Sheet, frame ${g.blockWidth}x${g.blockHeight}, grid 32x32`);
    console.log(`       depois de editar: node ${path.basename(__filename)} apply ${spec.name}`);
  } finally {
    spr.close();
  }
}

// ---------------------------------------------------------------- status

function readPlanAndSheet(spec, assets, args) {
  const plan = sheetLib.buildPlan(spec, assets);
  const file = sheetPath(spec.name);
  if (!fs.existsSync(file)) {
    throw new Error(`${ws.relative(file)} nao existe. Rode "export ${spec.name}" primeiro.`);
  }
  const sheetInfo = sheetLib.readSheet(file, plan, { magentaAsAlpha: args.flags['magenta-as-alpha'] });
  return { plan, file, sheetInfo };
}

function cmdStatus(args) {
  const spec = loadSpec(args.positional[0]);
  const assets = ws.loadAssets(args.flags.assets || spec.assetDir);
  const { plan, file, sheetInfo } = readPlanAndSheet(spec, assets, args);
  const spr = ws.openSpr(assets, false);

  try {
    const result = diffAgainstSpr(sheetInfo.cells, spr);
    const state = loadState(spec.name);

    console.log(`[SPEC] ${spec.name} — ${spec.title || spec.brush}`);
    console.log(`[PNG ] ${ws.relative(file)}  ${plan.geometry.width}x${plan.geometry.height}`);
    if (state && state.exportedAt) console.log(`       exportada em ${state.exportedAt}`);
    const last = state && state.history && state.history[0];
    if (last) console.log(`       ultima gravacao em ${last.appliedAt} (${last.sprites.length} sprites)`);

    reportDiff(result, sheetInfo);

    if (!result.changed.length && !result.conflicts.length && !result.needsNewSprite.length) {
      console.log('  = a folha e identica ao Tibia.spr — nada a gravar.');
    } else {
      console.log(`  -> ${result.changed.length} sprite(s) para gravar` +
        (result.conflicts.length ? `, ${result.conflicts.length} conflito(s)` : '') +
        (result.needsNewSprite.length ? `, ${result.needsNewSprite.length} celula(s) sem sprite` : ''));
    }
    return result;
  } finally {
    spr.close();
  }
}

// ----------------------------------------------------------------- apply

function ensureBackup(sprPath, skip) {
  const backup = sprPath + BACKUP_SUFFIX;
  if (skip || fs.existsSync(backup)) return backup;
  const mb = Math.round(fs.statSync(sprPath).size / (1024 * 1024));
  console.log(`[BKP ] copiando ${mb} MB para ${path.basename(backup)} (so na primeira vez)...`);

  // Copia em blocos, e nao fs.copyFileSync: o editor e o cliente mantem o .spr
  // aberto para leitura enquanto rodam, e o CopyFile do Windows recusa (EBUSY)
  // um arquivo com esse lock — a leitura em si continua permitida.
  const source = fs.openSync(sprPath, 'r');
  const target = fs.openSync(backup + '.parcial', 'w');
  try {
    const chunk = Buffer.alloc(8 * 1024 * 1024);
    let position = 0;
    for (;;) {
      const read = fs.readSync(source, chunk, 0, chunk.length, position);
      if (read === 0) break;
      fs.writeSync(target, chunk, 0, read);
      position += read;
    }
  } finally {
    fs.closeSync(source);
    fs.closeSync(target);
  }
  fs.renameSync(backup + '.parcial', backup);
  return backup;
}

/** O .spr fica travado enquanto o cliente ou o editor estao abertos. */
function openSprForWriting(assets) {
  try {
    return ws.openSpr(assets, true);
  } catch (error) {
    if (['EBUSY', 'EPERM', 'EACCES'].includes(error.code)) {
      throw new Error(
        `${ws.relative(assets.paths.spr)} esta travado por outro processo.\n` +
        '       O NexaMap Editor e o AstraClient mantem o .spr aberto enquanto rodam ' +
        '(carregam sprite sob demanda).\n' +
        '       Feche os dois e rode de novo — eles so releem os assets ao abrir, de qualquer forma.'
      );
    }
    throw error;
  }
}

function cmdApply(args) {
  const spec = loadSpec(args.positional[0]);
  const assets = ws.loadAssets(args.flags.assets || spec.assetDir);
  const { plan, file, sheetInfo } = readPlanAndSheet(spec, assets, args);

  const readOnly = ws.openSpr(assets, false);
  let result;
  try {
    result = diffAgainstSpr(sheetInfo.cells, readOnly);
  } finally {
    readOnly.close();
  }

  console.log(`[SPEC] ${spec.name} — ${spec.title || spec.brush}`);
  console.log(`[PNG ] ${ws.relative(file)}`);
  reportDiff(result, sheetInfo);

  if (result.conflicts.length) throw new Error('conflito entre celulas que compartilham sprite — nada foi gravado.');

  if (!result.changed.length) {
    console.log('  = nada mudou desde a ultima gravacao.');
    return result;
  }

  if (args.flags['dry-run']) {
    console.log(`  -> --dry-run: ${result.changed.length} sprite(s) ficariam gravadas.`);
    return result;
  }

  // Confere a escrita antes de copiar 432 MB: se o editor ou o cliente estao
  // abertos, o open falha aqui e o backup nao chega a ser feito a toa.
  openSprForWriting(assets).close();
  ensureBackup(assets.paths.spr, args.flags['no-backup']);

  const spr = openSprForWriting(assets);
  const record = {
    appliedAt: new Date().toISOString(),
    sheet: path.basename(file),
    spr: ws.relative(assets.paths.spr),
    sprites: [],
  };
  try {
    for (const group of result.changed) {
      const previous = spr.writeRGBA(group.spriteId, group.target);
      record.sprites.push({
        id: group.spriteId,
        before: group.currentHash,
        after: group.targetHash,
        cells: group.changed.map((c) => ({ frame: c.frame, slot: c.slot, label: c.label })),
        prevAddress: previous.address,
        prevRle: previous.raw ? previous.raw.toString('base64') : null,
      });
    }
    console.log(`[SPR ] ${record.sprites.length} sprite(s) gravadas em ${ws.relative(assets.paths.spr)} ` +
      `(+${spr.appendedBytes} bytes no fim do arquivo)`);
  } finally {
    spr.close();
  }

  // Propaga o desenho novo para as outras celulas do mesmo sprite (copias de
  // contexto e frames que reusam o desenho), senao a proxima rodada leria
  // essas celulas como um pedido de voltar atras.
  const updates = new Map(result.changed.map((g) => [g.spriteId, g.target]));
  const synced = sheetLib.syncSheet(file, sheetInfo.cells, updates);
  if (synced) {
    console.log(`       ${synced} celula(s) da folha sincronizadas — compartilham sprite com o que voce editou.`);
  }
  for (const cell of sheetInfo.cells) {
    const rgba = updates.get(cell.spriteId);
    if (rgba) cell.hash = sheetLib.hash(rgba);
  }

  const state = loadState(spec.name) || { spec: spec.name };
  state.history = [record, ...(state.history || [])].slice(0, HISTORY_LIMIT);
  state.cells = sheetInfo.cells.map((c) => ({
    frame: c.frame, row: c.row, col: c.col, slot: c.slot, label: c.label,
    serverId: c.serverId, clientId: c.clientId, spriteId: c.spriteId,
    context: c.context, x: c.x, y: c.y, hash: c.hash,
  }));
  state.geometry = plan.geometry;
  saveState(spec.name, state);

  console.log('       o .dat nao foi tocado: os sprite ids continuam os mesmos.');
  console.log('       reinicie o cliente/editor para ver (os assets sao lidos na abertura).');
  return result;
}

// ---------------------------------------------------------------- revert

function cmdRevert(args) {
  const spec = loadSpec(args.positional[0]);
  const state = loadState(spec.name);
  const last = state && state.history && state.history[0];
  if (!last) throw new Error(`nao ha gravacao registrada para "${spec.name}".`);

  const assets = ws.loadAssets(args.flags.assets || spec.assetDir);
  const currentTarget = ws.relative(assets.paths.spr);
  if (last.spr && last.spr !== currentTarget && !args.flags.force) {
    throw new Error(`a ultima gravacao foi em ${last.spr}, e o alvo agora e ${currentTarget}. ` +
      'Aponte o mesmo arquivo com --assets, ou passe --force se for isso mesmo.');
  }

  const spr = openSprForWriting(assets);
  try {
    for (const entry of last.sprites) {
      // O corpo antigo nunca foi apagado (a gravacao so acrescenta). Se ele
      // ainda estiver la, basta reapontar o endereco — o arquivo volta byte a
      // byte ao que era. Se algo mais reescreveu o .spr no meio, regrava.
      let how = 'regravado no fim do arquivo';
      const raw = spr.readRawAt(entry.prevAddress);
      if (raw && sheetLib.hash(spr.decodeRaw(raw)) === entry.before) {
        spr.setAddress(entry.id, entry.prevAddress);
        how = 'endereco original';
      } else {
        spr.writeRaw(entry.id, entry.prevRle ? Buffer.from(entry.prevRle, 'base64') : null);
      }
      console.log(`  < sprite ${entry.id} de volta para ${entry.before} (${how})`);
    }
  } finally {
    spr.close();
  }

  state.history = state.history.slice(1);
  saveState(spec.name, state);
  console.log(`[SPR ] ${last.sprites.length} sprite(s) revertidas para o estado de ${last.appliedAt}.`);
  console.log(`       a folha em ${ws.relative(sheetPath(spec.name))} continua com a versao editada —` +
    ` para descarta-la tambem: export ${spec.name} --force`);
}

// ------------------------------------------------------------------ sync

function cmdSync(args) {
  const spec = loadSpec(args.positional[0]);
  if (!fs.existsSync(sheetPath(spec.name))) {
    console.log('[SYNC] folha ainda nao existe — exportando.');
    return cmdExport(args);
  }
  return cmdApply(args);
}

// ------------------------------------------------------------------ list

function cmdList() {
  if (!fs.existsSync(ws.SPECS_DIR)) { console.log('nenhum spec ainda.'); return; }
  const files = fs.readdirSync(ws.SPECS_DIR).filter((f) => f.endsWith('.json'));
  if (!files.length) { console.log('nenhum spec ainda.'); return; }

  console.log(pad('SPEC', 20) + pad('BRUSH', 24) + pad('TILES', 7) + 'FOLHA');
  for (const f of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(ws.SPECS_DIR, f), 'utf8'));
    const file = sheetPath(spec.name);
    const state = loadState(spec.name);
    const applied = state && state.history && state.history[0];
    const status = !fs.existsSync(file) ? 'nao exportada'
      : applied ? `gravada em ${applied.appliedAt.slice(0, 10)}` : 'exportada';
    console.log(pad(spec.name, 20) + pad(spec.brush, 24) + pad(spec.tiles.length, 7) + status);
  }
}

// ------------------------------------------------------------------- CLI

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value === undefined ? true : value;
    } else positional.push(arg);
  }
  return { positional, flags };
}

const COMMANDS = {
  init: cmdInit, export: cmdExport, status: cmdStatus,
  apply: cmdApply, revert: cmdRevert, sync: cmdSync, list: cmdList,
};

function usage() {
  const me = 'node tools/assets-update/assets-update.js';
  console.log(`
tools/assets-update — edita as sprites de um brush do NexaMap via PNG.

  ${me} init "shallow water"      cria specs/shallow-water.json
  ${me} export shallow-water      monta a folha PNG para o Aseprite
  ${me} status shallow-water      o que mudou na PNG e ainda nao foi gravado
  ${me} apply  shallow-water      grava as celulas alteradas no Tibia.spr
  ${me} revert shallow-water      desfaz a ultima gravacao
  ${me} shallow-water             sync: exporta se falta, senao aplica
  ${me} list                      specs existentes

Opcoes: --dry-run  --force  --no-backup  --magenta-as-alpha  --assets=<dir>
`.trim());
}

function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === '--help' || argv[0] === '-h') { usage(); return; }

  const first = argv[0];
  const isCommand = Object.prototype.hasOwnProperty.call(COMMANDS, first);
  const command = isCommand ? first : 'sync';
  const args = parseArgs(isCommand ? argv.slice(1) : argv);

  try {
    COMMANDS[command](args);
  } catch (error) {
    console.error(`\n[ERRO] ${error.message}\n`);
    process.exit(1);
  }
}

main();
