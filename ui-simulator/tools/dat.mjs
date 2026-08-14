// Parser do Tibia.dat 8.60 v2 (MetadataReader5).
//
// Referencia canonica: objectbuilder/src/otlib/things/MetadataReader5.as + MetadataReader.as,
// cruzada com client/src/client/thingtype.cpp. As duas concordam byte a byte.
//
// Tres detalhes que quebram parser novo, todos tratados aqui:
//   1. exactSize so existe quando width > 1 || height > 1
//   2. patternZ SEMPRE existe em 8.60 (so some abaixo de 755)
//   3. o bloco de animacao vem ANTES dos sprite ids, e loopCount/startFrame sao SIGNED

export const DAT_SIGNATURE_860_V2 = 0x4c2c7993;

export const ThingCategory = {
  ITEM: 'item',
  OUTFIT: 'outfit',
  EFFECT: 'effect',
  MISSILE: 'missile',
};

// MetadataFlags5: valor -> [nome, bytes extras]. 0xFF encerra o bloco.
const FLAGS = new Map([
  [0x00, ['ground', 2]],
  [0x01, ['groundBorder', 0]],
  [0x02, ['onBottom', 0]],
  [0x03, ['onTop', 0]],
  [0x04, ['container', 0]],
  [0x05, ['stackable', 0]],
  [0x06, ['forceUse', 0]],
  [0x07, ['multiUse', 0]],
  [0x08, ['writable', 2]],
  [0x09, ['writableOnce', 2]],
  [0x0a, ['fluidContainer', 0]],
  [0x0b, ['fluid', 0]],
  [0x0c, ['unpassable', 0]],
  [0x0d, ['unmoveable', 0]],
  [0x0e, ['blockMissile', 0]],
  [0x0f, ['blockPathfind', 0]],
  [0x10, ['pickupable', 0]],
  [0x11, ['hangable', 0]],
  [0x12, ['vertical', 0]],
  [0x13, ['horizontal', 0]],
  [0x14, ['rotatable', 0]],
  [0x15, ['hasLight', 4]],
  [0x16, ['dontHide', 0]],
  [0x17, ['translucent', 0]],
  [0x18, ['hasOffset', 4]],
  [0x19, ['hasElevation', 2]],
  [0x1a, ['lyingObject', 0]],
  [0x1b, ['animateAlways', 0]],
  [0x1c, ['miniMap', 2]],
  [0x1d, ['lensHelp', 2]],
  [0x1e, ['fullGround', 0]],
  [0x1f, ['ignoreLook', 0]],
  [0x20, ['cloth', 2]],
  [0x21, ['marketItem', -1]], // tamanho variavel, tratado a parte
  [0x27, ['hasBones', 16]],
]);

const LAST_FLAG = 0xff;

class Cursor {
  constructor(buffer) {
    this.buf = buffer;
    this.pos = 0;
  }

  u8() {
    return this.buf[this.pos++];
  }

  i8() {
    return this.buf.readInt8(this.pos++);
  }

  u16() {
    const value = this.buf.readUInt16LE(this.pos);
    this.pos += 2;
    return value;
  }

  i16() {
    const value = this.buf.readInt16LE(this.pos);
    this.pos += 2;
    return value;
  }

  u32() {
    const value = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return value;
  }

  i32() {
    const value = this.buf.readInt32LE(this.pos);
    this.pos += 4;
    return value;
  }

  latin1(length) {
    const text = this.buf.toString('latin1', this.pos, this.pos + length);
    this.pos += length;
    return text;
  }
}

function readFlags(cursor) {
  const flags = {};
  for (;;) {
    const flag = cursor.u8();
    if (flag === LAST_FLAG) return flags;

    const entry = FLAGS.get(flag);
    if (!entry) {
      throw new Error(`flag desconhecida 0x${flag.toString(16)} no offset ${cursor.pos - 1}`);
    }
    const [name, extra] = entry;

    if (flag === 0x21) {
      // MARKET_ITEM: 6 bytes + nome com tamanho + 4 bytes
      flags.market = {
        category: cursor.u16(),
        tradeAs: cursor.u16(),
        showAs: cursor.u16(),
        name: cursor.latin1(cursor.u16()),
        restrictProfession: cursor.u16(),
        restrictLevel: cursor.u16(),
      };
      continue;
    }

    if (flag === 0x00) flags.groundSpeed = cursor.u16();
    else if (flag === 0x15) flags.light = { level: cursor.u16(), color: cursor.u16() };
    else if (flag === 0x18) flags.offset = { x: cursor.i16(), y: cursor.i16() };
    else if (flag === 0x27) {
      flags.bones = [];
      for (let i = 0; i < 8; i++) flags.bones.push(cursor.i16());
    } else if (extra > 0) {
      flags[`${name}Value`] = extra === 2 ? cursor.u16() : cursor.u32();
    }

    flags[name] = true;
  }
}

