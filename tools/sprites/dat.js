'use strict';
// Parser do Tibia.dat (metadata) para o protocolo 8.60.
//
// Portado de objectbuilder/src/otlib/things/MetadataReader5.as (faixa 8.60-9.86,
// selecionada por core/MetadataControllerStorage.as: version <= 986 -> reader 5),
// com os valores de flag de MetadataFlags5.as e a leitura de sprites de
// MetadataReader.as::readTexturePatterns.
//
// Decisao de projeto: este parser NAO reserializa. Ele percorre o arquivo
// registrando, para cada objeto, o OFFSET de cada entrada de spriteIndex. Uma
// alteracao vira escrita direta nesses offsets sobre uma copia do buffer
// original. Consequencia: todo byte nao tocado sai identico por construcao —
// nao existe a classe de bug em que o writer discorda do reader.

// ---------------------------------------------------------------- flags
// Sem payload salvo indicacao contraria.
const F = {
  GROUND: 0x00, GROUND_BORDER: 0x01, ON_BOTTOM: 0x02, ON_TOP: 0x03,
  CONTAINER: 0x04, STACKABLE: 0x05, FORCE_USE: 0x06, MULTI_USE: 0x07,
  WRITABLE: 0x08, WRITABLE_ONCE: 0x09, FLUID_CONTAINER: 0x0A, FLUID: 0x0B,
  UNPASSABLE: 0x0C, UNMOVEABLE: 0x0D, BLOCK_MISSILE: 0x0E, BLOCK_PATHFIND: 0x0F,
  PICKUPABLE: 0x10, HANGABLE: 0x11, VERTICAL: 0x12, HORIZONTAL: 0x13,
  ROTATABLE: 0x14, HAS_LIGHT: 0x15, DONT_HIDE: 0x16, TRANSLUCENT: 0x17,
  HAS_OFFSET: 0x18, HAS_ELEVATION: 0x19, LYING_OBJECT: 0x1A, ANIMATE_ALWAYS: 0x1B,
  MINI_MAP: 0x1C, LENS_HELP: 0x1D, FULL_GROUND: 0x1E, IGNORE_LOOK: 0x1F,
  CLOTH: 0x20, MARKET_ITEM: 0x21, HAS_BONES: 0x27, LAST: 0xFF,
};

// Quantos bytes de payload cada flag consome. As que não aparecem aqui são
// flags válidas sem payload — por isso o conjunto de flags conhecidas é
// separado: ausência em PAYLOAD significa zero bytes, não flag inválida.
const PAYLOAD = {
  [F.GROUND]: 2, [F.WRITABLE]: 2, [F.WRITABLE_ONCE]: 2, [F.HAS_LIGHT]: 4,
  [F.HAS_OFFSET]: 4, [F.HAS_ELEVATION]: 2, [F.MINI_MAP]: 2, [F.LENS_HELP]: 2,
  [F.CLOTH]: 2, [F.HAS_BONES]: 16,
};

// MARKET_ITEM tem tamanho variável e é tratado à parte no laço.
const KNOWN_FLAGS = new Set(Object.values(F).filter((v) => v !== F.LAST));

const CATEGORY = { ITEM: 'item', OUTFIT: 'outfit', EFFECT: 'effect', MISSILE: 'missile' };

// Padrao do OTB/Tibia: os ids de item comecam em 100; as demais categorias em 1.
const FIRST_ID = { item: 100, outfit: 1, effect: 1, missile: 1 };

/**
 * @param {Buffer} buf
 * @param {{extended:boolean, improvedAnimations:boolean, frameGroups:boolean}} features
 */
