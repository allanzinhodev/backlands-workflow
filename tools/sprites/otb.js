'use strict';
// Leitor de items.otb — a ponte ServerID <-> ClientID.
// Referência: objectbuilder/src/otlib/items/OtbReader.as
//
// Estrutura: 4 bytes, depois árvore de nós no mesmo formato do OTBM
//   nó     = 0xFE <type:1> <dados escapados...> [filhos...] 0xFF
//   escape = 0xFD seguido do byte literal
//
// Nó de item: <flags:4> e depois pares <attr:1><len:2><valor:len>.
//   0x10 ITEM_ATTR_SERVERID (uint16)
//   0x11 ITEM_ATTR_CLIENTID (uint16)

const fs = require('fs');

const NODE_START = 0xFE, NODE_END = 0xFF, ESCAPE = 0xFD;
const ATTR_SERVERID = 0x10;
const ATTR_CLIENTID = 0x11;

function readEscaped(b, p, count) {
  const out = [];
  while (out.length < count && p < b.length) {
    const x = b[p];
    if (x === ESCAPE) { out.push(b[p + 1]); p += 2; }
    else if (x === NODE_START || x === NODE_END) return null;
    else { out.push(x); p += 1; }
  }
  return out.length === count ? { bytes: out, next: p } : null;
}

/**
 * @returns {{serverToClient:Map<number,number>, clientToServer:Map<number,number[]>, count:number}}
 */
function readMapping(otbPath) {
  const b = fs.readFileSync(otbPath);
  const serverToClient = new Map();
  const clientToServer = new Map();
  let count = 0;

  let p = 4;
  while (p < b.length) {
    const x = b[p];
    if (x === ESCAPE) { p += 2; continue; }
    if (x !== NODE_START) { p += 1; continue; }

    // tenta ler o nó como nó de item
    let r = readEscaped(b, p + 2, 4); // flags
    if (r) {
      let q = r.next;
      let sid = null, cid = null;
      for (let guard = 0; guard < 32; guard++) {
        const a = readEscaped(b, q, 1); if (!a) break;
        const l = readEscaped(b, a.next, 2); if (!l) break;
        const len = l.bytes[0] | (l.bytes[1] << 8);
        const v = readEscaped(b, l.next, len); if (!v) break;
        if (a.bytes[0] === ATTR_SERVERID && len >= 2) sid = v.bytes[0] | (v.bytes[1] << 8);
        if (a.bytes[0] === ATTR_CLIENTID && len >= 2) cid = v.bytes[0] | (v.bytes[1] << 8);
        if (sid !== null && cid !== null) break;
        q = v.next;
      }
      if (sid !== null && cid !== null) {
        count++;
        serverToClient.set(sid, cid);
        if (!clientToServer.has(cid)) clientToServer.set(cid, []);
        clientToServer.get(cid).push(sid);
      }
    }
    p += 2;
  }

  return { serverToClient, clientToServer, count };
}

module.exports = { readMapping };
