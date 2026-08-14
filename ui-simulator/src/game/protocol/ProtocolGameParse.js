// Lado cliente: le os bytes e alimenta o estado do jogo.
// Porte de client/src/client/protocolgameparse.cpp (parsePlayerStats, parsePlayerSkills,
// parseInventoryItem, parseContainer, ...).
//
// Este arquivo e o par exato do ProtocolGameSend.js. Se um campo condicional divergir entre os
// dois, o parse sai do trilho e os campos seguintes viram lixo -- que e exatamente o bug que
// acontece no cliente real quando uma GameFeature nao bate. Os testes cobrem isso.

import { InputMessage } from './NetworkMessage.js';
import { GameServerOpcode, FEATURE_PROFILE, SKILL_ORDER, SPECIAL_SKILL_COUNT } from './opcodes.js';

export function parseItem(msg, features = FEATURE_PROFILE, itemTypes = null) {
  const clientId = msg.getU16();
  const type = itemTypes ? itemTypes.get(clientId) : null;

  const item = { clientId, count: 1 };

  if (type && type.stackable) {
    item.count = msg.getByte();
  } else if (type && (type.fluidContainer || type.splash)) {
    item.fluid = msg.getByte();
  }

  if (features.itemTierData && features.itemTierByte) {
    item.tier = msg.getByte();
  }

  if (features.astraItemState) {
    const hasDuration = msg.getByte() === 1;
    if (hasDuration) {
      item.duration = msg.getU32() * 1000;
      item.stopTime = msg.getByte() === 1;
    }
    const hasCharges = msg.getByte() === 1;
    if (hasCharges) {
      item.charges = msg.getU32();
      item.chargesAreMax = msg.getByte() === 1;
    }
    item.slotPosition = msg.getU16();
    item.astraFlags = msg.getByte();
  }

  return item;
}

export class ProtocolGameParse {
  /**
   * @param {object} game estado do jogo que recebe os updates
   * @param {object} options.features perfil de features (precisa ser o mesmo do lado servidor)
   * @param {Map} options.itemTypes clientId -> { stackable, fluidContainer, splash }
   */
  constructor(game, { features = FEATURE_PROFILE, itemTypes = new Map() } = {}) {
    this.game = game;
    this.features = features;
    this.itemTypes = itemTypes;
  }

  /** Recebe uma mensagem como ela sai do fio ([u16 tamanho][corpo]). */
  receiveWire(bytes) {
    return this.receive(InputMessage.fromWire(bytes));
  }

  /**
   * Um frame pode trazer VARIAS mensagens coladas: o writeToOutputBuffer do servidor so faz append
   * num OutputMessage compartilhado (protocolgame.cpp:1338). Entao o certo e iterar ate esgotar o
   * corpo, e nao assumir uma mensagem por frame.
   */
  receiveAllWire(bytes) {
    const msg = InputMessage.fromWire(bytes);
    const results = [];
    while (msg.remaining > 0) {
      results.push(this.receive(msg));
    }
    return results;
  }

  receive(msg) {
    const opcode = msg.getByte();
    switch (opcode) {
      case GameServerOpcode.PlayerStats:
        return this.parsePlayerStats(msg);
      case GameServerOpcode.PlayerSkills:
        return this.parsePlayerSkills(msg);
      case GameServerOpcode.PlayerInventoryItem:
        return this.parseInventoryItem(msg, true);
      case GameServerOpcode.PlayerInventoryItemEmpty:
        return this.parseInventoryItem(msg, false);
      case GameServerOpcode.OpenContainer:
        return this.parseContainer(msg);
      case GameServerOpcode.CloseContainer:
        return this.parseCloseContainer(msg);
      case GameServerOpcode.ContainerAddItem:
        return this.parseContainerAddItem(msg);
      case GameServerOpcode.ContainerUpdateItem:
        return this.parseContainerUpdateItem(msg);
      case GameServerOpcode.ContainerRemoveItem:
        return this.parseContainerRemoveItem(msg);
      case GameServerOpcode.TextMessage:
        return this.parseTextMessage(msg);
      case GameServerOpcode.PlayerBasicData:
        return this.parseBasicData(msg);
      default:
        throw new Error(`opcode nao tratado: 0x${opcode.toString(16)}`);
    }
  }

