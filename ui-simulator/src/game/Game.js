// Estado do jogo + eventos.
//
// Equivale ao g_game do cliente: guarda o que os pacotes trouxeram e emite os mesmos eventos que os
// modulos Lua escutam (onHealthChange, onInventoryChange, onContainerOpen, ...). Os modulos de UI
// se ligam nesses eventos e nao sabem nada de bytes -- exatamente como no cliente real.

import { INVENTORY_SLOT_ORDER, SKILL_NAMES } from './protocol/opcodes.js';

export class Game {
  constructor() {
    this.online = false;
    this.player = {
      name: '',
      health: 0,
      maxHealth: 0,
      mana: 0,
      maxMana: 0,
      level: 1,
      levelPercent: 0,
      experience: 0,
      magicLevel: 0,
      magicLevelPercent: 0,
      baseMagicLevel: 0,
      soul: 0,
      staminaMinutes: 0,
      freeCapacity: 0,
      baseSpeed: 0,
      vocation: 0,
      premium: false,
    };
    this.skills = [];
    this.specialSkills = [];
    this.inventory = new Map();
    this.containers = new Map();
    this.messages = [];
    this.listeners = new Map();
  }

  // ---------------------------------------------------------------- eventos

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const list = this.listeners.get(event);
    if (!list) return;
    const index = list.indexOf(handler);
    if (index >= 0) list.splice(index, 1);
  }

  emit(event, ...args) {
    const list = this.listeners.get(event);
    if (!list) return;
    for (const handler of [...list]) handler(...args);
  }

  // ---------------------------------------------------------------- estado

  setStats(stats) {
    const previous = { ...this.player };
    Object.assign(this.player, stats);

    if (stats.health !== previous.health || stats.maxHealth !== previous.maxHealth) {
      this.emit('onHealthChange', this.player.health, this.player.maxHealth);
    }
    if (stats.mana !== previous.mana || stats.maxMana !== previous.maxMana) {
      this.emit('onManaChange', this.player.mana, this.player.maxMana);
    }
    if (stats.level !== previous.level || stats.levelPercent !== previous.levelPercent) {
      this.emit('onLevelChange', this.player.level, this.player.levelPercent);
    }
    if (stats.experience !== previous.experience) {
      this.emit('onExperienceChange', this.player.experience);
    }
    if (stats.soul !== previous.soul) this.emit('onSoulChange', this.player.soul);
    if (stats.freeCapacity !== previous.freeCapacity) {
      this.emit('onFreeCapacityChange', this.player.freeCapacity);
    }
    if (stats.magicLevel !== previous.magicLevel || stats.magicLevelPercent !== previous.magicLevelPercent) {
      this.emit('onMagicLevelChange', this.player.magicLevel, this.player.magicLevelPercent);
    }
    this.emit('onStatsChange', this.player);
  }

  setSkills(skills, specialSkills = []) {
    this.skills = skills.map((skill) => ({ ...skill, name: SKILL_NAMES[skill.id] || `Skill ${skill.id}` }));
    this.specialSkills = specialSkills;
    this.emit('onSkillsChange', this.skills, this.specialSkills);
  }

  setBasicData(data) {
    this.player.premium = data.premium;
    this.player.vocation = data.vocation;
    this.player.spells = data.spells;
    this.emit('onBasicDataChange', data);
  }

  setInventoryItem(slot, item) {
    if (item) this.inventory.set(slot, item);
    else this.inventory.delete(slot);
    this.emit('onInventoryChange', slot, item);
  }

  getInventoryItem(slot) {
    return this.inventory.get(slot) || null;
  }

  getInventory() {
    return INVENTORY_SLOT_ORDER.map((slot) => ({ slot, item: this.inventory.get(slot) || null }));
  }

  openContainer(container) {
    this.containers.set(container.cid, container);
    this.emit('onContainerOpen', container);
  }

  closeContainer(cid) {
    const container = this.containers.get(cid);
    this.containers.delete(cid);
    this.emit('onContainerClose', cid, container);
  }

  getContainer(cid) {
    return this.containers.get(cid) || null;
  }

  containerAddItem(cid, slot, item) {
    const container = this.containers.get(cid);
    if (!container) return;
    container.items.splice(slot, 0, item);
    container.size = container.items.length;
    this.emit('onContainerUpdate', container);
  }

  containerUpdateItem(cid, slot, item) {
    const container = this.containers.get(cid);
    if (!container) return;
    container.items[slot] = item;
    this.emit('onContainerUpdate', container);
  }

  containerRemoveItem(cid, slot, lastItem) {
    const container = this.containers.get(cid);
    if (!container) return;
    container.items.splice(slot, 1);
    if (lastItem) container.items.push(lastItem);
    container.size = container.items.length;
    this.emit('onContainerUpdate', container);
  }

  addTextMessage(type, text) {
    this.messages.push({ type, text });
    this.emit('onTextMessage', type, text);
  }

  setOnline(online) {
    this.online = online;
    this.emit(online ? 'onGameStart' : 'onGameEnd');
  }

  isOnline() {
    return this.online;
  }

  getHealthPercent() {
    if (!this.player.maxHealth) return 0;
    return Math.floor((this.player.health / this.player.maxHealth) * 100);
  }

  getManaPercent() {
    if (!this.player.maxMana) return 0;
    return Math.floor((this.player.mana / this.player.maxMana) * 100);
  }
}
