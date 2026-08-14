// Barras de HP/MP e a linha de capacidade/soul.
//
// As cores vem dos estilos reais: HealthBar e ManaBar em 10-progressbars.otui do cliente.
// A porcentagem e calculada como o cliente calcula (valor/maximo), e nao vem no pacote --
// o 0xA0 manda os valores absolutos porque defaultHealthDisplay = "real" no servidor.

import { g_ui } from '../../otui/g_ui.js';

export class HealthInfoPanel {
  constructor(game) {
    this.game = game;
    this.window = null;
  }

  create(parent) {
    const win = g_ui.createWidget('MiniWindowLike', parent);
    win.setText('Health');
    win.rect = { x: 0, y: 0, w: 174, h: 88 };
    this.window = win;

    this.healthBar = this.createBar(win, 'healthBar', 'HealthBar', 0);
    this.manaBar = this.createBar(win, 'manaBar', 'ManaBar', 20);
    this.experienceBar = this.createBar(win, 'experienceBar', 'ExperienceBar', 40);

    this.capLabel = this.createLabel(win, 'capLabel', 58, 'left');
    this.soulLabel = this.createLabel(win, 'soulLabel', 58, 'right');

    this.game.on('onHealthChange', () => this.updateHealth());
    this.game.on('onManaChange', () => this.updateMana());
    this.game.on('onLevelChange', () => this.updateExperience());
    this.game.on('onFreeCapacityChange', () => this.updateCapacity());
    this.game.on('onSoulChange', () => this.updateSoul());

    this.updateHealth();
    this.updateMana();
    this.updateExperience();
    this.updateCapacity();
    this.updateSoul();

    win.updateLayout();
    return win;
  }

  createBar(parent, id, styleName, top) {
    const style = g_ui.registry.getStyle(styleName);
    const bar = g_ui.createWidget(style ? styleName : 'UIProgressBar', parent);
    bar.id = id;
    bar.element.dataset.id = id;
    bar.element.classList.add('hud-bar');
    bar.rect = { x: 4, y: top, w: 166, h: 16 };
    // Estes estilos declaram ancoras contra 'prev'/'parent' que so fazem sentido dentro do
    // miniwindow original; aqui o rect e posto na mao.
    bar.anchors = [];
    return bar;
  }

  createLabel(parent, id, top, align) {
    const label = g_ui.createWidget('GameLabel', parent);
    label.id = id;
    label.element.dataset.id = id;
    label.rect = { x: align === 'left' ? 4 : 90, y: top, w: 80, h: 16 };
    label.anchors = [];
    label.setTextAlign(align);
    label.applyProp('color', '#ffffff');
    return label;
  }

  updateHealth() {
    const { health, maxHealth } = this.game.player;
    const percent = this.game.getHealthPercent();
    if (this.healthBar.setPercent) this.healthBar.setPercent(percent);
    this.healthBar.setText(`${health} / ${maxHealth}`);
  }

  updateMana() {
    const { mana, maxMana } = this.game.player;
    const percent = this.game.getManaPercent();
    if (this.manaBar.setPercent) this.manaBar.setPercent(percent);
    this.manaBar.setText(`${mana} / ${maxMana}`);
  }

  updateExperience() {
    const { level, levelPercent } = this.game.player;
    if (this.experienceBar.setPercent) this.experienceBar.setPercent(levelPercent);
    this.experienceBar.setText(`Level ${level} (${levelPercent}%)`);
  }

  updateCapacity() {
    // A capacidade ja chega convertida de centesimos pelo parser.
    this.capLabel.setText(`Cap: ${Math.floor(this.game.player.freeCapacity)}`);
  }

  updateSoul() {
    this.soulLabel.setText(`Soul: ${this.game.player.soul}`);
  }
}
