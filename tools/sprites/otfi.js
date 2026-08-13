'use strict';
// Lê o Tibia.otfi — é ele que define se o cliente usa sprites extended
// (ids de 32 bits), transparência, frame durations e frame groups.
// Referência: objectbuilder/src/otlib/utils/OTFI.as
//
// Formato (OTML):
//   DatSpr
//     extended: true
//     transparency: false
//     frame-durations: true
//     frame-groups: true

const fs = require('fs');
const path = require('path');

// Valores do 8.60 clássico, caso não exista .otfi ao lado dos assets.
const DEFAULTS = { extended: false, transparency: false, improvedAnimations: false, frameGroups: false };

function readOtfi(otfiPath) {
  if (!fs.existsSync(otfiPath)) return { ...DEFAULTS };

  const text = fs.readFileSync(otfiPath, 'utf8');
  const bool = (key) => {
    const m = text.match(new RegExp('^\\s*' + key + '\\s*:\\s*(true|false)\\s*$', 'im'));
    return m ? m[1].toLowerCase() === 'true' : undefined;
  };

  return {
    extended: bool('extended') ?? DEFAULTS.extended,
    transparency: bool('transparency') ?? DEFAULTS.transparency,
    // No OTFI o nome é frame-durations; no reader do OB, improvedAnimations.
    improvedAnimations: bool('frame-durations') ?? DEFAULTS.improvedAnimations,
    frameGroups: bool('frame-groups') ?? DEFAULTS.frameGroups,
  };
}

/** Pasta padrão dos assets 8.60 do cliente. */
function defaultAssetDir() {
  return path.resolve(__dirname, '..', '..', 'client', 'data', 'things', '860');
}

module.exports = { readOtfi, defaultAssetDir, DEFAULTS };
