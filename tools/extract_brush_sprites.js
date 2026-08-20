// tools/extract_brush_sprites.js
//
// Extrai todas as sprites de cada item de um brush do NexaMap (mapeditor).
//
// Cadeia percorrida (o invariante ServerID != ClientID do AGENTS.md):
//   brush XML (ServerID)  ->  items.otb (ServerID -> ClientID)
//                         ->  Tibia.dat (ClientID -> lista de sprite ids)
//                         ->  Tibia.spr (sprite id -> pixels RLE)  ->  PNG
//
// Uso:
//   node tools/extract_brush_sprites.js "shallow water"
//   node tools/extract_brush_sprites.js "shallow water" --out=D:\saida --no-borders
//
// Nada e escrito nos assets de producao: a ferramenta so le .otb/.dat/.spr.

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SpriteStorage = require('./spr_parser');
const DatStorage = require('./dat_parser');
const OtbStorage = require('./otb_parser');

const WORKSPACE = path.resolve(__dirname, '..');
const MAPEDITOR_DATA = path.join(WORKSPACE, 'mapeditor', 'data', '860');
const CLIENT_THINGS = path.join(WORKSPACE, 'client', 'data', 'things', '860');
const SERVER_ITEMS = path.join(WORKSPACE, 'server', 'data', 'items');

// Arquivos de brush do editor, na ordem em que o materials.xml os inclui.
const BRUSH_FILES = ['grounds.xml', 'borders.xml', 'walls.xml', 'doodads.xml', 'materials.xml'];

const SPRITE_SIZE = 32;

// ---------------------------------------------------------------- XML (leve)

function readAttrs(rawAttrs) {
    const attrs = {};
    const re = /([\w-]+)\s*=\s*"([^"]*)"/g;
    let m;
    while ((m = re.exec(rawAttrs)) !== null) attrs[m[1]] = m[2];
    return attrs;
}

/** Recorta o bloco <tag ...> ... </tag> que comeca em `startIndex`. */
function sliceBlock(xml, startIndex, tag) {
    const tagEnd = xml.indexOf('>', startIndex);
    if (tagEnd === -1) return null;
    if (xml[tagEnd - 1] === '/') return xml.slice(startIndex, tagEnd + 1); // self-closing
    const close = xml.indexOf(`</${tag}>`, tagEnd);
    if (close === -1) return null;
    return xml.slice(startIndex, close + tag.length + 3);
}

/** Procura <brush name="..."> pelo nome exato nos arquivos do editor. */
function findBrush(name) {
    for (const file of BRUSH_FILES) {
        const full = path.join(MAPEDITOR_DATA, file);
        if (!fs.existsSync(full)) continue;

        const xml = fs.readFileSync(full, 'utf8');
        const re = /<brush\s+([^>]*)>/g;
        let m;
        while ((m = re.exec(xml)) !== null) {
            const attrs = readAttrs(m[1]);
            if (attrs.name !== name) continue;
            return { file, attrs, block: sliceBlock(xml, m.index, 'brush') };
        }
    }
    return null;
}

/** Lista os nomes de brush disponiveis (para a mensagem de erro). */
function suggestBrushes(name) {
    const needle = name.toLowerCase();
    const found = [];
    for (const file of BRUSH_FILES) {
        const full = path.join(MAPEDITOR_DATA, file);
        if (!fs.existsSync(full)) continue;
        const re = /<brush\s+([^>]*)>/g;
        const xml = fs.readFileSync(full, 'utf8');
        let m;
        while ((m = re.exec(xml)) !== null) {
            const attrs = readAttrs(m[1]);
            if (attrs.name && attrs.name.toLowerCase().includes(needle)) {
                found.push(`${attrs.name}  (${file}, type=${attrs.type || '?'})`);
            }
        }
    }
    return found;
}

