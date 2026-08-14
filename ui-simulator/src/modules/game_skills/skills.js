// Painel de skills.
//
// Uma linha por skill: nome, nivel e uma barra com a porcentagem de progresso. Os sete nomes e a
// ordem vem do enum SKILL_FIRST..SKILL_LAST do servidor, que e o mesmo indice usado no 0xA1.
// As seis special skills so aparecem quando tem valor -- o servidor manda sempre, mas num 8.60
// classico elas ficam zeradas.

import { g_ui } from '../../otui/g_ui.js';
import { SPECIAL_SKILL_NAMES } from '../../game/protocol/opcodes.js';

const ROW_HEIGHT = 18;

export class SkillsPanel {
  constructor(game) {
    this.game = game;
    this.rows = new Map();
    this.window = null;
  }

  create(parent) {
    const win = g_ui.createWidget('MiniWindowLike', parent);
    win.setText('Skills');
    win.rect = { x: 0, y: 0, w: 174, h: 8 * ROW_HEIGHT + 34 };
    this.window = win;
    this.content = win;

    this.game.on('onSkillsChange', (skills, specials) => this.update(skills, specials));
    if (this.game.skills.length) this.update(this.game.skills, this.game.specialSkills);

    return win;
  }

  update(skills, specials = []) {
    for (const row of this.rows.values()) row.destroy();
    this.rows.clear();

    let index = 0;
    for (const skill of skills) {
      this.addRow(`skill-${skill.id}`, skill.name, skill.level, skill.percent, index++);
    }

    specials.forEach((special, i) => {
      if (!special.value) return;
      // Special skills vem em centesimos de porcento (0..10000).
      this.addRow(`special-${i}`, SPECIAL_SKILL_NAMES[i], `${(special.value / 100).toFixed(2)}%`, 0, index++);
    });

    this.window.rect.h = index * ROW_HEIGHT + 34;
    this.window.updateLayout();
  }

  addRow(id, name, level, percent, index) {
    const row = g_ui.createWidget('UIWidget', this.window);
    row.id = id;
    row.element.dataset.id = id;
    row.element.classList.add('skill-row');
    row.rect = { x: 4, y: index * ROW_HEIGHT, w: 166, h: ROW_HEIGHT - 2 };

    const label = g_ui.createWidget('GameLabel', row);
    label.rect = { x: 0, y: 0, w: 120, h: ROW_HEIGHT - 2 };
    label.setTextAlign('left');
    label.setText(name);

    const value = g_ui.createWidget('GameLabel', row);
    value.rect = { x: 120, y: 0, w: 46, h: ROW_HEIGHT - 2 };
    value.setTextAlign('right');
    value.setText(String(level));
    value.element.classList.add('skill-value');

    const bar = g_ui.createWidget('UIProgressBar', row);
    bar.rect = { x: 0, y: ROW_HEIGHT - 5, w: 166, h: 2 };
    bar.applyProp('background-color', '#4b7fbf');
    bar.setPercent(percent || 0);
    bar.element.classList.add('skill-bar');

    this.window.updateLayout();
    this.rows.set(id, row);
    return row;
  }

  getRow(id) {
    return this.rows.get(id) || null;
  }
}
