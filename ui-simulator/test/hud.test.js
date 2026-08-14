import { describe, it, expect, beforeEach } from 'vitest';
import { g_ui } from '../src/otui/g_ui.js';
import { registerCoreWidgets } from '../src/otui/widgets.js';
import { UIItem } from '../src/otui/UIItem.js';
import { loadClientStyles } from '../src/otui/clientStyles.js';
import { HUD_STYLES } from '../src/modules/hudStyles.js';
import { InventoryPanel } from '../src/modules/game_inventory/inventory.js';
import { ContainerWindows } from '../src/modules/game_containers/containers.js';
import { HealthInfoPanel } from '../src/modules/game_healthinfo/healthinfo.js';
import { SkillsPanel } from '../src/modules/game_skills/skills.js';
import { Game } from '../src/game/Game.js';
import { ProtocolGameParse } from '../src/game/protocol/ProtocolGameParse.js';
import { ServerSim, DEFAULT_CHARACTER } from '../src/game/ServerSim.js';
import { FEATURE_PROFILE, InventorySlot } from '../src/game/protocol/opcodes.js';
import manifest from '../src/assets/items/items.json';

// O ponto destes testes: o HUD NAO e alimentado por chamadas diretas. Tudo entra por bytes que o
// ServerSim monta igual ao TFS e o parser do cliente consome. Se o protocolo quebrar, o HUD apaga.

const catalog = new Map(manifest.items.map((item) => [item.clientId, item]));
const itemTypes = new Map(
  manifest.items.map((item) => [item.clientId, { stackable: item.stackable, name: item.name }])
);

function boot() {
  document.body.innerHTML = '<div id="ui-root"></div>';
  const rootEl = document.getElementById('ui-root');
  Object.defineProperty(rootEl, 'clientWidth', { value: 1024, configurable: true });
  Object.defineProperty(rootEl, 'clientHeight', { value: 768, configurable: true });

  g_ui.registry.styles.clear();
  g_ui.registry.unique.clear();
  g_ui.registry.globals.clear();
  registerCoreWidgets(g_ui);
  g_ui.registerClass('UIItem', UIItem);

  const root = g_ui.init('ui-root');
  loadClientStyles(g_ui);
  g_ui.importStyles(HUD_STYLES, 'hud.otui');

  const game = new Game();
  const parser = new ProtocolGameParse(game, { features: FEATURE_PROFILE, itemTypes });
  const server = new ServerSim(parser, JSON.parse(JSON.stringify(DEFAULT_CHARACTER)));

  return { root, game, parser, server };
}

describe('inventario', () => {
  let ctx;
  let panel;

  beforeEach(() => {
    ctx = boot();
    panel = new InventoryPanel(ctx.game, catalog);
    panel.create(ctx.root);
  });

  it('cria os dez slots com o id do protocolo', () => {
    expect(panel.slots.size).toBe(10);
    for (let slot = 1; slot <= 10; slot++) {
      const widget = panel.getSlotWidget(slot);
      expect(widget, `slot ${slot}`).not.toBeNull();
      expect(widget.id).toBe(`slot${slot}`);
    }
  });

  it('usa os estilos de slot do 40-inventory.otui do cliente', () => {
    // A imagem de fundo de cada slot vazio vem do estilo real, nao de um caminho inventado aqui.
    const head = panel.getSlotWidget(InventorySlot.Head);
    expect(head.styleName).toBe('HeadSlot');
    expect(head.baseProps.get('image-source')).toBe('/images/game/slots/head');

    const back = panel.getSlotWidget(InventorySlot.Back);
    expect(back.baseProps.get('image-source')).toBe('/images/game/slots/back');
  });

  it('preenche os slots a partir dos pacotes 0x78 do login', () => {
    ctx.server.login();

    expect(panel.getSlotWidget(InventorySlot.Head).getItem().clientId).toBe(3351);
    expect(panel.getSlotWidget(InventorySlot.Body).getItem().clientId).toBe(3357);
    expect(panel.getSlotWidget(InventorySlot.Right).getItem().clientId).toBe(3264);
    // Ammo vai vazio no personagem de teste.
    expect(panel.getSlotWidget(InventorySlot.Ammo).getItem()).toBeNull();
  });

  it('desequipar chega como 0x79 e limpa o slot', () => {
    ctx.server.login();
    expect(panel.getSlotWidget(InventorySlot.Head).getItem()).not.toBeNull();

    ctx.server.equip(InventorySlot.Head, null);
    expect(panel.getSlotWidget(InventorySlot.Head).getItem()).toBeNull();
    expect(panel.getSlotWidget(InventorySlot.Head).element.classList.contains('filled')).toBe(false);
  });

  it('aponta o sprite extraido do Tibia.spr', () => {
    ctx.server.login();
    const body = panel.getSlotWidget(InventorySlot.Body);
    expect(body.spriteNode.style.backgroundImage).toContain('3357.png');
  });
});

