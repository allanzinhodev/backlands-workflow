import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseDat, spriteIndex, stackPattern } from '../tools/dat.mjs';
import { SpriteFile } from '../tools/spr.mjs';
import { encodePNG } from '../tools/png.mjs';

// Estes testes leem os assets reais do cliente (somente leitura). Se o Tibia.dat/.spr nao estiver
// no lugar, eles sao pulados em vez de quebrar a suite -- o extrator e opcional para quem so
// mexe na UI.
const THINGS = path.resolve(import.meta.dirname, '../../client/data/things/860');
const DAT = path.join(THINGS, 'Tibia.dat');
const SPR = path.join(THINGS, 'Tibia.spr');
const hasAssets = fs.existsSync(DAT) && fs.existsSync(SPR);

describe.skipIf(!hasAssets)('Tibia.dat (8.60 v2, MetadataReader5)', () => {
  let dat;

  beforeAll(() => {
    dat = parseDat(fs.readFileSync(DAT));
  });

  it('a travessia completa termina exatamente no fim do arquivo', () => {
    // Este e o teste que prova o parser inteiro: tabela de flags, terminador 0xFF, exactSize
    // condicional, bloco de animacao e sprite ids u32. Um erro de 1 byte dessincronizaria.
    expect(dat.endPosition).toBe(dat.fileLength);
    expect(dat.fileLength).toBe(5407372);
  });

  it('le a assinatura e as contagens do header', () => {
    expect(dat.signature).toBe(0x4c2c7993);
    expect(dat.counts.items).toBe(54751);
    expect(dat.counts.outfits).toBe(1975);
    expect(dat.counts.effects).toBe(349);
    expect(dat.counts.missiles).toBe(82);
  });

  it('itemsCount e o ULTIMO id, nao a quantidade', () => {
    expect(dat.items.size).toBe(54751 - 100 + 1);
    expect(dat.items.has(100)).toBe(true);
    expect(dat.items.has(54751)).toBe(true);
    expect(dat.items.has(99)).toBe(false);
  });

  it('item 100 tem as flags do exemplo trabalhado da spec', () => {
    const thing = dat.items.get(100);
    expect(thing.flags.ground).toBe(true);
    expect(thing.flags.groundSpeed).toBe(0);
    expect(thing.flags.unpassable).toBe(true);
    expect(thing.flags.unmoveable).toBe(true);
    expect(thing.flags.blockMissile).toBe(true);
    expect(thing.flags.light).toEqual({ level: 3, color: 156 });
    expect(thing.flags.fullGround).toBe(true);

    const group = thing.groups[0];
    expect(group).toMatchObject({ width: 1, height: 1, layers: 1, patternX: 4, patternY: 4, patternZ: 1, frames: 1 });
    expect(group.spriteIds).toHaveLength(16);
  });

  it('reconhece os itens do simulador com os sprite ids esperados', () => {
    expect(dat.items.get(2854).groups[0].spriteIds[0]).toBe(352278); // backpack
    expect(dat.items.get(3031).groups[0].spriteIds[0]).toBe(352021); // gold coin
    expect(dat.items.get(3264).groups[0].spriteIds[0]).toBe(351724); // sword
    expect(dat.items.get(3361).groups[0].spriteIds[0]).toBe(351626); // leather armor
    expect(dat.items.get(266).groups[0].spriteIds[0]).toBe(356831); // health potion
  });

  it('gold coin e stackable 4x2, backpack e container 1x1', () => {
    const gold = dat.items.get(3031);
    expect(gold.flags.stackable).toBe(true);
    expect(gold.groups[0].patternX).toBe(4);
    expect(gold.groups[0].patternY).toBe(2);
    expect(gold.groups[0].spriteIds).toHaveLength(8);

    const backpack = dat.items.get(2854);
    expect(backpack.flags.container).toBe(true);
    expect(backpack.groups[0].patternX).toBe(1);
  });
});

describe('formula de pattern de stackable', () => {
  it('segue a tabela do Item::calculatePatterns', () => {
    expect(stackPattern(1)).toEqual({ px: 0, py: 0 });
    expect(stackPattern(2)).toEqual({ px: 1, py: 0 });
    expect(stackPattern(4)).toEqual({ px: 3, py: 0 });
    expect(stackPattern(5)).toEqual({ px: 0, py: 1 });
    expect(stackPattern(9)).toEqual({ px: 0, py: 1 });
    expect(stackPattern(10)).toEqual({ px: 1, py: 1 });
    expect(stackPattern(24)).toEqual({ px: 1, py: 1 });
    expect(stackPattern(25)).toEqual({ px: 2, py: 1 });
    expect(stackPattern(50)).toEqual({ px: 3, py: 1 });
    expect(stackPattern(100)).toEqual({ px: 3, py: 1 });
  });

  it('com 4x2 e tudo mais em 1, o indice reduz a py*4 + px', () => {
    const group = { width: 1, height: 1, layers: 1, patternX: 4, patternY: 2, patternZ: 1, frames: 1 };
    expect(spriteIndex(group, stackPattern(1))).toBe(0);
    expect(spriteIndex(group, stackPattern(3))).toBe(2);
    expect(spriteIndex(group, stackPattern(5))).toBe(4);
    expect(spriteIndex(group, stackPattern(100))).toBe(7);
  });
});

