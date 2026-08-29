// Structural lint for OTML files (.otui / .otfont / .otmod), matching what
// OTMLParser actually enforces before the client will load them:
//
//   - indentation is a multiple of 2 spaces        (getLineDepth: "must indent every 2 spaces")
//   - no tab indentation                           (getLineDepth: throws outright)
//   - depth never jumps more than one level down   (parseLine: "invalid indentation depth")
//   - every non-comment line is a node or a key: value pair
//
// A file that fails here fails in the client with a parse exception, so run it
// before launching. Comment lines (`//`) are skipped by the parser regardless of
// their indentation.
//
// `key: |` (also `|-` and `|+`) opens a multi-line value: every following line
// indented deeper than the key is raw text, and OTMLParser::getLineDepth skips
// its tab and 2-space checks for exactly those lines. The block ends at the
// first non-empty line back at or above the key's depth. Files that embed Lua
// this way - most of mods/client_settings/options/ - used to report every
// embedded statement as "unrecognised syntax", which made the lint step
// worthless on them.
//
//   node tools/otui-lint.js <file> [more files ...]
const fs = require('fs');

const files = process.argv.slice(2);
if (!files.length) {
  console.log('usage: node tools/otui-lint.js <file.otui> [...]');
  process.exit(1);
}

let problems = 0;
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let depth = 0, ok = true;
  let blockDepth = null;   // depth of the `key: |` line while inside its value

  lines.forEach((raw, i) => {
    const n = i + 1;
    let sp = 0; while (raw[sp] === ' ') sp++;
    const t = raw.trim();

    if (blockDepth !== null) {
      // Blank lines stay inside the block; the parser only ends it on a
      // non-empty line back at or above the key's depth.
      if (t === '') return;
      if (Math.floor(sp / 2) > blockDepth) return;   // raw content, unchecked
      blockDepth = null;                             // fall through and parse this line
    }

    if (raw[sp] === '\t') { console.log(`${file}:${n}: tab indentation (OTML rejects tabs)`); ok = false; problems++; return; }
    if (sp % 2 !== 0) { console.log(`${file}:${n}: indent of ${sp} is not a multiple of 2`); ok = false; problems++; return; }

    if (t === '' || t.startsWith('//')) return;   // parser skips these before using depth

    const d = sp / 2;
    if (d > depth + 1) { console.log(`${file}:${n}: depth jumps ${depth} -> ${d}  |${raw}`); ok = false; problems++; }
    depth = d;

    // OTMLParser::parseNode splits a line three ways, and this mirrors it:
    //   starts with '-'  -> anonymous list item (load-later, scripts, ...)
    //   contains ':'     -> tag: value
    //   otherwise        -> a bare tag, optionally `Child < Parent`
    // A state selector may drop its colon: UIWidget only ever reads the node's
    // tag ($hover, $hover !disabled), so `$disabled` and `$disabled:` behave the
    // same and both appear in the tree.
    const isListItem = t.startsWith('-');
    const isPair = t.includes(':');
    const isNode = /^[$A-Za-z_][A-Za-z0-9_.$! -]*(\s*<\s*[A-Za-z_][A-Za-z0-9_]*)?$/.test(t);
    if (!isListItem && !isPair && !isNode) { console.log(`${file}:${n}: unrecognised syntax  |${t}`); ok = false; problems++; return; }

    if (isPair && /:\s*\|[-+]?\s*$/.test(t)) blockDepth = d;
  });

  console.log((ok ? 'OK   ' : 'FAIL ') + file);
}
process.exit(problems ? 1 : 0);
