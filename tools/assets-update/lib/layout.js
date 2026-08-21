'use strict';
// Arranjo das pecas de borda dentro da folha.
//
// De onde vem o arranjo (nao foi inventado aqui):
//
//   mapeditor/source/brush_tables.cpp, GroundBrush::init() — a tabela
//   border_types[] e indexada pela mascara dos VIZINHOS que tem o brush, e
//   border_types[TILE_NORTH] = NORTH_HORIZONTAL. Ou seja: a peca "n" e
//   desenhada no tile que tem o ground ao NORTE — ela fica ABAIXO da agua, nao
//   acima. O mesmo vale para as outras: o nome da aresta diz onde esta o
//   ground, nao onde esta a peca.
//
//   mapeditor/source/border_workspace_window.cpp:56-64 — o proprio editor ja
//   monta essa grade 5x5, com os rotulos invertidos em relacao ao nome da
//   aresta ("cnw" aparece rotulado "Corner SE", na posicao (4,4)). Este layout
//   e exatamente a mesma tabela.
//
// A grade desenha uma ilha de ground com os quatro cantos recortados, cercada
// pelo anel de bordas:
//
//        col 0    1      2      3      4
//   row0  cse    ---     s     ---    csw
//   row1  ---    dse   ground  dsw    ---
//   row2   e   ground  ground ground   w
//   row3  ---    dne   ground  dnw    ---
//   row4  cne    ---     n     ---    cnw
//
// As celulas "---" ficam transparentes. As de ground que nao sao o centro sao
// contexto: mostram como a borda encosta no chao. Editar so o centro basta —
// se voce editar uma copia junto, o valor tem que bater com o centro (as
// celulas que compartilham o mesmo sprite id sao conferidas em grupo).

const CELL = 32;

const ISLAND_5X5 = {
  name: 'island5x5',
  rows: 5,
  cols: 5,
  // slot -> [linha, coluna]
  slots: {
    cse: [0, 0], s: [0, 2], csw: [0, 4],
    dse: [1, 1], dsw: [1, 3],
    e: [2, 0], w: [2, 4],
    dne: [3, 1], dnw: [3, 3],
    cne: [4, 0], n: [4, 2], cnw: [4, 4],
    ground: [2, 2],
  },
  // Copias do ground que servem de contexto visual ao redor do centro.
  groundContext: [[1, 2], [2, 1], [2, 3], [3, 2]],
};

const LAYOUTS = { [ISLAND_5X5.name]: ISLAND_5X5 };

function getLayout(name) {
  const layout = LAYOUTS[name || ISLAND_5X5.name];
  if (!layout) {
    throw new Error(`layout "${name}" desconhecido (disponiveis: ${Object.keys(LAYOUTS).join(', ')})`);
  }
  return layout;
}

/** Ordem canonica das arestas, usada em relatorios. */
const EDGE_ORDER = ['n', 'e', 's', 'w', 'cnw', 'cne', 'csw', 'cse', 'dnw', 'dne', 'dsw', 'dse'];

module.exports = { CELL, ISLAND_5X5, LAYOUTS, getLayout, EDGE_ORDER };
