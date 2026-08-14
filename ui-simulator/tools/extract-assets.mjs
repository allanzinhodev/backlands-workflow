// Extrai os sprites dos itens que o simulador usa, direto do Tibia.dat/Tibia.spr do cliente.
//
// Uso: npm run assets:extract
//
// Saida: src/assets/items/<clientId>.png (+ <clientId>-<n>.png para stackable) e items.json.
// Os assets de producao sao abertos SOMENTE PARA LEITURA -- nada aqui escreve no repo do cliente.

import fs from 'node:fs';
import path from 'node:path';
import { parseDat, spriteIndex, stackPattern } from './dat.mjs';
import { SpriteFile, SPRITE_SIZE } from './spr.mjs';
import { encodePNG } from './png.mjs';

const here = import.meta.dirname;
const UI_SIM = path.resolve(here, '..');
const CLIENT_THINGS = path.resolve(UI_SIM, '../client/data/things/860');
const SERVER_ITEMS_XML = path.resolve(UI_SIM, '../server/data/items/items.xml');
const OUT_DIR = path.resolve(UI_SIM, 'src/assets/items');

// Conjunto curado: cobre os 10 slots do inventario 8.60 + dinheiro, comida e potions.
// Estes ids sao ClientID (== ServerID neste dataset) e foram conferidos em items.xml, items.otb
// e Tibia.dat. ATENCAO: este NAO e o dataset 8.60 de fabrica -- gold coin e 3031 (nao 2148) e
// backpack e 2854 (nao 1988). Tabela de "Tibia 8.6" achada por ai gera item errado em silencio.
export const ITEM_SET = [
  { id: 2854, name: 'backpack', slot: 'back', container: true },
  { id: 2853, name: 'bag', slot: 'back', container: true },
  { id: 3031, name: 'gold coin', stackable: true },
  { id: 3035, name: 'platinum coin', stackable: true },
  { id: 3043, name: 'crystal coin', stackable: true },
  { id: 266, name: 'health potion' },
  { id: 268, name: 'mana potion' },
  { id: 3577, name: 'meat', stackable: true },
  { id: 3582, name: 'ham', stackable: true },
  { id: 3351, name: 'steel helmet', slot: 'head' },
  { id: 3355, name: 'leather helmet', slot: 'head' },
  { id: 3357, name: 'plate armor', slot: 'body' },
  { id: 3361, name: 'leather armor', slot: 'body' },
  { id: 3559, name: 'leather legs', slot: 'legs' },
  { id: 3552, name: 'leather boots', slot: 'feet' },
  { id: 3412, name: 'wooden shield', slot: 'left-hand' },
  { id: 3264, name: 'sword', slot: 'right-hand' },
  { id: 3277, name: 'spear', slot: 'right-hand', stackable: true },
  { id: 3447, name: 'arrow', slot: 'ammo', stackable: true },
  { id: 3056, name: 'bronze amulet', slot: 'neck' },
  { id: 3004, name: 'wedding ring', slot: 'finger' },
  { id: 2920, name: 'torch' },
];

function readOtfi(file) {
  const text = fs.readFileSync(file, 'utf8');
  const get = (key) => {
    const match = new RegExp(`${key}:\\s*(\\S+)`).exec(text);
    return match ? match[1] : null;
  };
  return {
    extended: get('extended') === 'true',
    transparency: get('transparency') === 'true',
    frameDurations: get('frame-durations') === 'true',
    frameGroups: get('frame-groups') === 'true',
    spriteSize: parseInt(get('sprite-size'), 10),
    spriteDataSize: parseInt(get('sprite-data-size'), 10),
  };
}

function readItemNames(xmlPath) {
  const names = new Map();
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const re = /<item\s+id="(\d+)"[^>]*?name="([^"]*)"/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    names.set(parseInt(match[1], 10), match[2]);
  }
  return names;
}

