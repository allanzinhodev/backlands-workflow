// Lado servidor: monta os pacotes exatamente como server/src/protocolgame.cpp monta.
//
// A ordem e a condicionalidade de cada campo foram copiadas linha a linha da fonte, porque e isso
// que faz o parser do lado cliente casar. Referencias no comentario de cada funcao.

import { OutputMessage } from './NetworkMessage.js';
import { GameServerOpcode, FEATURE_PROFILE, SPECIAL_SKILL_COUNT } from './opcodes.js';

// Mapa de fluidos do protocolo (networkmessage.cpp usa fluidMap[count & 7]).
const FLUID_MAP = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 * Serializacao de um item dentro de um pacote (NetworkMessage::addItem, networkmessage.cpp:177-227).
 *
 * item: { clientId, count, stackable, fluid, duration, charges, slotPosition, astraFlags }
 */
export function addItem(msg, item, features = FEATURE_PROFILE) {
  msg.addU16(item.clientId);

  if (item.stackable) {
    msg.addByte(Math.min(0xff, item.count || 1));
  } else if (item.fluid !== undefined && item.fluid !== null) {
    msg.addByte(FLUID_MAP[item.fluid & 7]);
  }

  if (features.itemTierData && features.itemTierByte) {
    msg.addByte(item.tier || 0);
  }

  if (features.astraItemState) {
    const hasDuration = Boolean(item.duration && item.duration > 0);
    msg.addByte(hasDuration ? 1 : 0);
    if (hasDuration) {
      msg.addU32(Math.floor(item.duration / 1000));
      msg.addByte(item.stopTime ? 1 : 0);
    }

    const charges = item.charges || 0;
    msg.addByte(charges > 0 ? 1 : 0);
    if (charges > 0) {
      msg.addU32(charges);
      msg.addByte(item.chargesAreMax ? 1 : 0);
    }

    // addAstraItemMetadata: slotPosition u16 + flags u8
    msg.addU16(item.slotPosition || 0);
    msg.addByte(item.astraFlags || 0);
  }

  return msg;
}

/** AddPlayerStats (protocolgame.cpp:4860-4928), opcode 0xA0. */
export function sendStats(player, features = FEATURE_PROFILE) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.PlayerStats);

  msg.addU32(player.health);
  msg.addU32(player.maxHealth);
  // Capacidade vai em centesimos (o cliente divide por 100).
  msg.addU32(Math.round(player.freeCapacity * 100));
  msg.addU32(Math.min(player.experience, 0x7fffffff));
  msg.addU16(player.level);
  msg.addByte(player.levelPercent);

  if (features.isAstraClient) {
    msg.addU16(player.baseXpGain ?? 100);
    msg.addU16(0); // voucher XP boost
    msg.addU16(player.grindingXpBoost ?? 0);
    msg.addU16(player.xpBoostPercent ?? 0);
    msg.addU16(player.staminaXpBoost ?? 100);
  }

  msg.addU32(player.mana);
  msg.addU32(player.maxMana);

  msg.addByte(Math.min(player.magicLevel, 0xff));
  if (features.isOTC) msg.addByte(Math.min(player.baseMagicLevel ?? player.magicLevel, 0xff));
  msg.addByte(player.magicLevelPercent);

  msg.addByte(player.soul);
  msg.addU16(player.staminaMinutes);

  if (features.isOTC) {
    msg.addU16(Math.floor(player.baseSpeed / 2));
    msg.addU16(Math.floor((player.offlineTrainingTime || 0) / 60 / 1000));
    if (features.isAstraClient) {
      msg.addU16(player.xpBoostTime ?? 0);
      msg.addByte((player.xpBoostTime ?? 0) > 0 ? 0x00 : 0x01);
    }
  }

  return msg;
}

/** AddPlayerSkills (protocolgame.cpp:4930-4952), opcode 0xA1. */
export function sendSkills(skills, specialSkills = [], features = FEATURE_PROFILE) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.PlayerSkills);

  if (!features.isOTC) {
    for (const skill of skills) {
      msg.addByte(Math.min(0xff, skill.level));
      msg.addByte(skill.percent);
    }
    return msg;
  }

  for (const skill of skills) {
    msg.addU16(Math.min(0xffff, skill.level));
    msg.addU16(skill.base ?? skill.level);
    msg.addByte(skill.percent);
  }
  for (let i = 0; i < SPECIAL_SKILL_COUNT; i++) {
    const special = specialSkills[i] || { value: 0 };
    msg.addU16(Math.min(10000, special.value || 0));
    msg.addU16(0);
  }

  return msg;
}

