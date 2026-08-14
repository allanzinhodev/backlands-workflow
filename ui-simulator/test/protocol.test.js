import { describe, it, expect, beforeEach } from 'vitest';
import { OutputMessage, InputMessage } from '../src/game/protocol/NetworkMessage.js';
import * as send from '../src/game/protocol/ProtocolGameSend.js';
import { ProtocolGameParse } from '../src/game/protocol/ProtocolGameParse.js';
import { Game } from '../src/game/Game.js';
import { InventorySlot, FEATURE_PROFILE, SPECIAL_SKILL_COUNT } from '../src/game/protocol/opcodes.js';

const ITEM_TYPES = new Map([
  [2854, { name: 'backpack' }],
  [3031, { name: 'gold coin', stackable: true }],
  [3357, { name: 'plate armor' }],
  [3264, { name: 'sword' }],
  [266, { name: 'health potion' }],
]);

function makeParser(game) {
  return new ProtocolGameParse(game, { features: FEATURE_PROFILE, itemTypes: ITEM_TYPES });
}

describe('NetworkMessage', () => {
  it('escreve little-endian e devolve o header de tamanho no fio', () => {
    const msg = new OutputMessage();
    msg.addU16(0x1234);
    expect(Array.from(msg.getBody())).toEqual([0x34, 0x12]);

    const wire = msg.toWire();
    expect(Array.from(wire)).toEqual([0x02, 0x00, 0x34, 0x12]);
  });

  it('string e [u16 tamanho][bytes], um byte por caractere', () => {
    const msg = new OutputMessage();
    msg.addString('Bag');
    expect(Array.from(msg.getBody())).toEqual([0x03, 0x00, 0x42, 0x61, 0x67]);
    expect(new InputMessage(msg.getBody()).getString()).toBe('Bag');
  });
});

describe('0xA0 stats', () => {
  const player = {
    health: 185,
    maxHealth: 185,
    freeCapacity: 470,
    experience: 4200,
    level: 8,
    levelPercent: 42,
    mana: 90,
    maxMana: 90,
    magicLevel: 3,
    baseMagicLevel: 3,
    magicLevelPercent: 17,
    soul: 100,
    staminaMinutes: 2520,
    baseSpeed: 220,
    offlineTrainingTime: 0,
  };

  it('tem tamanho fixo de 51 bytes neste perfil de features', () => {
    // 1 opcode + 20 base + 10 astra-xp + 8 mana + 3 magic + 3 soul/stamina + 4 otc + 3 astra-boost
    const msg = send.sendStats(player);
    expect(msg.length).toBe(51);
  });

  it('faz round-trip preservando cada campo', () => {
    const game = new Game();
    const parsed = makeParser(game).receiveWire(send.sendStats(player).toWire());

    expect(parsed.health).toBe(185);
    expect(parsed.maxHealth).toBe(185);
    expect(parsed.level).toBe(8);
    expect(parsed.levelPercent).toBe(42);
    expect(parsed.mana).toBe(90);
    expect(parsed.magicLevel).toBe(3);
    expect(parsed.soul).toBe(100);
    expect(parsed.staminaMinutes).toBe(2520);
    expect(game.player.health).toBe(185);
  });

  it('capacidade viaja em centesimos e volta em unidades', () => {
    const game = new Game();
    const wire = send.sendStats({ ...player, freeCapacity: 470.5 }).toWire();
    const parsed = makeParser(game).receiveWire(wire);
    expect(parsed.freeCapacity).toBe(470.5);
  });

  it('baseSpeed viaja dividido por dois', () => {
    const game = new Game();
    const parsed = makeParser(game).receiveWire(send.sendStats(player).toWire());
    expect(parsed.baseSpeed).toBe(220);
  });

  it('emite onHealthChange so quando a vida muda', () => {
    const game = new Game();
    const parser = makeParser(game);
    let calls = 0;
    game.on('onHealthChange', () => calls++);

    parser.receiveWire(send.sendStats(player).toWire());
    expect(calls).toBe(1);
    parser.receiveWire(send.sendStats(player).toWire());
    expect(calls).toBe(1);
    parser.receiveWire(send.sendStats({ ...player, health: 100 }).toWire());
    expect(calls).toBe(2);
  });
});