/** Resolve <border id="N"> do borders.xml -> [{ serverId, edge }] */
function loadBorder(borderId) {
    const xml = fs.readFileSync(path.join(MAPEDITOR_DATA, 'borders.xml'), 'utf8');
    const re = /<border\s+([^>]*)>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
        const attrs = readAttrs(m[1]);
        if (attrs.id !== String(borderId)) continue;

        const block = sliceBlock(xml, m.index, 'border') || '';
        const items = [];
        const itemRe = /<borderitem\s+([^>]*?)\/?>/g;
        let im;
        while ((im = itemRe.exec(block)) !== null) {
            const ia = readAttrs(im[1]);
            if (ia.item) items.push({ serverId: parseInt(ia.item, 10), edge: ia.edge || '?' });
        }
        return items;
    }
    return [];
}

// Tags que carregam um ServerID de item dentro de um brush.
// ground/doodad usam <item id=.../>; carpet/wall/table/door poem o id na
// propria tag (ou num <item> aninhado, quando ha chance).
const ITEM_TAGS = new Set(['item', 'carpet', 'wall', 'table', 'door']);

/**
 * Colhe todos os ServerIDs citados pelo bloco do brush.
 * <border id="N"/> nao e item: e referencia a um bloco do borders.xml.
 */
function collectServerIds(block, includeBorders) {
    const entries = [];
    const seen = new Set();

    const push = (serverId, role) => {
        if (!Number.isFinite(serverId) || serverId <= 0) return;
        if (seen.has(serverId)) return;
        seen.add(serverId);
        entries.push({ serverId, role });
    };

    // Contexto do pai (ex.: <carpet align="n"> ... <item id=.../> </carpet>)
    let context = null;
    const tagRe = /<(\/?)(\w+)([^>]*?)(\/?)>/g;
    let m;
    const borderRefs = [];

    while ((m = tagRe.exec(block)) !== null) {
        const closing = m[1] === '/';
        const tag = m[2].toLowerCase();
        const attrs = readAttrs(m[3]);
        const selfClosing = m[4] === '/';

        if (closing) {
            if (tag === context?.tag) context = null;
            continue;
        }

        if (tag === 'border' && attrs.id) {
            borderRefs.push(parseInt(attrs.id, 10));
            continue;
        }

        if (tag === 'brush') continue; // a propria tag do bloco, nao e contexto

        if (!ITEM_TAGS.has(tag)) {
            if (!selfClosing) context = { tag, label: attrs.align || attrs.type || attrs.name || tag };
            continue;
        }

        const label = attrs.align || attrs.type || context?.label || tag;
        const role = tag === 'item' && !context ? 'ground' : `${tag === 'item' ? context?.tag || 'item' : tag}-${label}`;

        if (attrs.id) {
            push(parseInt(attrs.id, 10), role);
        } else if (attrs.fromid) {
            const to = parseInt(attrs.toid, 10);
            for (let id = parseInt(attrs.fromid, 10); id <= to; id++) push(id, role);
        }

        // Uma tag com filhos (<carpet align="n"><item .../></carpet>) vira contexto.
        if (!selfClosing && tag !== 'item') context = { tag, label };
    }

    if (includeBorders) {
        for (const borderId of new Set(borderRefs)) {
            for (const bi of loadBorder(borderId)) {
                push(bi.serverId, `border${borderId}-${bi.edge}`);
            }
        }
    }

    return entries;
}

// ----------------------------------------------------------------- PNG / dat

function writePNG(filePath, rgba, width, height) {
    const png = new PNG({ width, height });
    rgba.copy(png.data);
    fs.writeFileSync(filePath, PNG.sync.write(png));
}

/**
 * Monta a folha de sprites do frame group.
 * Layout portado de ObjectBuilder/src/otlib/things/ThingData.as::getSpriteSheet
 */
