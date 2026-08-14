// UIItem: o widget que desenha um item do jogo.
//
// No cliente ele e C++ e desenha o sprite direto do Tibia.spr. Aqui ele usa os PNGs que o
// tools/extract-assets.mjs extraiu daquele mesmo .spr, entao o sprite e o mesmo bitmap.
//
// Comportamento portado (client/src/client/item.cpp):
//   - item stackable escolhe o sprite pela faixa de quantidade (calculatePatterns)
//   - a contagem so aparece quando > 1, alinhada embaixo a direita
//   - slot vazio mostra a imagem de fundo do proprio slot (que vem do estilo .otui)

import { UIWidget } from './UIWidget.js';
import { stackPattern } from './itemPatterns.js';

const ASSET_BASE = '/src/assets/items';

export class UIItem extends UIWidget {
  constructor(styleName = 'UIItem') {
    super(styleName);
    this.item = null;
    this.itemCatalog = null;

    const sprite = document.createElement('div');
    sprite.className = 'otui-item-sprite';
    sprite.style.position = 'absolute';
    sprite.style.inset = '0';
    sprite.style.backgroundRepeat = 'no-repeat';
    sprite.style.backgroundPosition = 'center';
    sprite.style.imageRendering = 'pixelated';
    sprite.style.pointerEvents = 'none';
    this.spriteNode = sprite;
    this.element.appendChild(sprite);

    const count = document.createElement('span');
    count.className = 'otui-item-count';
    count.style.position = 'absolute';
    count.style.right = '1px';
    count.style.bottom = '0';
    count.style.font = '11px Verdana, sans-serif';
    count.style.color = '#ffffff';
    count.style.textShadow = '1px 1px 0 #000';
    count.style.pointerEvents = 'none';
    this.countNode = count;
    this.element.appendChild(count);
  }

  setCatalog(catalog) {
    this.itemCatalog = catalog;
  }

  /**
   * @param {object|null} item { clientId, count } ou null para esvaziar o slot
   */
  setItem(item) {
    this.item = item;

    if (!item) {
      this.spriteNode.style.backgroundImage = '';
      this.countNode.textContent = '';
      this.element.dataset.clientId = '';
      return;
    }

    this.element.dataset.clientId = String(item.clientId);
    this.spriteNode.style.backgroundImage = `url('${this.resolveSprite(item)}')`;

    const count = item.count || 1;
    this.countNode.textContent = count > 1 ? String(count) : '';
  }

  getItem() {
    return this.item;
  }

  resolveSprite(item) {
    const entry = this.itemCatalog ? this.itemCatalog.get(item.clientId) : null;
    if (!entry) return `${ASSET_BASE}/${item.clientId}.png`;

    // Stackable com folha 4x2: a faixa de quantidade escolhe qual dos 8 sprites usar.
    if (entry.sprites.length > 1) {
      const { px, py } = stackPattern(item.count || 1);
      const index = py * 4 + px;
      const sprite = entry.sprites[index] || entry.sprites[0];
      return `${ASSET_BASE}/${sprite.file}`;
    }
    return `${ASSET_BASE}/${entry.sprites[0].file}`;
  }
}
