// Minimal dependency-free PNG reader/writer for the Backlands pixel-art UI
// pipeline. Decodes to plain RGBA and re-encodes with filter 0, so a sprite
// that goes through it round-trips byte-exactly in pixel terms.
//
// Only 8-bit depth is supported (every asset in ui-login/ is 8-bit).
const fs = require('fs');
const zlib = require('zlib');

function readPNG(file) {
  const buf = fs.readFileSync(file);
  let off = 8, idat = [], ihdr = null, plte = null, trns = null;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], color: data[9] };
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    off += 12 + len;
  }
  if (!ihdr) throw new Error(file + ': no IHDR');
  if (ihdr.depth !== 8) throw new Error(file + ': bit depth ' + ihdr.depth + ' unsupported (need 8)');

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.color];
  const stride = ihdr.w * bpp;
  const out = Buffer.alloc(ihdr.h * stride);
  let pos = 0;
  for (let y = 0; y < ihdr.h; y++) {
    const ft = raw[pos++];
    const line = raw.slice(pos, pos + stride); pos += stride;
    const cur = out.slice(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.slice((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0, v = line[x];
      let r;
      switch (ft) {
        case 0: r = v; break;
        case 1: r = v + a; break;
        case 2: r = v + b; break;
        case 3: r = v + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          r = v + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c)); break;
        }
        default: throw new Error(file + ': unknown filter ' + ft);
      }
      cur[x] = r & 255;
    }
  }

  const rgba = Buffer.alloc(ihdr.w * ihdr.h * 4);
  for (let i = 0; i < ihdr.w * ihdr.h; i++) {
    let r, g, b, a = 255;
    if (ihdr.color === 6) { r = out[i * 4]; g = out[i * 4 + 1]; b = out[i * 4 + 2]; a = out[i * 4 + 3]; }
    else if (ihdr.color === 2) { r = out[i * 3]; g = out[i * 3 + 1]; b = out[i * 3 + 2]; }
    else if (ihdr.color === 0) { r = g = b = out[i]; }
    else if (ihdr.color === 4) { r = g = b = out[i * 2]; a = out[i * 2 + 1]; }
    else { const k = out[i]; r = plte[k * 3]; g = plte[k * 3 + 1]; b = plte[k * 3 + 2]; a = trns && k < trns.length ? trns[k] : 255; }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = a;
  }
  return { w: ihdr.w, h: ihdr.h, data: rgba };
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  if (!crc32.t) {
    crc32.t = [];
    for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc32.t[n] = c >>> 0; }
  }
  for (let i = 0; i < buf.length; i++) crc = crc32.t[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function writePNG(img, file) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const stride = img.w * 4;
  const raw = Buffer.alloc(img.h * (stride + 1));
  for (let y = 0; y < img.h; y++) {
    raw[y * (stride + 1)] = 0;
    img.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
  if (file) fs.writeFileSync(file, png);
  return png;
}

const blank = (w, h) => ({ w, h, data: Buffer.alloc(w * h * 4) });
const px = (img, x, y) => img.data.slice((y * img.w + x) * 4, (y * img.w + x) * 4 + 4);
const setPx = (img, x, y, p) => p.copy(img.data, (y * img.w + x) * 4);
const hex = (img, x, y) => {
  const p = px(img, x, y);
  return p[3] === 0 ? 'clear' : '#' + [0, 1, 2].map(k => p[k].toString(16).padStart(2, '0')).join('');
};

module.exports = { readPNG, writePNG, blank, px, setPx, hex };