  parsePlayerStats(msg) {
    const stats = {};
    stats.health = msg.getU32();
    stats.maxHealth = msg.getU32();
    // A capacidade vai no fio em CENTESIMOS: o cliente divide por 100 ao exibir
    // (protocolgameparse.cpp). Guardamos ja convertido para o HUD nao ter que saber disso.
    stats.freeCapacity = msg.getU32() / 100;
    stats.experience = msg.getU32();
    stats.level = msg.getU16();
    stats.levelPercent = msg.getByte();

    if (this.features.isAstraClient) {
      stats.baseXpGain = msg.getU16();
      stats.voucherXpBoost = msg.getU16();
      stats.grindingXpBoost = msg.getU16();
      stats.xpBoostPercent = msg.getU16();
      stats.staminaXpBoost = msg.getU16();
    }

    stats.mana = msg.getU32();
    stats.maxMana = msg.getU32();

    stats.magicLevel = msg.getByte();
    if (this.features.isOTC) stats.baseMagicLevel = msg.getByte();
    stats.magicLevelPercent = msg.getByte();

    stats.soul = msg.getByte();
    stats.staminaMinutes = msg.getU16();

    if (this.features.isOTC) {
      stats.baseSpeed = msg.getU16() * 2;
      stats.offlineTrainingTime = msg.getU16();
      if (this.features.isAstraClient) {
        stats.xpBoostTime = msg.getU16();
        stats.canBuyXpBoost = msg.getByte() === 0x01;
      }
    }

    this.game.setStats(stats);
    return stats;
  }

  parsePlayerSkills(msg) {
    const skills = [];
    for (const id of SKILL_ORDER) {
      if (this.features.isOTC) {
        skills.push({
          id,
          level: msg.getU16(),
          base: msg.getU16(),
          percent: msg.getByte(),
        });
      } else {
        skills.push({ id, level: msg.getByte(), base: null, percent: msg.getByte() });
      }
    }

    const specials = [];
    if (this.features.isOTC) {
      for (let i = 0; i < SPECIAL_SKILL_COUNT; i++) {
        specials.push({ value: msg.getU16(), extra: msg.getU16() });
      }
    }

    this.game.setSkills(skills, specials);
    return { skills, specials };
  }

  parseInventoryItem(msg, hasItem) {
    const slot = msg.getByte();
    const item = hasItem ? parseItem(msg, this.features, this.itemTypes) : null;
    this.game.setInventoryItem(slot, item);
    return { slot, item };
  }

  parseContainer(msg) {
    const cid = msg.getByte();
    const containerItem = parseItem(msg, this.features, this.itemTypes);
    const name = msg.getString();
    const capacity = msg.getByte();
    const hasParent = msg.getByte() === 1;

    let isUnlocked = true;
    let hasPages = false;
    let containerSize = 0;
    let firstIndex = 0;

    if (this.features.containerPagination) {
      isUnlocked = msg.getByte() === 1;
      hasPages = msg.getByte() === 1;
      containerSize = msg.getU16();
      firstIndex = msg.getU16();
    }

    const itemCount = msg.getByte();
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(parseItem(msg, this.features, this.itemTypes));
    }

    const container = {
      cid,
      containerItem,
      name,
      capacity,
      hasParent,
      isUnlocked,
      hasPages,
      size: containerSize || items.length,
      firstIndex,
      items,
    };
    this.game.openContainer(container);
    return container;
  }

  parseCloseContainer(msg) {
    const cid = msg.getByte();
    this.game.closeContainer(cid);
    return { cid };
  }

  parseContainerAddItem(msg) {
    const cid = msg.getByte();
    const slot = this.features.containerPagination ? msg.getU16() : 0;
    const item = parseItem(msg, this.features, this.itemTypes);
    this.game.containerAddItem(cid, slot, item);
    return { cid, slot, item };
  }

  parseContainerUpdateItem(msg) {
    const cid = msg.getByte();
    const slot = this.features.containerPagination ? msg.getU16() : msg.getByte();
    const item = parseItem(msg, this.features, this.itemTypes);
    this.game.containerUpdateItem(cid, slot, item);
    return { cid, slot, item };
  }

  parseContainerRemoveItem(msg) {
    const cid = msg.getByte();
    let slot;
    let lastItem = null;
    if (this.features.containerPagination) {
      slot = msg.getU16();
      if (msg.getByte() === 1) lastItem = parseItem(msg, this.features, this.itemTypes);
    } else {
      slot = msg.getByte();
    }
    this.game.containerRemoveItem(cid, slot, lastItem);
    return { cid, slot, lastItem };
  }

  parseTextMessage(msg) {
    const type = msg.getByte();
    const text = msg.getString();
    this.game.addTextMessage(type, text);
    return { type, text };
  }

  parseBasicData(msg) {
    const premium = msg.getByte() === 1;
    const vocation = msg.getByte();
    msg.getByte(); // prey
    const spellCount = msg.getU16();
    const spells = [];
    for (let i = 0; i < spellCount; i++) spells.push(msg.getU16());
    const magicShield = msg.getByte();
    this.game.setBasicData({ premium, vocation, spells, magicShield });
    return { premium, vocation, spells, magicShield };
  }
}
