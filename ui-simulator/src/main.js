// Ponto de entrada do simulador.
//
// Fluxo: carrega os estilos reais do cliente -> monta a tela de login (entergame.otui real) ->
// no login, um servidor simulado emite os MESMOS bytes do TFS -> o parser do cliente le esses
// bytes -> o estado do jogo emite eventos -> os paineis do HUD reagem.
//
// Nenhum painel escreve no estado direto: tudo passa pelo protocolo. E isso que faz o simulador
// valer como referencia do cliente de verdade.

import { g_ui } from './otui/g_ui.js';
import { registerCoreWidgets } from './otui/widgets.js';
import { UIItem } from './otui/UIItem.js';
import { loadClientStyles } from './otui/clientStyles.js';
import { HUD_STYLES } from './modules/hudStyles.js';
import { EnterGame } from './modules/client_entergame/entergame.js';
import { InventoryPanel } from './modules/game_inventory/inventory.js';
import { ContainerWindows } from './modules/game_containers/containers.js';
import { HealthInfoPanel } from './modules/game_healthinfo/healthinfo.js';
import { SkillsPanel } from './modules/game_skills/skills.js';
import { Game } from './game/Game.js';
import { ProtocolGameParse } from './game/protocol/ProtocolGameParse.js';
import { ServerSim, DEFAULT_CHARACTER } from './game/ServerSim.js';
import { FEATURE_PROFILE, InventorySlot } from './game/protocol/opcodes.js';

import itemsManifest from './assets/items/items.json';

// ---------------------------------------------------------------- bootstrap

registerCoreWidgets(g_ui);
g_ui.registerClass('UIItem', UIItem);

const root = g_ui.init('ui-root');
loadClientStyles(g_ui);
g_ui.importStyles(HUD_STYLES, 'hud.otui');

// Catalogo de itens vindo da extracao do Tibia.dat/Tibia.spr.
const catalog = new Map(itemsManifest.items.map((item) => [item.clientId, item]));
const itemTypes = new Map(
  itemsManifest.items.map((item) => [
    item.clientId,
    { stackable: item.stackable, fluidContainer: item.fluidContainer, name: item.name },
  ])
);

const game = new Game();
const parser = new ProtocolGameParse(game, { features: FEATURE_PROFILE, itemTypes });
const server = new ServerSim(parser);

// ---------------------------------------------------------------- telas

const gameArea = g_ui.createWidget('UIWidget', root);
gameArea.id = 'gameArea';
gameArea.element.dataset.id = 'gameArea';
gameArea.element.classList.add('game-area');
gameArea.setVisible(false);
gameArea.anchors.push({ edge: 'left', targetId: 'parent', targetEdge: 'left' });
gameArea.anchors.push({ edge: 'right', targetId: 'parent', targetEdge: 'right' });
gameArea.anchors.push({ edge: 'top', targetId: 'parent', targetEdge: 'top' });
gameArea.anchors.push({ edge: 'bottom', targetId: 'parent', targetEdge: 'bottom' });

const sidePanel = g_ui.createWidget('UIWidget', gameArea);
sidePanel.id = 'rightPanel';
sidePanel.element.dataset.id = 'rightPanel';
sidePanel.element.classList.add('right-panel');
sidePanel.rect = { x: 0, y: 0, w: 182, h: 0 };
sidePanel.anchors.push({ edge: 'right', targetId: 'parent', targetEdge: 'right' });
sidePanel.anchors.push({ edge: 'top', targetId: 'parent', targetEdge: 'top' });
sidePanel.anchors.push({ edge: 'bottom', targetId: 'parent', targetEdge: 'bottom' });

const healthInfo = new HealthInfoPanel(game);
const inventory = new InventoryPanel(game, catalog);
const skills = new SkillsPanel(game);
const containers = new ContainerWindows(game, catalog).attach(gameArea);

const healthWindow = healthInfo.create(sidePanel);
const inventoryWindow = inventory.create(sidePanel);
const skillsWindow = skills.create(sidePanel);

// As janelas do painel direito ficam empilhadas na ordem em que foram criadas.
let stackTop = 4;
for (const win of [healthWindow, inventoryWindow, skillsWindow]) {
  win.rect.x = 4;
  win.rect.y = stackTop;
  stackTop += win.rect.h + 6;
  win.applyRectToDOM({ x: 0, y: 0 });
}

// Clicar na backpack equipada abre o container -- que so entao dispara o 0x6E.
const backSlot = inventory.getSlotWidget(InventorySlot.Back);
if (backSlot) {
  backSlot.element.style.cursor = 'pointer';
  backSlot.element.addEventListener('click', () => {
    if (game.getContainer(0)) server.closeBackpack();
    else server.openBackpack();
  });
}

const enterGame = new EnterGame({
  onLogin: ({ account, password }) => {
    // A conta de teste do servidor local e 1/1; god/god tambem passa.
    const valid =
      (account === '1' && password === '1') || (account === 'god' && password === 'god') || account === '';
    if (!valid) {
      return { ok: false, error: 'Account name or password is not correct.' };
    }

    game.setOnline(true);
    gameArea.setVisible(true);
    server.login();
    server.openBackpack();
    updateStatusBar();
    return { ok: true };
  },
});
enterGame.create(root);

// ---------------------------------------------------------------- barra de status

const status = document.createElement('div');
status.className = 'sim-status';
document.body.appendChild(status);

function updateStatusBar() {
  const container = game.getContainer(0);
  status.innerHTML = [
    `<strong>${DEFAULT_CHARACTER.name}</strong>`,
    `HP ${game.player.health}/${game.player.maxHealth}`,
    `MP ${game.player.mana}/${game.player.maxMana}`,
    `equipado: ${game.inventory.size}/10`,
    `backpack: ${container ? container.items.length : 0} itens`,
    `${server.sent.length} pacotes / ${server.totalBytes()} bytes`,
  ].join(' &nbsp;·&nbsp; ');
}

game.on('onStatsChange', updateStatusBar);
game.on('onContainerUpdate', updateStatusBar);
game.on('onInventoryChange', updateStatusBar);

game.on('onTextMessage', (type, text) => {
  const line = document.createElement('div');
  line.className = 'sim-message';
  line.textContent = text;
  document.body.appendChild(line);
  setTimeout(() => line.remove(), 6000);
});

// ---------------------------------------------------------------- console de teste

// Exposto para dirigir o simulador pelo console do browser -- cada chamada emite bytes de verdade.
window.sim = {
  game,
  server,
  parser,
  catalog,
  damage: (amount) => server.setHealth(game.player.health - amount),
  heal: (amount) => server.setHealth(game.player.health + amount),
  spendMana: (amount) => server.setMana(game.player.mana - amount),
  loot: (clientId, count = 1) => server.addToBackpack({ clientId, count, stackable: count > 1 }),
  equip: (slot, clientId) => server.equip(slot, { clientId, slotPosition: 0, astraFlags: 1 }),
  unequip: (slot) => server.equip(slot, null),
  openBackpack: () => server.openBackpack(),
  slots: InventorySlot,
};

console.info(
  '%cBacklands UI Simulator',
  'font-weight:bold',
  '\nLogin: 1/1 ou god/god.',
  '\nDepois use window.sim no console: sim.damage(50), sim.loot(3031, 100), sim.unequip(sim.slots.Head)'
);
