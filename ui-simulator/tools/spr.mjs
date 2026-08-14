// Leitor do Tibia.spr 8.60 (extended, transparency = false).
//
// O arquivo tem 452 MB: NADA aqui carrega ele inteiro. Abre com file descriptor, le o header e a
// tabela de offsets uma vez (~1,9 MB) e depois faz leituras pontuais por sprite.

import fs from 'node:fs';

export const SPR_SIGNATURE_860 = 0x4c220594;
export const SPRITE_SIZE = 32;
export const SPRITE_PIXELS = SPRITE_SIZE * SPRITE_SIZE;
export const SPRITE_RGBA_BYTES = SPRITE_PIXELS * 4;

export class SpriteFile {
  /**
   * @param {string} path caminho do Tibia.spr
   * @param {object} options.extended ids u32 (true em 8.60 desta instalacao)
   * @param {object} options.transparency canal alpha vindo do arquivo (false aqui)
   */
  constructor(path, { extended = true, transparency = false } = {}) {
    this.path = path;
    this.extended = extended;
    this.transparency = transparency;
    this.fd = fs.openSync(path, 'r');
    this.cache = new Map();

    const header = Buffer.alloc(8);
    fs.readSync(this.fd, header, 0, 8, 0);

    this.signature = header.readUInt32LE(0);
    if (this.signature !== SPR_SIGNATURE_860) {
      this.close();
      throw new Error(
        `assinatura do .spr inesperada: 0x${this.signature.toString(16).toUpperCase()} (esperado 0x4C220594)`
      );
    }

    // Com extended a contagem e u32 e a tabela comeca em 8; sem extended seria u16 e comecaria em 6.
    this.spriteCount = extended ? header.readUInt32LE(4) : header.readUInt16LE(4);
    this.tableOffset = extended ? 8 : 6;

    const tableBytes = this.spriteCount * 4;
    this.table = Buffer.alloc(tableBytes);
    fs.readSync(this.fd, this.table, 0, tableBytes, this.tableOffset);
  }

  close() {
    if (this.fd !== undefined) {
      fs.closeSync(this.fd);
      this.fd = undefined;
    }
  }

  /** Endereco do bloco do sprite. Ids sao 1-based; 0 significa sprite vazio. */
  addressOf(spriteId) {
    if (spriteId < 1 || spriteId > this.spriteCount) return 0;
    return this.table.readUInt32LE((spriteId - 1) * 4);
  }

  /**
   * Decodifica um sprite para RGBA 32x32 (row-major).
   * Sprite inexistente ou vazio devolve buffer totalmente transparente -- nao e erro.
   */
  getSpriteRGBA(spriteId) {
    if (this.cache.has(spriteId)) return this.cache.get(spriteId);

    const out = Buffer.alloc(SPRITE_RGBA_BYTES); // zerado = transparente
    const address = this.addressOf(spriteId);
    if (address === 0) {
      this.cache.set(spriteId, out);
      return out;
    }

    // 3 bytes de color key (descartados) + u16 com o tamanho dos dados RLE
    const head = Buffer.alloc(5);
    fs.readSync(this.fd, head, 0, 5, address);
    const dataSize = head.readUInt16LE(3);
    if (dataSize === 0) {
      this.cache.set(spriteId, out);
      return out;
    }

    const data = Buffer.alloc(dataSize);
    fs.readSync(this.fd, data, 0, dataSize, address + 5);

    const channels = this.transparency ? 4 : 3;
    let p = 0;
    let read = 0;
    let w = 0; // offset em BYTES no buffer RGBA

    while (read < dataSize && w < SPRITE_RGBA_BYTES) {
      const transparent = data.readUInt16LE(p);
      p += 2;
      const colored = data.readUInt16LE(p);
      p += 2;
      read += 4 + colored * channels;

      w += transparent * 4; // ja e (0,0,0,0)

      for (let i = 0; i < colored && w < SPRITE_RGBA_BYTES; i++) {
        out[w] = data[p];
        out[w + 1] = data[p + 1];
        out[w + 2] = data[p + 2];
        out[w + 3] = this.transparency ? data[p + 3] : 0xff;
        p += channels;
        w += 4;
      }
    }

    this.cache.set(spriteId, out);
    return out;
  }

  /** Metadados do bloco, uteis para conferir contra a tabela de regressao da spec. */
  inspect(spriteId) {
    const address = this.addressOf(spriteId);
    if (address === 0) return { spriteId, address: 0, dataSize: 0, chunks: 0, pixelsWritten: 0 };

    const head = Buffer.alloc(5);
    fs.readSync(this.fd, head, 0, 5, address);
    const keyColor = [head[0], head[1], head[2]];
    const dataSize = head.readUInt16LE(3);

    const data = Buffer.alloc(dataSize);
    fs.readSync(this.fd, data, 0, dataSize, address + 5);

    const channels = this.transparency ? 4 : 3;
    let p = 0;
    let read = 0;
    let chunks = 0;
    let pixelsWritten = 0;
    while (read < dataSize) {
      const transparent = data.readUInt16LE(p);
      p += 2;
      const colored = data.readUInt16LE(p);
      p += 2;
      read += 4 + colored * channels;
      p += colored * channels;
      pixelsWritten += transparent + colored;
      chunks++;
    }

    return { spriteId, address, keyColor, dataSize, chunks, pixelsWritten };
  }
}