export function extract({ quiet = false } = {}) {
  const log = quiet ? () => {} : (...args) => console.log(...args);

  const otfi = readOtfi(path.join(CLIENT_THINGS, 'Tibia.otfi'));
  // Se qualquer flag divergir, o layout binario mudou e o parser inteiro deixa de valer.
  if (!otfi.extended || otfi.transparency || !otfi.frameDurations || otfi.spriteSize !== 32) {
    throw new Error(`Tibia.otfi com flags inesperados: ${JSON.stringify(otfi)}`);
  }
  log(`otfi ok: extended=${otfi.extended} transparency=${otfi.transparency} spriteSize=${otfi.spriteSize}`);

  const datBuffer = fs.readFileSync(path.join(CLIENT_THINGS, 'Tibia.dat'));
  const dat = parseDat(datBuffer);
  log(`dat ok: ${dat.items.size} itens, cursor terminou em ${dat.endPosition} (arquivo: ${dat.fileLength})`);

  const spr = new SpriteFile(path.join(CLIENT_THINGS, 'Tibia.spr'), {
    extended: otfi.extended,
    transparency: otfi.transparency,
  });
  log(`spr ok: ${spr.spriteCount} sprites`);

  const names = readItemNames(SERVER_ITEMS_XML);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const catalog = [];
  let written = 0;

  for (const entry of ITEM_SET) {
    const thing = dat.items.get(entry.id);
    if (!thing) {
      console.warn(`  ! item ${entry.id} (${entry.name}) nao existe no Tibia.dat`);
      continue;
    }
    const group = thing.groups[0];
    const isStackSheet = Boolean(entry.stackable) && group.patternX === 4 && group.patternY === 2;

    const record = {
      clientId: entry.id,
      name: names.get(entry.id) || entry.name,
      slot: entry.slot || null,
      stackable: Boolean(thing.flags.stackable),
      container: Boolean(thing.flags.container),
      pickupable: Boolean(thing.flags.pickupable),
      multiUse: Boolean(thing.flags.multiUse),
      fluidContainer: Boolean(thing.flags.fluidContainer),
      patternX: group.patternX,
      patternY: group.patternY,
      frames: group.frames,
      sprites: [],
    };

    const variations = isStackSheet
      ? [
          { px: 0, py: 0 }, { px: 1, py: 0 }, { px: 2, py: 0 }, { px: 3, py: 0 },
          { px: 0, py: 1 }, { px: 1, py: 1 }, { px: 2, py: 1 }, { px: 3, py: 1 },
        ]
      : [{ px: 0, py: 0 }];

    variations.forEach((pattern, index) => {
      const spriteId = group.spriteIds[spriteIndex(group, pattern)];
      const rgba = spr.getSpriteRGBA(spriteId);
      const png = encodePNG(rgba, SPRITE_SIZE, SPRITE_SIZE);
      const fileName = variations.length === 1 ? `${entry.id}.png` : `${entry.id}-${index}.png`;
      fs.writeFileSync(path.join(OUT_DIR, fileName), png);
      record.sprites.push({ index, spriteId, file: fileName });
      written++;
    });

    catalog.push(record);
    log(`  ${String(entry.id).padStart(5)} ${record.name.padEnd(22)} ${record.sprites.length} sprite(s)`);
  }

  spr.close();

  const manifest = {
    generatedFrom: {
      dat: 'client/data/things/860/Tibia.dat',
      spr: 'client/data/things/860/Tibia.spr',
      datSignature: `0x${dat.signature.toString(16).toUpperCase()}`,
      variant: '8.60 v2',
    },
    spriteSize: SPRITE_SIZE,
    items: catalog,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'items.json'), JSON.stringify(manifest, null, 2));

  log(`\n${written} PNG(s) e items.json escritos em ${path.relative(UI_SIM, OUT_DIR)}`);
  return manifest;
}

if (import.meta.filename === process.argv[1]) {
  extract();
}
