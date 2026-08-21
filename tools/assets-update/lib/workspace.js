'use strict';
// Caminhos do workspace e carga dos tres arquivos que a cadeia atravessa.
//
//   brush XML (ServerID) -> items.otb (ServerID->ClientID) -> Tibia.dat
//   (ClientID -> sprite ids) -> Tibia.spr (sprite id -> pixels)
//
// Ver AGENTS.md, "Invariantes entre repositorios": ServerID != ClientID, e o
// items.otb do servidor e a fonte unica (o do editor e espelho).

const fs = require('fs');
const path = require('path');

const datParser = require('../../sprites/dat');
const otb = require('../../sprites/otb');
const { readOtfi } = require('../../sprites/otfi');
const { SprFile } = require('./sprfile');

const ROOT = path.resolve(__dirname, '..');                 // tools/assets-update
const WORKSPACE = path.resolve(ROOT, '..', '..');           // d:\backlands
const MAPEDITOR_DATA = path.join(WORKSPACE, 'mapeditor', 'data', '860');
const CLIENT_THINGS = path.join(WORKSPACE, 'client', 'data', 'things', '860');
const SERVER_ITEMS = path.join(WORKSPACE, 'server', 'data', 'items');

const SPECS_DIR = path.join(ROOT, 'specs');
const WORK_DIR = path.join(ROOT, 'work');

// 8.60 v2 — objectbuilder/src/config/versions.xml:31. A v1 seria 0x4C28B721 e
// tem outro items.otb; misturar as duas corrompe em silencio.
const DAT_SIGNATURE_860_V2 = 0x4C2C7993;
const DAT_SIGNATURE_860_V1 = 0x4C28B721;

function assetPaths(assetDir) {
  const dir = assetDir ? path.resolve(WORKSPACE, assetDir) : CLIENT_THINGS;
  return {
    dir,
    dat: path.join(dir, 'Tibia.dat'),
    spr: path.join(dir, 'Tibia.spr'),
    otfi: path.join(dir, 'Tibia.otfi'),
  };
}

/** Le .otfi + .dat e o mapa do items.otb. Nao abre o .spr (ver openSpr). */
function loadAssets(assetDir) {
  const paths = assetPaths(assetDir);
  for (const key of ['dat', 'spr']) {
    if (!fs.existsSync(paths[key])) {
      throw new Error(`${paths[key]} nao existe. O 860.rar do cliente foi extraido?`);
    }
  }

  const features = readOtfi(paths.otfi);
  const datBuffer = fs.readFileSync(paths.dat);
  const dat = datParser.parse(datBuffer, features);

  if (dat.signature !== DAT_SIGNATURE_860_V2 && dat.signature !== DAT_SIGNATURE_860_V1) {
    throw new Error(`assinatura de .dat inesperada: 0x${dat.signature.toString(16).toUpperCase()}`);
  }

  const otbPath = path.join(SERVER_ITEMS, 'items.otb');
  const mapping = otb.readMapping(otbPath);

  return { paths, features, datBuffer, dat, mapping, otbPath };
}

function openSpr(assets, writable) {
  return new SprFile(assets.paths.spr, assets.features, writable);
}

/** Sprite ids de um ClientID, ja separados por frame do primeiro frame group. */
function spriteFramesOf(assets, clientId) {
  const thing = assets.dat.byId.item.get(clientId);
  if (!thing) return null;

  const group = thing.groups[0];
  const ids = datParser.spriteIdsOf(assets.datBuffer, thing, assets.features.extended)
    .slice(group.first, group.first + group.count);

  // Ordem de leitura do formato (MetadataReader.as::readTexturePatterns):
  // frame -> patternZ -> patternY -> patternX -> layer -> height -> width.
  const perFrame = group.count / group.frames;
  const frames = [];
  for (let f = 0; f < group.frames; f++) {
    frames.push(ids.slice(f * perFrame, (f + 1) * perFrame));
  }
  return { group, frames };
}

function relative(p) {
  return path.relative(WORKSPACE, p).split(path.sep).join('/');
}

module.exports = {
  ROOT, WORKSPACE, MAPEDITOR_DATA, CLIENT_THINGS, SERVER_ITEMS, SPECS_DIR, WORK_DIR,
  DAT_SIGNATURE_860_V1, DAT_SIGNATURE_860_V2,
  assetPaths, loadAssets, openSpr, spriteFramesOf, relative,
};
