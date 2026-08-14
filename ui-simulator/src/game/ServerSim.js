// Servidor simulado.
//
// Não é um mock de UI: ele monta os MESMOS bytes que o TFS monta e entrega ao parser do cliente.
// A ordem de envio no login segue sendAddCreature (server/src/protocolgame.cpp:4001-4066):
//   0x78/0x79 slots 1..10 -> 0xA0 stats -> 0xA1 skills -> 0x9F basic data
// O 0x6E (container) NÃO faz parte do login: ele só chega quando o jogador abre a backpack.

import * as send from './protocol/ProtocolGameSend.js';
import { INVENTORY_SLOT_ORDER, InventorySlot } from './protocol/opcodes.js';

/** Personagem de teste: um cavaleiro nível 8 equipado, com backpack cheia. */
export const DEFAULT_CHARACTER = {
  name: 'Backlands God',
  premium: true,
  vocation: 4,
  health: 185,
  maxHealth: 185,
  mana: 90,
  maxMana: 90,
  level: 8,
  levelPercent: 42,
  experience: 4200,
  magicLevel: 3,
  baseMagicLevel: 3,
  magicLevelPercent: 17,
  soul: 100,
  staminaMinutes: 2520,
  freeCapacity: 470,
  baseSpeed: 220,
  offlineTrainingTime: 0,
  skills: [
    { level: 12, base: 10, percent: 33 },
    { level: 10, base: 10, percent: 0 },
    { level: 25, base: 22, percent: 68 },
    { level: 14, base: 14, percent: 12 },
    { level: 11, base: 11, percent: 5 },
    { level: 21, base: 20, percent: 44 },
    { level: 10, base: 10, percent: 0 },
  ],
  specialSkills: [{ value: 350 }, { value: 1200 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }],
  equipment: {
    [InventorySlot.Head]: { clientId: 3351, slotPosition: 1, astraFlags: 1 },
    [InventorySlot.Neck]: { clientId: 3056, slotPosition: 2, astraFlags: 1 },
    [InventorySlot.Back]: { clientId: 2854, slotPosition: 4, astraFlags: 0 },
    [InventorySlot.Body]: { clientId: 3357, slotPosition: 8, astraFlags: 1 },
    [InventorySlot.Right]: { clientId: 3264, slotPosition: 96, astraFlags: 1 },
    [InventorySlot.Left]: { clientId: 3412, slotPosition: 96, astraFlags: 1 },
    [InventorySlot.Leg]: { clientId: 3559, slotPosition: 16, astraFlags: 1 },
    [InventorySlot.Feet]: { clientId: 3552, slotPosition: 32, astraFlags: 1 },
    [InventorySlot.Finger]: { clientId: 3004, slotPosition: 64, astraFlags: 1 },
    [InventorySlot.Ammo]: null,
  },
  backpack: {
    cid: 0,
    containerItem: { clientId: 2854 },
    name: 'backpack',
    capacity: 20,
    hasParent: false,
    items: [
      { clientId: 3031, count: 87, stackable: true },
      { clientId: 3035, count: 12, stackable: true },
      { clientId: 266 },
      { clientId: 268 },
      { clientId: 3577, count: 3, stackable: true },
      { clientId: 3447, count: 50, stackable: true },
      { clientId: 2920 },
    ],
  },
};

export class ServerSim {
  /**
   * @param {object} parser ProtocolGameParse do lado cliente
   * @param {object} character personagem a materializar
   */
  constructor(parser, character = DEFAULT_CHARACTER) {
    this.parser = parser;
    this.character = character;
    this.sent = [];
  }

  /** Entrega uma mensagem ao cliente pelo "fio" e guarda para inspeção nos testes. */
  deliver(message) {
    this.sent.push(message);
    this.parser.receiveWire(message.toWire());
    return message;
  }

  /** Reproduz a sequência de pacotes do login, na ordem do sendAddCreature. */
  login() {
    const c = this.character;

    for (const slot of INVENTORY_SLOT_ORDER) {
      this.deliver(send.sendInventoryItem(slot, c.equipment[slot] || null));
    }

    this.deliver(send.sendStats(c));
    this.deliver(send.sendSkills(c.skills, c.specialSkills));
    this.deliver(
      send.sendBasicData({ premium: c.premium, vocation: c.vocation, spells: [1, 2, 3], magicShield: 0 })
    );
    this.deliver(send.sendTextMessage(22, `Welcome to Backlands, ${c.name}!`));

    return this.sent.length;
  }

  /** O jogador clicou na backpack: agora sim vem o 0x6E. */
  openBackpack() {
    return this.deliver(send.sendContainer(this.character.backpack));
  }

  closeBackpack() {
    return this.deliver(send.sendCloseContainer(this.character.backpack.cid));
  }

  /** Dano/cura: o servidor reenvia o 0xA0 inteiro, não um pacote de "só vida". */
  setHealth(health) {
    this.character.health = Math.max(0, Math.min(this.character.maxHealth, health));
    return this.deliver(send.sendStats(this.character));
  }

  setMana(mana) {
    this.character.mana = Math.max(0, Math.min(this.character.maxMana, mana));
    return this.deliver(send.sendStats(this.character));
  }

  addToBackpack(item) {
    return this.deliver(send.sendContainerAddItem(this.character.backpack.cid, 0, item));
  }

  removeFromBackpack(slot) {
    return this.deliver(send.sendContainerRemoveItem(this.character.backpack.cid, slot, null));
  }

  equip(slot, item) {
    this.character.equipment[slot] = item;
    return this.deliver(send.sendInventoryItem(slot, item));
  }

  message(text, type = 22) {
    return this.deliver(send.sendTextMessage(type, text));
  }

  /** Total de bytes que já trafegaram — útil para mostrar que a UI é movida por protocolo. */
  totalBytes() {
    return this.sent.reduce((sum, message) => sum + message.length + 2, 0);
  }
}
