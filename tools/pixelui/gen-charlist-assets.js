// Generates the sprites the character list needs, into
// client/data/images/ui/login/. Everything here is built from the same palette
// and 2px block grid as the login screen - no new colours, no new fonts.
//
//   node tools/pixelui/gen-charlist-assets.js
//
// Why the buttons are 9-slice plates with no baked label: the login buttons
// carry their text baked into the sprite, which pins them to one width. The
// footer here needs two half-width buttons, and the only Press Start 2P sheet
// available is 16px monospace - "ENTER GAME" is 10x16 = 160px, wider than the
// 147px a half-width button gets. So the plate is drawn without text and OTUI
// centres a live silkscreen-16 label on it, which also keeps tr() working.
const path = require('path');
const { writePNG, blank, setPx } = require('./pngcodec');

const DST = path.join(__dirname, '..', '..', 'client', 'data', 'images', 'ui', 'login');
const C = {
  ink: [0x00, 0x00, 0x00], goldDk: [0x4e, 0x2f, 0x24], goldMid: [0x9a, 0x66, 0x51],
  gold: [0xc6, 0x8f, 0x66], goldHi: [0xeb, 0xbf, 0x90], panelDk: [0x15, 0x0e, 0x0c],
  secTop: [0x27, 0x21, 0x1f], secBot: [0x0e, 0x09, 0x08],
  secHover: [0x3b, 0x28, 0x23], secHoverTop: [0x4a, 0x39, 0x34], secHoverBot: [0x26, 0x1a, 0x17],
};
const rgba = (c, a = 255) => Buffer.from([c[0], c[1], c[2], a]);
const log = [];
const emit = (name, img) => { writePNG(img, path.join(DST, name)); log.push(name.padEnd(30) + img.w + 'x' + img.h); };

// A button plate: horizontal colour bands, drawn 16px wide so it can be
// 9-sliced to any width. `shadow` adds the 2px drop shadow inset 4px per side.
function plate(name, bands, shadow) {
  const W = 16;
  const H = bands.reduce((a, b) => a + b[1], 0) + (shadow ? 2 : 0);
  const img = blank(W, H);
  let y = 0;
  for (const [colour, h] of bands) {
    const p = rgba(colour);
    for (let j = 0; j < h; j++, y++) for (let x = 0; x < W; x++) setPx(img, x, y, p);
  }
  if (shadow) {
    const p = rgba(C.ink);
    for (let j = 0; j < 2; j++, y++) for (let x = 4; x < W - 4; x++) setPx(img, x, y, p);
  }
  emit(name, img);
}

// primary: gold-dk 2 | ink 2 | gold-hi 2 | fill 28 | gold-mid 2 | ink 2 | gold-dk 2 [| shadow 2]
plate('btn-primary.png',
  [[C.goldDk, 2], [C.ink, 2], [C.goldHi, 2], [C.gold, 28], [C.goldMid, 2], [C.ink, 2], [C.goldDk, 2]], true);
plate('btn-primary-hover.png',
  [[C.goldDk, 2], [C.ink, 2], [C.goldHi, 2], [C.goldHi, 28], [C.goldMid, 2], [C.ink, 2], [C.goldDk, 2]], true);
plate('btn-primary-pressed.png',
  [[C.goldDk, 2], [C.ink, 2], [C.goldHi, 2], [C.gold, 28], [C.goldMid, 2], [C.ink, 2], [C.goldDk, 2]], false);

// secondary: same rings, dark fill, 34 tall
plate('btn-secondary.png',
  [[C.goldDk, 2], [C.ink, 2], [C.secTop, 2], [C.panelDk, 22], [C.secBot, 2], [C.ink, 2], [C.goldDk, 2]], false);
plate('btn-secondary-hover.png',
  [[C.goldDk, 2], [C.ink, 2], [C.secHoverTop, 2], [C.secHover, 22], [C.secHoverBot, 2], [C.ink, 2], [C.goldDk, 2]], false);

// selection arrow, 6x10 on the 2px grid: rows 2,4,6,4,2 wide, left aligned
{
  const img = blank(6, 10);
  const widths = [2, 4, 6, 4, 2];
  const p = rgba(C.goldHi);
  widths.forEach((w, row) => {
    for (let j = 0; j < 2; j++) for (let x = 0; x < w; x++) setPx(img, x, row * 2 + j, p);
  });
  emit('list-arrow.png', img);
}

// scrollbar pieces: 8 wide, no arrow buttons
{
  // track: 2px black edge each side, #0a0605 middle. 8x8 and not 8x4: with
  // image-border 2 a 4px-tall sprite leaves a zero-height centre, so the 9-slice
  // draws nothing between the corners and the track vanishes below the thumb.
  const t = blank(8, 8);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++)
    setPx(t, x, y, rgba(x < 2 || x >= 6 ? C.ink : [0x0a, 0x06, 0x05]));
  emit('scroll-track.png', t);

  // thumb: 2px black sides, gold-mid body (gold on hover)
  for (const [name, body] of [['scroll-thumb.png', C.goldMid], ['scroll-thumb-hover.png', C.gold]]) {
    const th = blank(8, 8);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++)
      setPx(th, x, y, rgba(x < 2 || x >= 6 ? C.ink : body));
    emit(name, th);
  }
}

console.log(log.join('\n'));
