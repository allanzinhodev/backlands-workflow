// Encoder PNG minimo (RGBA8888, sem interlace), usando so o zlib do Node.
// Existe para nao acrescentar dependencia de imagem ao ui-simulator por causa da extracao.

import zlib from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

/**
 * @param {Buffer} rgba pixels RGBA row-major, tamanho = width * height * 4
 */
export function encodePNG(rgba, width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Cada scanline leva um byte de filtro na frente; filtro 0 (None) e suficiente para sprites 32x32.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Compoe varios sprites 32x32 numa folha unica, na horizontal. */
export function composeStrip(sprites, spriteSize = 32) {
  const width = spriteSize * sprites.length;
  const out = Buffer.alloc(width * spriteSize * 4);
  sprites.forEach((sprite, index) => {
    for (let y = 0; y < spriteSize; y++) {
      const from = y * spriteSize * 4;
      const to = (y * width + index * spriteSize) * 4;
      sprite.copy(out, to, from, from + spriteSize * 4);
    }
  });
  return { rgba: out, width, height: spriteSize };
}