describe('container (backpack)', () => {
  let ctx;
  let containers;

  beforeEach(() => {
    ctx = boot();
    containers = new ContainerWindows(ctx.game, catalog).attach(ctx.root);
  });

  it('abre a janela com o nome que veio no pacote 0x6E', () => {
    ctx.server.openBackpack();
    const win = containers.getWindow(0);
    expect(win).not.toBeNull();
    expect(win.getText()).toBe('backpack');
  });

  it('desenha um slot por posicao de capacidade, preenchendo os que tem item', () => {
    ctx.server.openBackpack();
    const entry = containers.windows.get(0);
    expect(entry.cells).toHaveLength(20); // capacidade da backpack
    expect(entry.cells[0].getItem().clientId).toBe(3031);
    expect(entry.cells[6].getItem().clientId).toBe(2920);
    expect(entry.cells[7].getItem()).toBeNull();
  });

  it('stackable mostra a contagem e escolhe o sprite pela faixa', () => {
    ctx.server.openBackpack();
    const gold = containers.windows.get(0).cells[0];
    expect(gold.getItem().count).toBe(87);
    expect(gold.countNode.textContent).toBe('87');
    // 87 cai na faixa >= 50 -> ultimo sprite da folha (indice 7)
    expect(gold.spriteNode.style.backgroundImage).toContain('3031-7.png');
  });

  it('item nao empilhavel nao mostra contagem', () => {
    ctx.server.openBackpack();
    const potion = containers.windows.get(0).cells[2];
    expect(potion.getItem().clientId).toBe(266);
    expect(potion.countNode.textContent).toBe('');
  });

  it('loot chega por 0x70 e aparece na janela', () => {
    ctx.server.openBackpack();
    ctx.server.addToBackpack({ clientId: 3043, count: 3, stackable: true });

    const cells = containers.windows.get(0).cells;
    expect(cells[0].getItem().clientId).toBe(3043);
    expect(cells[0].countNode.textContent).toBe('3');
  });

  it('fechar remove a janela do DOM', () => {
    ctx.server.openBackpack();
    expect(document.querySelector('.container-window')).not.toBeNull();
    ctx.server.closeBackpack();
    expect(document.querySelector('.container-window')).toBeNull();
  });
});

describe('HP / MP / experiencia', () => {
  let ctx;
  let hud;

  beforeEach(() => {
    ctx = boot();
    hud = new HealthInfoPanel(ctx.game);
    hud.create(ctx.root);
  });

  it('reflete os valores absolutos do 0xA0 (nao porcentagem)', () => {
    ctx.server.login();
    expect(hud.healthBar.getText()).toBe('185 / 185');
    expect(hud.manaBar.getText()).toBe('90 / 90');
    expect(hud.healthBar.getPercent()).toBe(100);
  });

  it('dano reenvia o 0xA0 inteiro e a barra desce', () => {
    ctx.server.login();
    ctx.server.setHealth(92);

    expect(ctx.game.player.health).toBe(92);
    expect(hud.healthBar.getText()).toBe('92 / 185');
    expect(hud.healthBar.getPercent()).toBe(49); // floor(92/185*100)
    expect(hud.healthBar.fillNode.style.width).toBe('49%');
  });

  it('mostra nivel, capacidade e soul', () => {
    ctx.server.login();
    expect(hud.experienceBar.getText()).toBe('Level 8 (42%)');
    expect(hud.capLabel.getText()).toBe('Cap: 470');
    expect(hud.soulLabel.getText()).toBe('Soul: 100');
  });

  it('usa as cores de barra dos estilos do cliente', () => {
    // HealthBar/ManaBar sao estilos reais de 10-progressbars.otui.
    expect(g_ui.registry.getStyle('HealthBar')).not.toBeNull();
    expect(g_ui.registry.getStyle('ManaBar')).not.toBeNull();
  });
});

describe('skills', () => {
  let ctx;
  let panel;

  beforeEach(() => {
    ctx = boot();
    panel = new SkillsPanel(ctx.game);
    panel.create(ctx.root);
  });

  it('cria uma linha por skill do 0xA1, com nome do enum do servidor', () => {
    ctx.server.login();
    expect(panel.getRow('skill-0')).not.toBeNull(); // fist
    expect(panel.getRow('skill-6')).not.toBeNull(); // fishing

    const sword = panel.getRow('skill-2');
    expect(sword.element.textContent).toContain('Sword Fighting');
    expect(sword.element.textContent).toContain('25');
  });

  it('mostra special skills so quando tem valor', () => {
    ctx.server.login();
    // O personagem de teste tem critical chance 3.50% e critical amount 12.00%.
    expect(panel.getRow('special-0').element.textContent).toContain('3.50%');
    expect(panel.getRow('special-1').element.textContent).toContain('12.00%');
    // As quatro zeradas nao viram linha.
    expect(panel.getRow('special-2')).toBeNull();
  });
});

describe('sequencia completa de login', () => {
  it('emite os pacotes na ordem do sendAddCreature e monta o HUD inteiro', () => {
    const ctx = boot();
    const inventory = new InventoryPanel(ctx.game, catalog);
    const hud = new HealthInfoPanel(ctx.game);
    const skills = new SkillsPanel(ctx.game);
    const containers = new ContainerWindows(ctx.game, catalog).attach(ctx.root);
    inventory.create(ctx.root);
    hud.create(ctx.root);
    skills.create(ctx.root);

    ctx.server.login();
    ctx.server.openBackpack();

    // 10 slots + stats + skills + basic data + mensagem + container
    expect(ctx.server.sent).toHaveLength(15);
    expect(ctx.game.inventory.size).toBe(9); // ammo vazio
    expect(ctx.game.skills).toHaveLength(7);
    expect(ctx.game.player.level).toBe(8);
    expect(containers.getWindow(0)).not.toBeNull();
    expect(ctx.game.messages[0].text).toContain('Welcome to Backlands');
    expect(ctx.server.totalBytes()).toBeGreaterThan(200);
  });
});