/** sendInventoryItem (protocolgame.cpp:4193-4210), opcodes 0x78 / 0x79. */
export function sendInventoryItem(slot, item, features = FEATURE_PROFILE) {
  const msg = new OutputMessage();
  if (item) {
    msg.addByte(GameServerOpcode.PlayerInventoryItem);
    msg.addByte(slot);
    addItem(msg, item, features);
  } else {
    msg.addByte(GameServerOpcode.PlayerInventoryItemEmpty);
    msg.addByte(slot);
  }
  return msg;
}

/** sendContainer (protocolgame.cpp:3298-3350), opcode 0x6E. */
export function sendContainer(
  { cid, containerItem, name, capacity, hasParent, items, firstIndex = 0, paginate = false },
  features = FEATURE_PROFILE
) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.OpenContainer);
  msg.addByte(cid);

  addItem(msg, containerItem, features);
  msg.addString(name);

  msg.addByte(capacity);
  msg.addByte(hasParent ? 0x01 : 0x00);

  if (features.containerPagination) {
    msg.addByte(0x01); // drag and drop
    msg.addByte(paginate ? 0x01 : 0x00);
    msg.addU16(Math.min(0xffff, items.length));
    msg.addU16(firstIndex);
  }

  const maxItemsToSend = paginate ? capacity : 0xff;
  const itemCount = firstIndex >= items.length ? 0 : Math.min(maxItemsToSend, items.length - firstIndex);
  msg.addByte(Math.min(0xff, itemCount));

  for (let i = 0; i < itemCount; i++) {
    addItem(msg, items[firstIndex + i], features);
  }

  return msg;
}

/** sendCloseContainer, opcode 0x6F. */
export function sendCloseContainer(cid) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.CloseContainer);
  msg.addByte(cid);
  return msg;
}

/** sendAddContainerItem, opcode 0x70. */
export function sendContainerAddItem(cid, slot, item, features = FEATURE_PROFILE) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.ContainerAddItem);
  msg.addByte(cid);
  if (features.containerPagination) msg.addU16(slot);
  addItem(msg, item, features);
  return msg;
}

/** sendUpdateContainerItem, opcode 0x71. */
export function sendContainerUpdateItem(cid, slot, item, features = FEATURE_PROFILE) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.ContainerUpdateItem);
  msg.addByte(cid);
  if (features.containerPagination) msg.addU16(slot);
  else msg.addByte(slot);
  addItem(msg, item, features);
  return msg;
}

/** sendRemoveContainerItem, opcode 0x72. */
export function sendContainerRemoveItem(cid, slot, lastItem, features = FEATURE_PROFILE) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.ContainerRemoveItem);
  msg.addByte(cid);
  if (features.containerPagination) {
    msg.addU16(slot);
    if (lastItem) {
      msg.addByte(0x01);
      addItem(msg, lastItem, features);
    } else {
      msg.addByte(0x00);
    }
  } else {
    msg.addByte(slot);
  }
  return msg;
}

/** sendTextMessage (protocolgame.cpp:3140-3147), opcode 0xB4. */
export function sendTextMessage(type, text) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.TextMessage);
  msg.addByte(type);
  msg.addString(text);
  return msg;
}

/** sendBasicData (protocolgame.cpp:3100-3138), opcode 0x9F. So para AstraClient. */
export function sendBasicData({ premium, vocation, spells = [], magicShield = 0 }) {
  const msg = new OutputMessage();
  msg.addByte(GameServerOpcode.PlayerBasicData);
  msg.addByte(premium ? 1 : 0);
  msg.addByte(vocation);
  msg.addByte(0x00); // prey: o client le este byte quando GamePrey esta ligado
  msg.addU16(spells.length);
  for (const spell of spells) msg.addU16(spell);
  msg.addByte(magicShield);
  return msg;
}
