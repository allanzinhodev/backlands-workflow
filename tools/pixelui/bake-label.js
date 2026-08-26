// Bake a fixed label into a PNG from one of the ui-login bitmap font sheets.
//
// Use for labels that never change (screen titles, section headings). Anything
// the player or a translation can change must stay live text in OTUI - baked
// type cannot be re-rendered and cannot be scaled.
//
//   node tools/pixelui/bake-label.js <sheet.png> <meta.json> "TEXT" <out.png> <#rrggbb> [shadowPx] [#shadow]
//
// Example - the character list title, gold-hi with a 2px black drop shadow:
//   node tools/pixelui/bake-label.js ui-login/fonts/press-start-2p-16.png \
//     ui-login/fonts/press-start-2p-16.json "CHARACTERS" \
//     client/data/images/ui/login/label-characters.png "#ebbf90" 2 "#000000"
//
// The sheets are a 16x6 grid of 16px cells covering ASCII 32..126, drawn white
// so they can be tinted. Advances come from the .json next to the sheet.
const fs = require('fs');
const { readPNG, writePNG, blank, px, setPx } = require('./pngcodec');

const [sheetPath, metaPath, text, outPath, colourArg, shadowArg, shadowColourArg] = process.argv.slice(2);
if (!outPath) {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(0, 16).join('\n'));
  process.exit(1);
}

const hexToRgb = h => h.replace('#', '').match(/../g).map(v => parseInt(v, 16));
const colour = hexToRgb(colourArg);
const shadow = shadowArg ? Number(shadowArg) : 0;
const shadowColour = hexToRgb(shadowColourArg || '#000000');

const sheet = readPNG(sheetPath);
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const CELL = meta.cellWidth || 16, COLS = meta.columns || 16, FIRST = meta.firstChar || 32;
const adv = ch => (meta.advance && meta.advance[ch] !== undefined) ? meta.advance[ch] : CELL;

const width = [...text].reduce((a, c) => a + adv(c), 0);
const height = (meta.cellHeight || 16) + shadow;
const out = blank(width, height);

// shadow first, then the glyph on top, so overlapping glyphs stay clean
for (const pass of (shadow ? ['shadow', 'ink'] : ['ink'])) {
  const c = pass === 'shadow' ? shadowColour : colour;
  const dy = pass === 'shadow' ? shadow : 0;
  let cx = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= FIRST && code <= (meta.lastChar || 126)) {
      const g = code - FIRST, sx = (g % COLS) * CELL, sy = Math.floor(g / COLS) * CELL;
      for (let y = 0; y < (meta.cellHeight || 16); y++) for (let x = 0; x < CELL; x++) {
        const a = px(sheet, sx + x, sy + y)[3];
        if (a > 0) setPx(out, cx + x, y + dy, Buffer.from([c[0], c[1], c[2], a]));
      }
    }
    cx += adv(ch);
  }
}

writePNG(out, outPath);
console.log(`${outPath}  ${out.w}x${out.h}  "${text}"`);
