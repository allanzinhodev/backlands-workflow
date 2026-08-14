import { g_ui } from './otui/g_ui.js';
import { UIWindow } from './otui/UIWindow.js';
import { UIButton } from './otui/UIButton.js';
import { UIPanel } from './otui/UIPanel.js';

// Initialize the global UI system on our root element
g_ui.init('ui-root');

// 1. TOP MENU
const topMenu = new UIPanel({ className: 'UITopMenu' });

// We can now construct widgets passing OTUI-like style dictionaries!
const mapBtn = new UIPanel({
  className: 'UITopButton',
  'image-border': 4,
  'image-source': 'ui/button-clear-18x18-up.png', // Dynamic rendering!
  'tooltip': 'Minimap'
});
mapBtn.element.style.backgroundImage = "url('@images/topbuttons/minimap.png')"; // Icon on top of border

const battleBtn = new UIPanel({
  className: 'UITopButton',
  'image-border': 4,
  'image-source': 'ui/button-clear-18x18-up.png',
  'tooltip': 'Battle'
});
battleBtn.element.style.backgroundImage = "url('@images/topbuttons/battle.png')";

const inventoryBtn = new UIPanel({
  className: 'UITopButton',
  'image-border': 4,
  'image-source': 'ui/button-clear-18x18-up.png',
  'tooltip': 'Inventory'
});
inventoryBtn.element.style.backgroundImage = "url('@images/topbuttons/inventory.png')";

topMenu.addChild(mapBtn);
topMenu.addChild(battleBtn);
topMenu.addChild(inventoryBtn);
g_ui.displayUI(topMenu);

// 2. GAME AREA
const gameArea = new UIPanel({ className: 'UIGameArea' });
g_ui.displayUI(gameArea);

const gameMap = new UIPanel({ className: 'UIMapContainer' });
gameArea.addChild(gameMap);

const rightPanel = new UIPanel({ className: 'UIRightPanel' });
gameArea.addChild(rightPanel);

// --- WINDOWS (Using dynamic defaults from UIWindow) ---

const minimapWindow = new UIWindow({
  title: 'Minimap',
  size: '170 140'
});
const minimapImg = new UIPanel({
  'background-color': '#000',
  'margin': 2,
  size: '100% 100px'
});
minimapImg.element.style.border = '1px solid #111';
minimapWindow.addChild(minimapImg);
rightPanel.addChild(minimapWindow);

const inventoryWindow = new UIWindow({
  title: 'Inventory',
  size: '170 180'
});

const eqContainer = new UIPanel({ className: 'UIEquipment' });
const slots = ['amulet', 'head', 'backpack', 'lefthand', 'body', 'righthand', 'ring', 'legs', 'ammo', 'feet'];
slots.forEach(slotType => {
  const slot = new UIPanel({ className: 'UIItemSlot' });
  slot.element.classList.add(slotType);
  slot.element.classList.add(`eq-${slotType}`);
  eqContainer.addChild(slot);
});
inventoryWindow.addChild(eqContainer);
rightPanel.addChild(inventoryWindow);

const battleWindow = new UIWindow({
  title: 'Battle',
  size: '170 120'
});

// A standard button! The OTUI styling for it is completely abstracted in UIButton class.
const battleBtnTest = new UIButton({
  text: 'Attack Target',
  margin: 4
});
battleWindow.addChild(battleBtnTest);
rightPanel.addChild(battleWindow);

// Adjust positions of windows to unset since they use flex column now
document.querySelectorAll('.UIWindow').forEach(w => {
  w.style.position = 'relative';
});
