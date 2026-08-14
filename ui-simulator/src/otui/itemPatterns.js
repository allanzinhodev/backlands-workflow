// Faixa de quantidade -> pattern do sprite, para itens stackable com folha 4x2.
// Porte de client/src/client/item.cpp (Item::calculatePatterns). Vive separado do tools/dat.mjs
// porque o browser tambem precisa dessa regra, e tools/ e codigo de build (Node).

export function stackPattern(count) {
  if (count <= 1) return { px: 0, py: 0 };
  if (count === 2) return { px: 1, py: 0 };
  if (count === 3) return { px: 2, py: 0 };
  if (count === 4) return { px: 3, py: 0 };
  if (count <= 9) return { px: 0, py: 1 };
  if (count <= 24) return { px: 1, py: 1 };
  if (count <= 49) return { px: 2, py: 1 };
  return { px: 3, py: 1 };
}