function buildSheet(group, spr, transparent) {
    const totalX = group.patternZ * group.patternX * group.layers;
    const totalY = group.frames * group.patternY;
    const sheetW = totalX * group.width * SPRITE_SIZE;
    const sheetH = totalY * group.height * SPRITE_SIZE;

    const png = new PNG({ width: sheetW, height: sheetH });
    png.data.fill(0);

    const spriteIndex = (w, h, l, x, y, z, f) =>
        ((((((f % group.frames) * group.patternZ + z) * group.patternY + y) *
            group.patternX + x) * group.layers + l) * group.height + h) * group.width + w;

    const textureIndex = (l, x, y, z, f) =>
        (((f % group.frames * group.patternZ + z) * group.patternY + y) *
            group.patternX + x) * group.layers + l;

    for (let f = 0; f < group.frames; f++) {
        for (let z = 0; z < group.patternZ; z++) {
            for (let y = 0; y < group.patternY; y++) {
                for (let x = 0; x < group.patternX; x++) {
                    for (let l = 0; l < group.layers; l++) {
                        const ti = textureIndex(l, x, y, z, f);
                        const fx = (ti % totalX) * group.width * SPRITE_SIZE;
                        const fy = Math.floor(ti / totalX) * group.height * SPRITE_SIZE;

                        for (let w = 0; w < group.width; w++) {
                            for (let h = 0; h < group.height; h++) {
                                const sprId = group.sprites[spriteIndex(w, h, l, x, y, z, f)];
                                if (!sprId) continue;
                                const rgba = spr.getSpriteRGBA(sprId, transparent);

                                // ThingData desenha o tile (w,h) invertido nos dois eixos
                                const px = fx + (group.width - w - 1) * SPRITE_SIZE;
                                const py = fy + (group.height - h - 1) * SPRITE_SIZE;

                                for (let row = 0; row < SPRITE_SIZE; row++) {
                                    const src = row * SPRITE_SIZE * 4;
                                    const dst = ((py + row) * sheetW + px) * 4;
                                    rgba.copy(png.data, dst, src, src + SPRITE_SIZE * 4);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return png;
}

// --------------------------------------------------------------------- main

function main() {
    const args = process.argv.slice(2);
    const positional = args.filter(a => !a.startsWith('--'));
    const brushName = positional[0] || 'shallow water';

    let outRoot = path.join(WORKSPACE, 'tools', 'out');
    let includeBorders = true;
    let transparent = false; // Tibia.otfi do 8.60: transparency: false

    for (const arg of args) {
        if (arg.startsWith('--out=')) outRoot = arg.slice(6);
        if (arg === '--no-borders') includeBorders = false;
        if (arg === '--transparent') transparent = true;
    }

    const brush = findBrush(brushName);
    if (!brush) {
        console.error(`Brush "${brushName}" nao encontrado em ${MAPEDITOR_DATA}.`);
        const hints = suggestBrushes(brushName);
        if (hints.length) console.error(`Talvez seja um destes:\n  ${hints.join('\n  ')}`);
        process.exit(1);
    }

    console.log(`\n[BRUSH] "${brushName}" em ${brush.file} (type=${brush.attrs.type}, lookid=${brush.attrs.lookid || '-'})`);

    const entries = collectServerIds(brush.block, includeBorders);
    console.log(`[BRUSH] ${entries.length} itens referenciados (ServerID): ${entries.map(e => e.serverId).join(', ')}\n`);

    // ServerID -> ClientID
    const otb = new OtbStorage();
    otb.load(path.join(SERVER_ITEMS, 'items.otb'));
    const serverToClient = new Map();
    for (const item of otb.items) {
        if (item.attrs[16] && item.attrs[17]) {
            serverToClient.set(item.attrs[16].readUInt16LE(0), item.attrs[17].readUInt16LE(0));
        }
    }

    // ClientID -> sprite ids
    const dat = new DatStorage();
    dat.load(path.join(CLIENT_THINGS, 'Tibia.dat'));

    // sprite id -> pixels
    const spr = new SpriteStorage();
    spr.openRead(path.join(CLIENT_THINGS, 'Tibia.spr'));

    const slug = brushName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const outDir = path.join(outRoot, slug);
    fs.mkdirSync(outDir, { recursive: true });

    const manifest = {
        brush: brushName,
        source: path.join('mapeditor/data/860', brush.file),
        type: brush.attrs.type,
        lookid: brush.attrs.lookid ? parseInt(brush.attrs.lookid, 10) : null,
        extractedAt: new Date().toISOString(),
        assets: {
            otb: path.relative(WORKSPACE, path.join(SERVER_ITEMS, 'items.otb')),
            dat: path.relative(WORKSPACE, path.join(CLIENT_THINGS, 'Tibia.dat')),
            spr: path.relative(WORKSPACE, path.join(CLIENT_THINGS, 'Tibia.spr'))
        },
        items: []
    };

    let totalPNGs = 0;

    for (const entry of entries) {
        const clientId = serverToClient.get(entry.serverId);
        const record = { serverId: entry.serverId, role: entry.role, clientId: clientId || null, sprites: [], files: [] };

        if (!clientId) {
            console.warn(`  ! ServerID ${entry.serverId} (${entry.role}) nao tem ClientID no items.otb — pulando.`);
            record.error = 'sem ClientID no items.otb';
            manifest.items.push(record);
            continue;
        }

        const thing = dat.things.item[clientId - 100];
        if (!thing) {
            console.warn(`  ! ClientID ${clientId} fora do Tibia.dat (${dat.itemsCount} itens) — pulando.`);
            record.error = 'ClientID fora do Tibia.dat';
            manifest.items.push(record);
            continue;
        }

        const group = thing.groups[0];
        const itemDir = path.join(outDir, `${entry.serverId}_${entry.role}`);
        fs.mkdirSync(itemDir, { recursive: true });

        record.geometry = {
            width: group.width, height: group.height, layers: group.layers,
            patternX: group.patternX, patternY: group.patternY, patternZ: group.patternZ,
            frames: group.frames
        };

        // Uma PNG por posicao do frame group, nomeada pelas coordenadas.
        let i = 0;
        for (let f = 0; f < group.frames; f++) {
            for (let z = 0; z < group.patternZ; z++) {
                for (let y = 0; y < group.patternY; y++) {
                    for (let x = 0; x < group.patternX; x++) {
                        for (let l = 0; l < group.layers; l++) {
                            for (let h = 0; h < group.height; h++) {
                                for (let w = 0; w < group.width; w++) {
                                    const sprId = group.sprites[i++];
                                    record.sprites.push(sprId);
                                    if (!sprId) continue;

                                    const name = `f${f}_z${z}_y${y}_x${x}_l${l}_h${h}_w${w}__spr${sprId}.png`;
                                    const rgba = spr.getSpriteRGBA(sprId, transparent);
                                    writePNG(path.join(itemDir, name), rgba, SPRITE_SIZE, SPRITE_SIZE);
                                    record.files.push(name);
                                    totalPNGs++;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Folha de sprites do item (mesmo layout do Object Builder).
        const sheet = buildSheet(group, spr, transparent);
        fs.writeFileSync(path.join(itemDir, 'sheet.png'), PNG.sync.write(sheet));
        record.sheet = `${entry.serverId}_${entry.role}/sheet.png`;

        const uniques = new Set(record.sprites.filter(Boolean)).size;
        console.log(`  srv ${String(entry.serverId).padStart(5)} -> cli ${String(clientId).padStart(5)}  ${entry.role.padEnd(16)} ${record.files.length} png (${uniques} sprite ids unicos)`);
        manifest.items.push(record);
    }

    spr.close();

    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`\n[OK] ${totalPNGs} PNGs + ${manifest.items.filter(it => it.sheet).length} folhas em ${outDir}`);
    console.log(`[OK] manifest.json com o mapeamento ServerID -> ClientID -> sprite ids.`);
}

main();