describe('0xA1 skills', () => {
  const skills = [
    { level: 10, base: 10, percent: 0 },
    { level: 11, base: 10, percent: 25 },
    { level: 12, base: 12, percent: 50 },
    { level: 13, base: 13, percent: 75 },
    { level: 14, base: 14, percent: 10 },
    { level: 15, base: 15, percent: 90 },
    { level: 16, base: 16, percent: 5 },
  ];

  it('tem tamanho fixo de 60 bytes: 7 skills + 6 special skills', () => {
    // 1 + 7*(2+2+1) + 6*(2+2) = 1 + 35 + 24 = 60
    expect(SPECIAL_SKILL_COUNT).toBe(6);
    expect(send.sendSkills(skills).length).toBe(60);
  });

  it('faz round-trip com nome resolvido', () => {
    const game = new Game();
    makeParser(game).receiveWire(send.sendSkills(skills).toWire());

    expect(game.skills).toHaveLength(7);
    expect(game.skills[0].name).toBe('Fist Fighting');
    expect(game.skills[2].level).toBe(12);
    expect(game.skills[5].percent).toBe(90);
    expect(game.specialSkills).toHaveLength(6);
  });
});

describe('0x78 / 0x79 inventario', () => {
  it('slot ocupado carrega o ClientID do item', () => {
    const game = new Game();
    const item = { clientId: 3357, slotPosition: 8, astraFlags: 1 };
    makeParser(game).receiveWire(send.sendInventoryItem(InventorySlot.Body, item).toWire());

    expect(game.getInventoryItem(InventorySlot.Body).clientId).toBe(3357);
  });

  it('slot vazio limpa o inventario', () => {
    const game = new Game();
    const parser = makeParser(game);
    parser.receiveWire(send.sendInventoryItem(InventorySlot.Body, { clientId: 3357 }).toWire());
    parser.receiveWire(send.sendInventoryItem(InventorySlot.Body, null).toWire());
    expect(game.getInventoryItem(InventorySlot.Body)).toBeNull();
  });

  it('item empilhavel leva o count, nao empilhavel nao leva', () => {
    const stackable = new OutputMessage();
    send.addItem(stackable, { clientId: 3031, count: 87, stackable: true });
    const plain = new OutputMessage();
    send.addItem(plain, { clientId: 3357 });
    expect(stackable.length).toBe(plain.length + 1);
  });

  it('bloco astra item-state acrescenta duracao, cargas e metadata', () => {
    const withState = new OutputMessage();
    send.addItem(withState, { clientId: 3357, slotPosition: 8, astraFlags: 1 });
    const withoutState = new OutputMessage();
    send.addItem(withoutState, { clientId: 3357 }, { ...FEATURE_PROFILE, astraItemState: false });
    // 2 flags (duration/charges) + u16 slotPosition + u8 flags = 5 bytes
    expect(withState.length - withoutState.length).toBe(5);
  });

  it('preserva duracao e cargas no round-trip', () => {
    const game = new Game();
    const item = { clientId: 266, duration: 60000, stopTime: true, charges: 5, chargesAreMax: true, slotPosition: 0 };
    const parsed = makeParser(game).receiveWire(send.sendInventoryItem(InventorySlot.Ammo, item).toWire());
    expect(parsed.item.duration).toBe(60000);
    expect(parsed.item.stopTime).toBe(true);
    expect(parsed.item.charges).toBe(5);
  });
});