function parse(buf, features) {
  const { extended, improvedAnimations, frameGroups } = features;
  let p = 0;

  const signature = buf.readUInt32LE(p); p += 4;
  const itemCount = buf.readUInt16LE(p); p += 2;
  const outfitCount = buf.readUInt16LE(p); p += 2;
  const effectCount = buf.readUInt16LE(p); p += 2;
  const missileCount = buf.readUInt16LE(p); p += 2;

  const things = [];
  const byId = { item: new Map(), outfit: new Map(), effect: new Map(), missile: new Map() };

  const order = [
    [CATEGORY.ITEM, itemCount], [CATEGORY.OUTFIT, outfitCount],
    [CATEGORY.EFFECT, effectCount], [CATEGORY.MISSILE, missileCount],
  ];

  for (const [category, lastId] of order) {
    for (let id = FIRST_ID[category]; id <= lastId; id++) {
      const start = p;

      // ---- propriedades: sequencia de flags ate 0xFF
      for (;;) {
        if (p >= buf.length) throw new Error(`fim inesperado em ${category} ${id}`);
        const flag = buf[p]; p += 1;
        if (flag === F.LAST) break;
        if (flag === F.MARKET_ITEM) {
          p += 6;                                   // category, tradeAs, showAs
          const len = buf.readUInt16LE(p); p += 2;  // nome
          p += len + 4;                             // profession, level
          continue;
        }
        if (!KNOWN_FLAGS.has(flag)) {
          throw new Error(`flag desconhecida 0x${flag.toString(16)} em ${category} ${id} (offset ${p - 1})`);
        }
        p += PAYLOAD[flag] || 0;
      }

      // ---- padroes de textura
      const spriteOffsets = [];
      let groupCount = 1;
      if (frameGroups && category === CATEGORY.OUTFIT) { groupCount = buf[p]; p += 1; }

      for (let g = 0; g < groupCount; g++) {
        if (frameGroups && category === CATEGORY.OUTFIT) p += 1; // groupType

        const width = buf[p]; p += 1;
        const height = buf[p]; p += 1;
        if (width > 1 || height > 1) p += 1;                     // exactSize
        const layers = buf[p]; p += 1;
        const patternX = buf[p]; p += 1;
        const patternY = buf[p]; p += 1;
        const patternZ = buf[p]; p += 1;
        const frames = buf[p]; p += 1;

        if (frames > 1 && improvedAnimations) {
          p += 1;                 // animationMode
          p += 4;                 // loopCount (int)
          p += 1;                 // startFrame
          p += frames * 8;        // min/max por frame (uint32 cada)
        }

        const total = width * height * layers * patternX * patternY * patternZ * frames;
        for (let i = 0; i < total; i++) {
          spriteOffsets.push(p);
          p += extended ? 4 : 2;
        }
      }

      const thing = { id, category, start, end: p, spriteOffsets };
      things.push(thing);
      byId[category].set(id, thing);
    }
  }

  return {
    signature, counts: { itemCount, outfitCount, effectCount, missileCount },
    things, byId, bytesConsumed: p, totalBytes: buf.length, features,
  };
}

/** Lê os sprite ids de um objeto já parseado. */
function spriteIdsOf(buf, thing, extended) {
  return thing.spriteOffsets.map((o) => (extended ? buf.readUInt32LE(o) : buf.readUInt16LE(o)));
}

/**
 * Aponta todas as sprites dos objetos indicados para a sprite vazia (id 0),
 * escrevendo sobre uma CÓPIA do buffer. Preserva os ClientIDs: nenhum objeto é
 * removido, então nada é deslocado e o items.otb continua válido.
 * @returns {{buffer:Buffer, blankedThings:number, blankedRefs:number, freed:Set<number>}}
 */
function blankSprites(buf, parsed, clientIds) {
  const out = Buffer.from(buf);
  const extended = parsed.features.extended;
  const freed = new Set();
  let blankedThings = 0;
  let blankedRefs = 0;

  for (const cid of clientIds) {
    const thing = parsed.byId.item.get(cid);
    if (!thing) continue;
    let touched = false;
    for (const o of thing.spriteOffsets) {
      const current = extended ? out.readUInt32LE(o) : out.readUInt16LE(o);
      if (current === 0) continue;
      freed.add(current);
      if (extended) out.writeUInt32LE(0, o); else out.writeUInt16LE(0, o);
      blankedRefs++;
      touched = true;
    }
    if (touched) blankedThings++;
  }

  return { buffer: out, blankedThings, blankedRefs, freed };
}

/** Conjunto de todos os sprite ids ainda referenciados por algum objeto. */
function referencedSprites(buf, parsed) {
  const extended = parsed.features.extended;
  const used = new Set();
  for (const t of parsed.things) {
    for (const o of t.spriteOffsets) {
      const id = extended ? buf.readUInt32LE(o) : buf.readUInt16LE(o);
      if (id !== 0) used.add(id);
    }
  }
  return used;
}

module.exports = { parse, spriteIdsOf, blankSprites, referencedSprites, CATEGORY, FIRST_ID, F };
