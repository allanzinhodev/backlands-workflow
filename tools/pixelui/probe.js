// Read pixels out of a sprite or a client screenshot. The point is to VERIFY a
// UI change numerically instead of squinting at a screenshot: "is this ring
// #ebbf90 or #9a6651" is a question with an exact answer.
//
//   node probe.js info <png>
//   node probe.js row  <png> <y> [x0] [x1]      run-length dump of one row
//   node probe.js col  <png> <x> [y0] [y1]      run-length dump of one column
//   node probe.js at   <png> <x> <y>            one pixel
//   node probe.js ink  <png>                    bounding box of non-transparent pixels
//   node probe.js find <png> <#rrggbb> [tol]    bounding box of a colour (locate a widget)
//   node probe.js crop <png> <out.png> <x> <y> <w> <h> [zoom]
const { readPNG, writePNG, blank, px, setPx, hex } = require('./pngcodec');

function runs(img, fixed, from, to, horizontal) {
  const out = []; let last = null, n = 0;
  for (let i = from; i <= to; i++) {
    const c = horizontal ? hex(img, i, fixed) : hex(img, fixed, i);
    if (c === last) n++; else { if (last !== null) out.push(`${last} x${n} @${i - n}`); last = c; n = 1; }
  }
  out.push(`${last} x${n} @${to - n + 1}`);
  return out;
}

const near = (img, x, y, c, tol) => {
  const p = px(img, x, y);
  return p[3] !== 0 && Math.abs(p[0] - c[0]) <= tol && Math.abs(p[1] - c[1]) <= tol && Math.abs(p[2] - c[2]) <= tol;
};

const [cmd, file, ...rest] = process.argv.slice(2);
if (!cmd || !file) {
  console.log(require('fs').readFileSync(__filename, 'utf8').split('\n').slice(0, 13).join('\n'));
  process.exit(1);
}
const img = readPNG(file);

if (cmd === 'info') {
  console.log(`${file}  ${img.w}x${img.h}`);
} else if (cmd === 'row') {
  const y = +rest[0], x0 = rest[1] !== undefined ? +rest[1] : 0, x1 = rest[2] !== undefined ? +rest[2] : img.w - 1;
  console.log(`row ${y}: ` + runs(img, y, x0, x1, true).join(' | '));
} else if (cmd === 'col') {
  const x = +rest[0], y0 = rest[1] !== undefined ? +rest[1] : 0, y1 = rest[2] !== undefined ? +rest[2] : img.h - 1;
  console.log(`col ${x}: ` + runs(img, x, y0, y1, false).join(' | '));
} else if (cmd === 'at') {
  console.log(hex(img, +rest[0], +rest[1]));
} else if (cmd === 'ink' || cmd === 'find') {
  const tol = cmd === 'find' ? (rest[1] !== undefined ? +rest[1] : 8) : 0;
  const want = cmd === 'find' ? rest[0].replace('#', '').match(/../g).map(v => parseInt(v, 16)) : null;
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, n = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const hit = want ? near(img, x, y, want, tol) : px(img, x, y)[3] > 0;
    if (hit) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) console.log('no match');
  else console.log(`x ${x0}..${x1} (w ${x1 - x0 + 1})  y ${y0}..${y1} (h ${y1 - y0 + 1})  pixels ${n}`);
} else if (cmd === 'crop') {
  const [out, xs, ys, ws, hs, zs] = rest;
  const x0 = +xs, y0 = +ys, w = +ws, h = +hs, z = zs ? +zs : 1;
  const dst = blank(w * z, h * z);
  for (let y = 0; y < h * z; y++) for (let x = 0; x < w * z; x++) {
    const sx = x0 + Math.floor(x / z), sy = y0 + Math.floor(y / z);
    if (sx < img.w && sy < img.h) setPx(dst, x, y, px(img, sx, sy));
  }
  writePNG(dst, out);
  console.log(`${out}  ${dst.w}x${dst.h}  (from ${x0},${y0} ${w}x${h} @${z}x)`);
} else {
  console.log('unknown command: ' + cmd);
  process.exit(1);
}
