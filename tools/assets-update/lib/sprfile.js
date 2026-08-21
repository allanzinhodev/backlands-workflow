'use strict';
// Acesso aleatorio ao Tibia.spr — abre, le e grava sprites individuais sem
// carregar os 432 MB do arquivo na memoria.
//
// O codec RLE nao e reimplementado aqui: vem de tools/sprites/spr.js, que e a
// porta de objectbuilder/src/otlib/sprites/Sprite.as e ja passa no round-trip.
// Este modulo cuida so de posicionamento no arquivo.
//
// Layout:
//   u32 assinatura | u32 contagem | tabela (contagem x u32) | corpos
//
// Gravacao por acrescimo: o corpo novo vai para o fim do arquivo e so o
// endereco de 4 bytes na tabela muda. E valido porque tanto o cliente quanto o
// editor buscam o corpo pelo endereco da tabela, nunca pela ordem:
//   client/src/client/spritemanager.cpp:614  -> seek(spriteAddress)
//   mapeditor/source/graphics.cpp:1377       -> seek(sprite_offset + 3)
// O corpo antigo continua no arquivo (orfao) — e o que torna o revert exato.

const fs = require('fs');
const codec = require('../../sprites/spr');

const ADDRESS_SIZE = 4;
const ENTRY_HEADER = 5; // 3 bytes de cor-chave + u16 com o tamanho

function readAt(fd, length, position) {
  const buf = Buffer.alloc(length);
  let got = 0;
  while (got < length) {
    const n = fs.readSync(fd, buf, got, length - got, position + got);
    if (n === 0) break;
    got += n;
  }
  if (got !== length) {
    throw new Error(`leitura curta no .spr: ${got}/${length} bytes em ${position}`);
  }
  return buf;
}

class SprFile {
  /**
   * @param {string} filePath
   * @param {{extended:boolean, transparency:boolean}} features  vindas do Tibia.otfi
   * @param {boolean} writable
   */
  constructor(filePath, features, writable = false) {
    this.filePath = filePath;
    this.extended = !!features.extended;
    this.transparent = !!features.transparency;
    this.fd = fs.openSync(filePath, writable ? 'r+' : 'r');
    this.writable = writable;

    const head = readAt(this.fd, 8, 0);
    this.signature = head.readUInt32LE(0);
    this.count = this.extended ? head.readUInt32LE(4) : head.readUInt16LE(4);
    this.headSize = this.extended ? 8 : 6;
    this.table = readAt(this.fd, this.count * ADDRESS_SIZE, this.headSize);
    this.size = fs.fstatSync(this.fd).size;
    this.appendedBytes = 0;
  }

  addressOf(id) {
    if (id < 1 || id > this.count) throw new Error(`sprite id ${id} fora do .spr (1..${this.count})`);
    return this.table.readUInt32LE((id - 1) * ADDRESS_SIZE);
  }

  /** Bytes RLE crus do sprite, ou null quando vazio. */
  readRaw(id) {
    const address = this.addressOf(id);
    if (address === 0) return null;
    const header = readAt(this.fd, ENTRY_HEADER, address);
    const size = header.readUInt16LE(3);
    if (size === 0) return Buffer.alloc(0);
    return readAt(this.fd, size, address + ENTRY_HEADER);
  }

  /** Bytes RLE crus num endereco arbitrario — usado para conferir o revert. */
  readRawAt(address) {
    if (!address || address + ENTRY_HEADER > this.size) return null;
    const header = readAt(this.fd, ENTRY_HEADER, address);
    const size = header.readUInt16LE(3);
    if (address + ENTRY_HEADER + size > this.size) return null;
    return size === 0 ? Buffer.alloc(0) : readAt(this.fd, size, address + ENTRY_HEADER);
  }

  /** RGBA 32x32 (4096 bytes). Sprite vazio devolve tudo zerado. */
  readRGBA(id) {
    return codec.decode(this.readRaw(id), this.transparent);
  }

  decodeRaw(raw) {
    return codec.decode(raw, this.transparent);
  }

  /**
   * Troca os pixels de um sprite ja existente. Grava o corpo novo no fim do
   * arquivo e reaponta o endereco. Devolve os bytes RLE anteriores, para revert.
   */
  writeRGBA(id, rgba) {
    if (!this.writable) throw new Error('SprFile aberto so para leitura');
    if (rgba.length !== codec.SPRITE_PIXEL_COUNT * 4) {
      throw new Error(`RGBA deve ter ${codec.SPRITE_PIXEL_COUNT * 4} bytes, veio ${rgba.length}`);
    }
    const previous = { address: this.addressOf(id), raw: this.readRaw(id) };
    const data = codec.encode(rgba, this.transparent);

    if (data.length === 0) {
      this.setAddress(id, 0); // sprite inteiramente transparente = vazio
      return previous;
    }

    const entry = Buffer.alloc(ENTRY_HEADER + data.length);
    entry[0] = 0xFF; entry[1] = 0x00; entry[2] = 0xFF; // cor-chave, ignorada na leitura
    entry.writeUInt16LE(data.length, 3);
    data.copy(entry, ENTRY_HEADER);

    const at = this.size;
    fs.writeSync(this.fd, entry, 0, entry.length, at);
    this.size += entry.length;
    this.appendedBytes += entry.length;
    this.setAddress(id, at);
    return previous;
  }

  /** Regrava um corpo RLE cru num endereco (usado pelo revert). */
  writeRaw(id, raw) {
    if (!this.writable) throw new Error('SprFile aberto so para leitura');
    if (raw === null || raw.length === 0) {
      this.setAddress(id, 0);
      return;
    }
    const entry = Buffer.alloc(ENTRY_HEADER + raw.length);
    entry[0] = 0xFF; entry[1] = 0x00; entry[2] = 0xFF;
    entry.writeUInt16LE(raw.length, 3);
    raw.copy(entry, ENTRY_HEADER);

    const at = this.size;
    fs.writeSync(this.fd, entry, 0, entry.length, at);
    this.size += entry.length;
    this.appendedBytes += entry.length;
    this.setAddress(id, at);
  }

  setAddress(id, address) {
    const slot = (id - 1) * ADDRESS_SIZE;
    this.table.writeUInt32LE(address, slot);
    const four = Buffer.alloc(ADDRESS_SIZE);
    four.writeUInt32LE(address, 0);
    fs.writeSync(this.fd, four, 0, ADDRESS_SIZE, this.headSize + slot);
  }

  close() {
    if (this.writable) fs.fsyncSync(this.fd);
    fs.closeSync(this.fd);
    this.fd = -1;
  }
}

module.exports = { SprFile };