function readFrameGroup(cursor, { extended = true, frameDurations = true }) {
  const group = {};
  group.width = cursor.u8();
  group.height = cursor.u8();

  // Condicional: ler sempre desloca o stream em 1 byte para todo item 1x1 -- a maioria esmagadora.
  group.exactSize = group.width > 1 || group.height > 1 ? cursor.u8() : 32;

  group.layers = cursor.u8();
  group.patternX = cursor.u8();
  group.patternY = cursor.u8();
  group.patternZ = cursor.u8(); // sempre presente em 8.60
  group.frames = cursor.u8();

  if (group.frames > 1 && frameDurations) {
    group.animationMode = cursor.u8();
    group.loopCount = cursor.i32(); // signed
    group.startFrame = cursor.i8(); // signed; -1 = fase inicial aleatoria
    group.durations = [];
    for (let i = 0; i < group.frames; i++) {
      group.durations.push({ min: cursor.u32(), max: cursor.u32() });
    }
  }

  const total =
    group.width * group.height * group.patternX * group.patternY * group.patternZ * group.frames * group.layers;
  if (total > 4096) {
    throw new Error(`sprite count invalido (${total}) no offset ${cursor.pos}`);
  }

  group.spriteIds = new Array(total);
  for (let i = 0; i < total; i++) {
    group.spriteIds[i] = extended ? cursor.u32() : cursor.u16();
  }

  return group;
}

/**
 * Le o .dat inteiro. Devolve { signature, counts, items: Map<clientId, ThingType> }.
 * Por padrao so indexa a categoria 'item' (o simulador nao precisa de outfit/effect/missile),
 * mas percorre TUDO -- e a travessia completa que valida o parser: o cursor tem que terminar
 * exatamente no fim do arquivo.
 */
export function parseDat(buffer, { keepCategories = [ThingCategory.ITEM] } = {}) {
  const cursor = new Cursor(buffer);

  const signature = cursor.u32();
  if (signature !== DAT_SIGNATURE_860_V2) {
    throw new Error(
      `assinatura do .dat inesperada: 0x${signature.toString(16).toUpperCase()} ` +
        `(esperado 0x4C2C7993 = 8.60 v2). As duas variantes de 8.60 tem layout incompativel.`
    );
  }

  const counts = {
    items: cursor.u16(),
    outfits: cursor.u16(),
    effects: cursor.u16(),
    missiles: cursor.u16(),
  };

  const categories = [
    // Atencao: itemsCount e o ULTIMO id, nao a quantidade. O loop e inclusivo.
    { name: ThingCategory.ITEM, min: 100, max: counts.items },
    { name: ThingCategory.OUTFIT, min: 1, max: counts.outfits },
    { name: ThingCategory.EFFECT, min: 1, max: counts.effects },
    { name: ThingCategory.MISSILE, min: 1, max: counts.missiles },
  ];

  const result = {
    signature,
    counts,
    items: new Map(),
    outfits: new Map(),
    effects: new Map(),
    missiles: new Map(),
  };
  const buckets = {
    [ThingCategory.ITEM]: result.items,
    [ThingCategory.OUTFIT]: result.outfits,
    [ThingCategory.EFFECT]: result.effects,
    [ThingCategory.MISSILE]: result.missiles,
  };

  for (const category of categories) {
    for (let id = category.min; id <= category.max; id++) {
      const flags = readFlags(cursor);

      // groupCount / frameGroupType so existem para outfit. Ler para item corrompe tudo.
      const groupCount = category.name === ThingCategory.OUTFIT ? cursor.u8() : 1;
      const groups = [];
      for (let g = 0; g < groupCount; g++) {
        const type = category.name === ThingCategory.OUTFIT ? cursor.u8() : 0;
        const group = readFrameGroup(cursor, {});
        group.type = type;
        groups.push(group);
      }

      if (keepCategories.includes(category.name)) {
        buckets[category.name].set(id, { id, category: category.name, flags, groups });
      }
    }
  }

  result.endPosition = cursor.pos;
  result.fileLength = buffer.length;
  if (cursor.pos !== buffer.length) {
    throw new Error(
      `parser do .dat terminou em ${cursor.pos} mas o arquivo tem ${buffer.length} bytes ` +
        `(diferenca de ${buffer.length - cursor.pos}) -- o layout divergiu em algum ponto`
    );
  }

  return result;
}

/**
 * Indice do sprite dentro do array do frame group.
 * Identico a otlib/animation/FrameGroup.as:118-133 e client thingtype.cpp:873-884.
 */
export function spriteIndex(group, { w = 0, h = 0, layer = 0, px = 0, py = 0, pz = 0, frame = 0 } = {}) {
  return (
    ((((((frame % group.frames) * group.patternZ + pz) * group.patternY + py) * group.patternX + px) * group.layers +
      layer) *
      group.height +
      h) *
      group.width +
    w
  );
}

/**
 * Pattern de um item stackable pela quantidade (client/src/client/item.cpp:488-507).
 * So vale quando patternX == 4 && patternY == 2; fora disso o cliente usa sempre o indice 0.
 */
export function stackPattern(count) {
  if (count <= 1) return { px: 0, py: 0 };
  if (count === 2) return { px: 1, py: 0 };
  if (count === 3) return { px: 2, py: 0 };
  if (count === 4) return { px: 3, py: 0 };
  if (count <= 9) return { px: 0, py: 1 };
  if (count <= 24) return { px: 1, py: 1 };
  if (count <= 49) return { px: 2, py: 1 };
  return { px: 3, py: 1 };
}
