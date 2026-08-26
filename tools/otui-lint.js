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

  lines.forEach((raw, i) => {
    const n = i + 1;
    let sp = 0; while (raw[sp] === ' ') sp++;

    if (raw[sp] === '\t') { console.log(`${file}:${n}: tab indentation (OTML rejects tabs)`); ok = false; problems++; return; }
    if (sp % 2 !== 0) { console.log(`${file}:${n}: indent of ${sp} is not a multiple of 2`); ok = false; problems++; return; }

    const t = raw.trim();
    if (t === '' || t.startsWith('//')) return;   // parser skips these before using depth

    const d = sp / 2;
    if (d > depth + 1) { console.log(`${file}:${n}: depth jumps ${depth} -> ${d}  |${raw}`); ok = false; problems++; }
    depth = d;

    const isPair = /^[!@&]?[A-Za-z0-9_.\-$]+\s*:/.test(t);
    const isNode = /^[A-Za-z][A-Za-z0-9_]*(\s*<\s*[A-Za-z][A-Za-z0-9_]*)?$/.test(t);
    const isState = t.startsWith('$');
    if (!isPair && !isNode && !isState) { console.log(`${file}:${n}: unrecognised syntax  |${t}`); ok = false; problems++; }
  });

  console.log((ok ? 'OK   ' : 'FAIL ') + file);
}
process.exit(problems ? 1 : 0);
