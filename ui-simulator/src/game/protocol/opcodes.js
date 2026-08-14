// Opcodes do servidor (protocolo 8.60), conferidos nos dois lados:
// server/src/protocolgame.cpp e client/src/client/protocolcodes.h.
export const GameServerOpcode = {
  PlayerBasicData: 0x9f, // sendBasicData  (so para AstraClient)
  PlayerStats: 0xa0, // AddPlayerStats
  PlayerSkills: 0xa1, // AddPlayerSkills
  PlayerInventoryItem: 0x78, // sendInventoryItem (slot ocupado)
  PlayerInventoryItemEmpty: 0x79, // sendInventoryItem (slot vazio)
  OpenContainer: 0x6e, // sendContainer
  CloseContainer: 0x6f,
  ContainerAddItem: 0x70,
  ContainerUpdateItem: 0x71,
  ContainerRemoveItem: 0x72,
  TextMessage: 0xb4,
  PlayerInventory: 0xf5, // snapshot empacotado (Astra)
};

// slots_t do servidor / InventorySlot do cliente. A ordem importa: e o indice que vai no
// pacote 0x78, e e o mesmo numero que aparece no id do widget (slot1..slot10 em 40-inventory.otui).
export const InventorySlot = {
  Head: 1,
  Neck: 2,
  Back: 3,
  Body: 4,
  Right: 5,
  Left: 6,
  Leg: 7,
  Feet: 8,
  Finger: 9,
  Ammo: 10,
};

export const INVENTORY_SLOT_ORDER = [
  InventorySlot.Head,
  InventorySlot.Neck,
  InventorySlot.Back,
  InventorySlot.Body,
  InventorySlot.Right,
  InventorySlot.Left,
  InventorySlot.Leg,
  InventorySlot.Feet,
  InventorySlot.Finger,
  InventorySlot.Ammo,
];

export const SLOT_NAMES = {
  [InventorySlot.Head]: 'head',
  [InventorySlot.Neck]: 'neck',
  [InventorySlot.Back]: 'back',
  [InventorySlot.Body]: 'body',
  [InventorySlot.Right]: 'right-hand',
  [InventorySlot.Left]: 'left-hand',
  [InventorySlot.Leg]: 'legs',
  [InventorySlot.Feet]: 'feet',
  [InventorySlot.Finger]: 'finger',
  [InventorySlot.Ammo]: 'ammo',
};

// SKILL_FIRST..SKILL_LAST do servidor.
export const Skill = {
  Fist: 0,
  Club: 1,
  Sword: 2,
  Axe: 3,
  Distance: 4,
  Shielding: 5,
  Fishing: 6,
};

export const SKILL_ORDER = [
  Skill.Fist,
  Skill.Club,
  Skill.Sword,
  Skill.Axe,
  Skill.Distance,
  Skill.Shielding,
  Skill.Fishing,
];

export const SKILL_NAMES = {
  [Skill.Fist]: 'Fist Fighting',
  [Skill.Club]: 'Club Fighting',
  [Skill.Sword]: 'Sword Fighting',
  [Skill.Axe]: 'Axe Fighting',
  [Skill.Distance]: 'Distance Fighting',
  [Skill.Shielding]: 'Shielding',
  [Skill.Fishing]: 'Fishing',
};

// SPECIALSKILL_FIRST..SPECIALSKILL_LAST (server/src/enums.h:430-439): sao SEIS, nao cinco --
// criticalHitChance, criticalHitAmount, lifeLeechChance, lifeLeechAmount, manaLeechChance,
// manaLeechAmount. Errar essa contagem desalinha o fim do 0xA1 e, como o frame pode trazer varias
// mensagens coladas, contamina tudo que vier depois no mesmo frame.
export const SPECIAL_SKILL_COUNT = 6;

export const SPECIAL_SKILL_NAMES = [
  'Critical Hit Chance',
  'Critical Hit Amount',
  'Life Leech Chance',
  'Life Leech Amount',
  'Mana Leech Chance',
  'Mana Leech Amount',
];

/**
 * Perfil de features efetivo deste par cliente/servidor.
 *
 * De onde vem cada valor:
 *   - isOTC / isAstraClient: o AstraClient manda o marcador "OTCv8" e o marcador "A" com assinatura
 *     no pacote de login (protocolgamesend.cpp:154-166), e o servidor confere
 *     (protocolgame.cpp:1144-1187). Com a assinatura batendo, os dois sao true.
 *   - astraItemState: config do servidor astraItemStateEnabled = true (data/server_config.lua:12)
 *   - containerPagination: o servidor manda ContainerPagination=true no 0x43 para OTCv8/Astra
 *   - itemTierByte: shouldSendItemTierByte() depende de enableItemTierDisplay, que esta false
 *   - quickLoot: enableQuickLoot = true no config.lua, mas so muda flags, nao o layout do item
 */
export const FEATURE_PROFILE = {
  isOTC: true,
  isAstraClient: true,
  astraItemState: true,
  containerPagination: true,
  itemTierByte: false,
  itemTierData: false,
  astraQuiverCountU16: true,
};