describe('0x6E container (backpack)', () => {
  const backpack = {
    cid: 0,
    containerItem: { clientId: 2854 },
    name: 'backpack',
    capacity: 20,
    hasParent: false,
    items: [
      { clientId: 3031, count: 100, stackable: true },
      { clientId: 3264 },
      { clientId: 266 },
    ],
  };

  it('abre com nome, capacidade e itens', () => {
    const game = new Game();
    const parsed = makeParser(game).receiveWire(send.sendContainer(backpack).toWire());

    expect(parsed.name).toBe('backpack');
    expect(parsed.capacity).toBe(20);
    expect(parsed.hasParent).toBe(false);
    expect(parsed.items).toHaveLength(3);
    expect(parsed.items[0].clientId).toBe(3031);
    expect(parsed.items[0].count).toBe(100);
    expect(game.getContainer(0).items).toHaveLength(3);
  });

  it('paginacao acrescenta os quatro campos e mantem o alinhamento', () => {
    const game = new Game();
    const semPaginacao = send.sendContainer(backpack, { ...FEATURE_PROFILE, containerPagination: false });
    const comPaginacao = send.sendContainer(backpack);
    // dragAndDrop u8 + paginate u8 + size u16 + firstIndex u16 = 6 bytes
    expect(comPaginacao.length - semPaginacao.length).toBe(6);

    const parsed = makeParser(game).receiveWire(comPaginacao.toWire());
    expect(parsed.size).toBe(3);
    expect(parsed.firstIndex).toBe(0);
  });

  it('add / update / remove mexem no container aberto', () => {
    const game = new Game();
    const parser = makeParser(game);
    parser.receiveWire(send.sendContainer(backpack).toWire());

    parser.receiveWire(send.sendContainerAddItem(0, 0, { clientId: 3357 }).toWire());
    expect(game.getContainer(0).items[0].clientId).toBe(3357);
    expect(game.getContainer(0).items).toHaveLength(4);

    parser.receiveWire(send.sendContainerUpdateItem(0, 0, { clientId: 3264 }).toWire());
    expect(game.getContainer(0).items[0].clientId).toBe(3264);

    parser.receiveWire(send.sendContainerRemoveItem(0, 0, null).toWire());
    expect(game.getContainer(0).items).toHaveLength(3);
  });

  it('fecha o container', () => {
    const game = new Game();
    const parser = makeParser(game);
    parser.receiveWire(send.sendContainer(backpack).toWire());
    parser.receiveWire(send.sendCloseContainer(0).toWire());
    expect(game.getContainer(0)).toBeNull();
  });
});

describe('frame com varias mensagens coladas', () => {
  it('itera ate esgotar o corpo, como o writeToOutputBuffer do servidor produz', () => {
    const game = new Game();
    const parser = makeParser(game);

    // O servidor concatena mensagens no mesmo buffer de saida.
    const frame = new OutputMessage();
    const stats = send.sendStats({
      health: 185, maxHealth: 185, freeCapacity: 470, experience: 0, level: 8, levelPercent: 0,
      mana: 90, maxMana: 90, magicLevel: 0, magicLevelPercent: 0, soul: 100, staminaMinutes: 2520,
      baseSpeed: 220, offlineTrainingTime: 0,
    });
    const inventory = send.sendInventoryItem(InventorySlot.Body, { clientId: 3357 });
    for (const byte of stats.getBody()) frame.addByte(byte);
    for (const byte of inventory.getBody()) frame.addByte(byte);

    const results = parser.receiveAllWire(frame.toWire());
    expect(results).toHaveLength(2);
    expect(game.player.level).toBe(8);
    expect(game.getInventoryItem(InventorySlot.Body).clientId).toBe(3357);
  });
});

describe('divergencia de features desalinha o frame (o bug real)', () => {
  it('parser sem astraItemState le lixo quando o servidor manda com', () => {
    const game = new Game();
    const parser = new ProtocolGameParse(game, {
      features: { ...FEATURE_PROFILE, astraItemState: false },
      itemTypes: ITEM_TYPES,
    });
    // Servidor manda COM item-state; cliente le SEM -> sobra byte e o proximo campo sai errado.
    const wire = send.sendInventoryItem(InventorySlot.Body, { clientId: 3357, slotPosition: 8 }).toWire();
    const parsed = parser.receiveWire(wire);
    expect(parsed.item.clientId).toBe(3357);
    // fromWire ja descarta o header de tamanho, entao o corpo e:
    // opcode(1) + slot(1) + clientId(2) + bloco astra(5) = 9 bytes
    const msg = InputMessage.fromWire(wire);
    expect(msg.buffer.length).toBe(9);
  });
});