describe.skipIf(!hasAssets)('Tibia.spr', () => {
  let spr;

  beforeAll(() => {
    spr = new SpriteFile(SPR);
  });

  it('le o header extended', () => {
    expect(spr.signature).toBe(0x4c220594);
    expect(spr.spriteCount).toBe(485548);
    expect(spr.tableOffset).toBe(8);
  });

  it('a tabela de offsets bate com a tabela de regressao da spec', () => {
    // Valores medidos independentemente por outro parser antes desta implementacao existir.
    const samples = [
      { id: 1, address: 1942200, dataSize: 2000, chunks: 47 },
      { id: 352278, address: 339335104, dataSize: 1920, chunks: 36 },
      { id: 352021, address: 339085683, dataSize: 243, chunks: 9 },
      { id: 351724, address: 338830995, dataSize: 557, chunks: 32 },
      { id: 351626, address: 338728502, dataSize: 1525, chunks: 28 },
      { id: 356831, address: 345574904, dataSize: 639, chunks: 21 },
    ];
    for (const sample of samples) {
      const info = spr.inspect(sample.id);
      expect(info.address, `endereco do sprite ${sample.id}`).toBe(sample.address);
      expect(info.dataSize, `dataSize do sprite ${sample.id}`).toBe(sample.dataSize);
      expect(info.chunks, `chunks do sprite ${sample.id}`).toBe(sample.chunks);
      expect(info.keyColor).toEqual([255, 0, 255]);
    }
  });

  it('decodifica para RGBA 32x32 com alpha binario (transparency = false)', () => {
    const rgba = spr.getSpriteRGBA(352278); // mochila
    expect(rgba.length).toBe(32 * 32 * 4);

    let opaque = 0;
    let transparent = 0;
    for (let i = 3; i < rgba.length; i += 4) {
      if (rgba[i] === 0xff) opaque++;
      else if (rgba[i] === 0x00) transparent++;
    }
    // Sem canal alpha no arquivo, todo pixel e 0x00 ou 0xFF -- nunca intermediario.
    expect(opaque + transparent).toBe(1024);
    expect(opaque).toBeGreaterThan(100);
    expect(transparent).toBeGreaterThan(0);
  });

  it('sprite id fora da faixa devolve transparente em vez de estourar', () => {
    const rgba = spr.getSpriteRGBA(999999999);
    expect(rgba.length).toBe(32 * 32 * 4);
    expect(rgba.every((byte) => byte === 0)).toBe(true);
  });
});

describe('encoder PNG', () => {
  it('gera um PNG valido com assinatura, IHDR e IEND', () => {
    const rgba = Buffer.alloc(32 * 32 * 4, 0x80);
    const png = encodePNG(rgba, 32, 32);

    expect(Array.from(png.subarray(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(png.toString('ascii', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(32); // largura
    expect(png.readUInt32BE(20)).toBe(32); // altura
    expect(png[24]).toBe(8); // bit depth
    expect(png[25]).toBe(6); // RGBA
    expect(png.toString('ascii', png.length - 8, png.length - 4)).toBe('IEND');
  });
});

describe('saida da extracao', () => {
  const outDir = path.resolve(import.meta.dirname, '../src/assets/items');

  it.skipIf(!fs.existsSync(path.join(outDir, 'items.json')))('items.json descreve os sprites gerados', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'items.json'), 'utf8'));
    expect(manifest.spriteSize).toBe(32);
    expect(manifest.generatedFrom.variant).toBe('8.60 v2');

    const gold = manifest.items.find((i) => i.clientId === 3031);
    expect(gold.stackable).toBe(true);
    expect(gold.sprites).toHaveLength(8);

    const backpack = manifest.items.find((i) => i.clientId === 2854);
    expect(backpack.container).toBe(true);
    expect(backpack.sprites).toHaveLength(1);

    for (const item of manifest.items) {
      for (const sprite of item.sprites) {
        expect(fs.existsSync(path.join(outDir, sprite.file)), `${sprite.file} existe`).toBe(true);
      }
    }
  });
});
