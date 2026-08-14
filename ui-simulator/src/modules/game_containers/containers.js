// Janela de container (backpack).
//
// Porte do game_containers do cliente. O grid usa cell-size 34x34 e cell-spacing 3, os mesmos
// numeros do 40-container.otui (layout: type: grid). O cabecalho mostra o nome que veio NO PACOTE
// 0x6E -- nao um nome inventado do lado do cliente.

import { g_ui } from '../../otui/g_ui.js';
import { UIItem } from '../../otui/UIItem.js';

const CELL_SIZE = 34;
const CELL_SPACING = 3;
const COLUMNS = 4;

export class ContainerWindows {
  constructor(game, catalog) {
    this.game = game;
    this.catalog = catalog;
    this.windows = new Map();
    this.parent = null;
  }

  attach(parent) {
    this.parent = parent;
    this.game.on('onContainerOpen', (container) => this.open(container));
    this.game.on('onContainerClose', (cid) => this.close(cid));
    this.game.on('onContainerUpdate', (container) => this.refresh(container));
    return this;
  }

  open(container) {
    this.close(container.cid);

    const win = g_ui.createWidget('MiniWindowLike', this.parent);
    win.setText(container.name);
    win.element.dataset.cid = String(container.cid);
    win.element.classList.add('container-window');

    const rows = Math.ceil(Math.max(container.capacity, container.items.length) / COLUMNS);
    win.rect = {
      x: 0,
      y: 0,
      w: COLUMNS * CELL_SIZE + (COLUMNS - 1) * CELL_SPACING + 12,
      h: rows * CELL_SIZE + (rows - 1) * CELL_SPACING + 34,
    };

    const grid = g_ui.createWidget('UIWidget', win);
    grid.id = `containerGrid${container.cid}`;
    grid.element.dataset.id = grid.id;
    grid.element.classList.add('container-grid');
    grid.rect = {
      x: 0,
      y: 0,
      w: COLUMNS * CELL_SIZE + (COLUMNS - 1) * CELL_SPACING,
      h: rows * CELL_SIZE + (rows - 1) * CELL_SPACING,
    };
    grid.anchors.push({ edge: 'horizontalCenter', targetId: 'parent', targetEdge: 'horizontalCenter' });
    grid.anchors.push({ edge: 'top', targetId: 'parent', targetEdge: 'top' });

    const cells = [];
    for (let index = 0; index < container.capacity; index++) {
      const cell = new UIItem('UIItem');
      grid.addChild(cell);
      cell.setCatalog(this.catalog);
      cell.element.classList.add('container-slot');
      cell.element.dataset.index = String(index);
      cell.rect = {
        x: (index % COLUMNS) * (CELL_SIZE + CELL_SPACING),
        y: Math.floor(index / COLUMNS) * (CELL_SIZE + CELL_SPACING),
        w: CELL_SIZE,
        h: CELL_SIZE,
      };
      cells.push(cell);
    }

    win.updateLayout();
    this.windows.set(container.cid, { win, cells });
    this.refresh(container);
    return win;
  }

  refresh(container) {
    const entry = this.windows.get(container.cid);
    if (!entry) return;
    entry.cells.forEach((cell, index) => {
      cell.setItem(container.items[index] || null);
    });
  }

  close(cid) {
    const entry = this.windows.get(cid);
    if (!entry) return;
    entry.win.destroy();
    this.windows.delete(cid);
  }

  getWindow(cid) {
    const entry = this.windows.get(cid);
    return entry ? entry.win : null;
  }
}
