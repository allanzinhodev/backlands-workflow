// Re-emit block-grid pixel art at a different block size.
//
// This is NOT a resampler. Art authored on an N-px block grid is read one block
// at a time and redrawn as an M-px block, so the result has no new colours, no
// partial blocks and no blur - it is the same drawing at a different unit. That
// is the only way to resize the Backlands UI chrome and keep it pixel-exact.
//
// Rasterised TEXT is never on a block grid: it will not survive this. Baked
// labels and bitmap-font sheets must stay at 1:1.
//
//   node blockscale.js detect <in.png>
//   node blockscale.js scale  <in.png> <out.png> <fromUnit> <toUnit>
//
// Examples:
//   node blockscale.js detect ui-login/panel/panel-frame.png
//   node blockscale.js scale  ui-login/widgets/input-field.png field.png 4 2   # half
//   node blockscale.js scale  ui-login/panel/ornament-crest.png crest.png 4 5  # 1.25x
const { readPNG, writePNG, blank, px, setPx } = require('./pngcodec');

function uniformAt(img, unit) {
  if (img.w % unit || img.h % unit) return false;
  for (let y = 0; y < img.h; y += unit) for (let x = 0; x < img.w; x += unit) {
    const p = px(img, x, y);
    for (let dy = 0; dy < unit; dy++) for (let dx = 0; dx < unit; dx++)
      if (!px(img, x + dx, y + dy).equals(p)) return false;
  }
  return true;
}

function detect(img) {
  for (const u of [8, 4, 2]) if (uniformAt(img, u)) return u;
  return 1;
}

function scale(src, from, to) {
  if (src.w % from || src.h % from)
    throw new Error(`size ${src.w}x${src.h} is not a multiple of the ${from}px block grid`);
  if (!uniformAt(src, from))
    throw new Error(`art is not uniform on a ${from}px block grid - rescaling would destroy detail`);
  const bw = src.w / from, bh = src.h / from;
  const out = blank(bw * to, bh * to);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    const p = px(src, bx * from, by * from);
    for (let y = 0; y < to; y++) for (let x = 0; x < to; x++) setPx(out, bx * to + x, by * to + y, p);
  }
  return out;
}

const [cmd, a, b, c, d] = process.argv.slice(2);
if (cmd === 'detect') {
  const img = readPNG(a);
  const u = detect(img);
  console.log(`${a}  ${img.w}x${img.h}  block grid: ${u}px` +
    (u === 1 ? '  (irregular - rasterised text? do not rescale)' : ''));
} else if (cmd === 'scale') {
  const src = readPNG(a);
  const out = scale(src, Number(c), Number(d));
  writePNG(out, b);
  console.log(`${a} ${src.w}x${src.h} (${c}px blocks) -> ${b} ${out.w}x${out.h} (${d}px blocks)`);
} else {
  console.log('usage:\n  node blockscale.js detect <in.png>\n  node blockscale.js scale <in.png> <out.png> <fromUnit> <toUnit>');
  process.exit(1);
}
