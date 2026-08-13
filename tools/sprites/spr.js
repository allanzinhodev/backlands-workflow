'use strict';
// Codec do Tibia.spr — leitura e escrita, incluindo a compressão RLE de
// transparência.
//
// Portado de objectbuilder/src/otlib/sprites/Sprite.as (compressPixels /
// uncompressPixels) e SpriteStorage.as (layout do arquivo).
//
// Layout:
//   u32 assinatura
//   u32 contagem            (u16 quando não é extended)
//   tabela de endereços     contagem x u32 — offset do sprite, 0 = vazio
//   por sprite, no offset:
//     3 bytes  cor-chave 0xFF 0x00 0xFF (escrita, ignorada na leitura)
//     u16      tamanho dos dados comprimidos
//     N bytes  dados RLE
//
// RLE: sequência de chunks
//     u16 quantidade de pixels transparentes
//     u16 quantidade de pixels coloridos
//     coloridos x (R,G,B[,A])  — A só existe quando transparency = true
//
// Um sprite pode terminar antes de completar 1024 pixels; o que falta é
// transparente.

const SPRITE_PIXELS = 32;
const SPRITE_PIXEL_COUNT = SPRITE_PIXELS * SPRITE_PIXELS; // 1024
const ADDRESS_SIZE = 4;

/** Lê o cabeçalho e a tabela de endereços. Não decodifica pixel nenhum. */
function parse(buf, extended) {
  const signature = buf.readUInt32LE(0);
  const count = extended ? buf.readUInt32LE(4) : buf.readUInt16LE(4);
  const headSize = extended ? 8 : 6;

  const addresses = new Array(count);
  for (let i = 0; i < count; i++) {
    addresses[i] = buf.readUInt32LE(headSize + i * ADDRESS_SIZE);
  }

  return { signature, count, headSize, addresses, extended };
}

/**
 * Devolve os bytes RLE crus de um sprite (1-based, como o formato numera).
 * null quando o sprite é vazio.
 */
function rawSpriteData(buf, parsed, spriteId) {
  if (spriteId < 1 || spriteId > parsed.count) return null;
  const address = parsed.addresses[spriteId - 1];
  if (address === 0) return null;

  const size = buf.readUInt16LE(address + 3); // pula a cor-chave
  const start = address + 5;
  return buf.subarray(start, start + size);
}

/**
 * Expande os dados RLE em RGBA (1024 px x 4 bytes).
 * `transparent` diz se o fluxo carrega alpha por pixel.
 */
function decode(data, transparent) {
  const out = Buffer.alloc(SPRITE_PIXEL_COUNT * 4); // já zerado = transparente
  if (!data || data.length === 0) return out;

  const bytesPerPixel = transparent ? 4 : 3;
  let read = 0;
  let write = 0;

  while (read < data.length && write < SPRITE_PIXEL_COUNT) {
    const transparentPixels = data.readUInt16LE(read); read += 2;
    if (read >= data.length) break;
    const coloredPixels = data.readUInt16LE(read); read += 2;

    write += transparentPixels; // já estão zerados

    for (let i = 0; i < coloredPixels && write < SPRITE_PIXEL_COUNT; i++) {
      const p = write * 4;
      out[p] = data[read];
      out[p + 1] = data[read + 1];
      out[p + 2] = data[read + 2];
      out[p + 3] = transparent ? data[read + 3] : 0xFF;
      read += bytesPerPixel;
      write++;
    }
  }

  return out;
}

/**
 * Comprime RGBA de volta para RLE. Espelha compressPixels() do Object Builder,
 * inclusive no detalhe que garante round-trip: um chunk só é emitido quando
 * ainda há pixel colorido pela frente. Transparência no fim do sprite não vira
 * chunk — fica implícita.
 */
function encode(rgba, transparent) {
  const chunks = [];
  const length = SPRITE_PIXEL_COUNT;

  let index = 0;
  let alphaCount = 0;

  while (index < length) {
    // corre os transparentes
    let chunkSize = 0;
    while (index < length) {
      const p = index * 4;
      // "color == 0" no original é o ARGB inteiro zerado.
      const isTransparent = rgba[p] === 0 && rgba[p + 1] === 0 && rgba[p + 2] === 0 && rgba[p + 3] === 0;
      if (!isTransparent) break;
      alphaCount++;
      chunkSize++;
      index++;
    }

    if (alphaCount >= length) break; // sprite inteiramente transparente
    if (index >= length) break;      // só sobrou transparência no fim

    const head = Buffer.alloc(4);
    head.writeUInt16LE(chunkSize, 0);

    const colored = [];
    let coloredCount = 0;
    while (index < length) {
      const p = index * 4;
      const isTransparent = rgba[p] === 0 && rgba[p + 1] === 0 && rgba[p + 2] === 0 && rgba[p + 3] === 0;
      if (isTransparent) break;

      const px = Buffer.alloc(transparent ? 4 : 3);
      px[0] = rgba[p];
      px[1] = rgba[p + 1];
      px[2] = rgba[p + 2];
      if (transparent) px[3] = rgba[p + 3];
      colored.push(px);

      coloredCount++;
      index++;
    }

    head.writeUInt16LE(coloredCount, 2);
    chunks.push(head, ...colored);
  }

  return Buffer.concat(chunks);
}

/**
 * Reescreve o .spr trocando os sprites indicados.
 * @param {Map<number, Buffer>} replacements  spriteId (1-based) -> dados RLE já comprimidos
 * @returns {Buffer}
 */
function rebuild(buf, parsed, replacements) {
  const { count, headSize, extended } = parsed;

  const head = Buffer.alloc(headSize);
  head.writeUInt32LE(parsed.signature, 0);
  if (extended) head.writeUInt32LE(count, 4);
  else head.writeUInt16LE(count, 4);

  const table = Buffer.alloc(count * ADDRESS_SIZE);
  const bodies = [];
  let offset = headSize + count * ADDRESS_SIZE;

  for (let id = 1; id <= count; id++) {
    const replaced = replacements.get(id);
    let data;

    if (replaced !== undefined) {
      data = replaced;
    } else {
      data = rawSpriteData(buf, parsed, id);
    }

    if (!data || data.length === 0) {
      table.writeUInt32LE(0, (id - 1) * ADDRESS_SIZE);
      continue;
    }

    table.writeUInt32LE(offset, (id - 1) * ADDRESS_SIZE);

    const entry = Buffer.alloc(5 + data.length);
    entry[0] = 0xFF; entry[1] = 0x00; entry[2] = 0xFF; // cor-chave
    entry.writeUInt16LE(data.length, 3);
    data.copy(entry, 5);

    bodies.push(entry);
    offset += entry.length;
  }

  return Buffer.concat([head, table, ...bodies]);
}

module.exports = {
  parse, rawSpriteData, decode, encode, rebuild,
  SPRITE_PIXELS, SPRITE_PIXEL_COUNT,
};
