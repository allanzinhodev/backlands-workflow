// Painel de equipamentos.
//
// Os estilos de slot (HeadSlot, BodySlot, ...) vem do 40-inventory.otui REAL do cliente: e de la
// que sai a imagem de fundo de cada slot vazio (/images/game/slots/*). O id de cada estilo
// (slot1..slot10) e o proprio indice do protocolo, o mesmo numero que vai no pacote 0x78 --
// por isso o painel se liga ao jogo sem tabela de conversao.

import { g_ui } from '../../otui/g_ui.js';
import { UIItem } from '../../otui/UIItem.js';
import { INVENTORY_SLOT_ORDER, SLOT_NAMES, InventorySlot } from '../../game/protocol/opcodes.js';

// Posicao de cada slot na grade 3x4 do inventario, como o 40-inventory.otui ancora:
// coluna do meio = head/body/legs/feet, esquerda = neck/left/finger, direita = back/right/ammo.
const SLOT_LAYOUT = {
  [InventorySlot.Head]: { col: 1, row: 0 },
  [InventorySlot.Body]: { col: 1, row: 1 },
  [InventorySlot.Leg]: { col: 1, row: 2 },
  [InventorySlot.Feet]: { col: 1, row: 3 },
  [InventorySlot.Neck]: { col: 0, row: 0 },
  [InventorySlot.Left]: { col: 0, row: 1 },
  [InventorySlot.Finger]: { col: 0, row: 2 },
  [InventorySlot.Back]: { col: 2, row: 0 },
  [InventorySlot.Right]: { col: 2, row: 1 },
  [InventorySlot.Ammo]: { col: 2, row: 2 },
};

const SLOT_STYLE = {
  [InventorySlot.Head]: 'HeadSlot',
  [InventorySlot.Neck]: 'NeckSlot',
  [InventorySlot.Back]: 'BackSlot',
  [InventorySlot.Body]: 'BodySlot',
  [InventorySlot.Right]: 'RightSlot',
  [InventorySlot.Left]: 'LeftSlot',
  [InventorySlot.Leg]: 'LegSlot',
  [InventorySlot.Feet]: 'FeetSlot',
  [InventorySlot.Finger]: 'FingerSlot',
  [InventorySlot.Ammo]: 'AmmoSlot',
};

const SLOT_SIZE = 34;
const SLOT_GAP = 3;

export class InventoryPanel {
  constructor(game, catalog) {
    this.game = game;
    this.catalog = catalog;
    this.slots = new Map();
    this.window = null;
  }

  create(parent) {
    const win = g_ui.createWidget('MiniWindowLike', parent);
    win.setText('Inventory');
    win.rect = { x: 0, y: 0, w: 174, h: 4 * SLOT_SIZE + 3 * SLOT_GAP + 34 };
    this.window = win;

    const panel = g_ui.createWidget('UIWidget', win);
    panel.id = 'inventoryPanel';
    panel.element.dataset.id = 'inventoryPanel';
    panel.rect = { x: 0, y: 0, w: 3 * SLOT_SIZE + 2 * SLOT_GAP, h: 4 * SLOT_SIZE + 3 * SLOT_GAP };
    panel.anchors.push({ edge: 'horizontalCenter', targetId: 'parent', targetEdge: 'horizontalCenter' });
    panel.anchors.push({ edge: 'top', targetId: 'parent', targetEdge: 'top' });

    for (const slot of INVENTORY_SLOT_ORDER) {
      const styleName = SLOT_STYLE[slot];
      const style = g_ui.registry.getStyle(styleName);
      // O estilo vem do cliente; se por algum motivo nao existir, cai no UIItem cru em vez de
      // derrubar o painel inteiro.
      const widget = style ? g_ui.createWidget(styleName, panel) : new UIItem('UIItem');
      if (!style) panel.addChild(widget);

      const { col, row } = SLOT_LAYOUT[slot];
      widget.rect = {
        x: col * (SLOT_SIZE + SLOT_GAP),
        y: row * (SLOT_SIZE + SLOT_GAP),
        w: SLOT_SIZE,
        h: SLOT_SIZE,
      };
      widget.id = `slot${slot}`;
      widget.element.dataset.id = widget.id;
      widget.element.dataset.slotName = SLOT_NAMES[slot];
      widget.element.classList.add('inventory-slot');
      if (widget.setCatalog) widget.setCatalog(this.catalog);

      this.slots.set(slot, widget);
    }

    win.updateLayout();

    this.game.on('onInventoryChange', (slot, item) => this.updateSlot(slot, item));
    for (const { slot, item } of this.game.getInventory()) this.updateSlot(slot, item);

    return win;
  }

  updateSlot(slot, item) {
    const widget = this.slots.get(slot);
    if (!widget) return;
    if (widget.setItem) widget.setItem(item);
    // $on no estilo do slot troca a imagem para a versao "blessed"; aqui usamos o estado para
    // marcar simplesmente que o slot esta ocupado.
    widget.element.classList.toggle('filled', Boolean(item));
  }

  getSlotWidget(slot) {
    return this.slots.get(slot) || null;
  }
}
