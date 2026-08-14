// Equivalente de corelib/ui/messagebox.lua: displayErrorBox / displayCancelBox / displayInfoBox.
// O client monta um UIWindow modal com um Label e botoes; aqui e a mesma estrutura, com o mesmo
// texto, porque as mensagens sao parte do comportamento observavel do login.

import { g_ui } from '../otui/g_ui.js';

const MESSAGE_BOX_OTUI = `
MessageBoxWindow < UIWindow
  font: verdana-11px-antialised
  size: 260 110
  color: #8f8f8f
  text-offset: 0 2
  text-align: top
  image-source: /images/ui/popupwindow
  image-border: 6
  image-border-top: 27
  padding-top: 35
  padding-left: 16
  padding-right: 16
  padding-bottom: 10
`;

function ensureStyles() {
  // Checar o registro em vez de um flag de modulo: o flag sobrevive a um reset do registro
  // (acontece entre testes) e o estilo some sem ninguem perceber.
  if (g_ui.registry.styles.has('MessageBoxWindow')) return;
  g_ui.importStyles(MESSAGE_BOX_OTUI, 'messagebox.otui');
}

function createBox({ title, message, buttons }) {
  ensureStyles();

  const overlay = document.createElement('div');
  overlay.className = 'otui-modal-overlay';

  const host = g_ui.rootWidget;
  const box = g_ui.createWidget('MessageBoxWindow', host);
  box.setText(title);
  box.element.classList.add('otui-modal');

  const label = g_ui.createWidget('UILabel', box);
  label.applyProp('text', message);
  label.applyProp('color', '#dfdfdf');
  label.applyProp('text-align', 'center');
  label.applyProp('text-wrap', 'true');
  label.anchors.push({ edge: 'left', targetId: 'parent', targetEdge: 'left' });
  label.anchors.push({ edge: 'right', targetId: 'parent', targetEdge: 'right' });
  label.anchors.push({ edge: 'top', targetId: 'parent', targetEdge: 'top' });
  label.rect.h = 34;
  label.ensureTextNode().style.whiteSpace = 'normal';

  const api = {
    widget: box,
    destroy() {
      overlay.remove();
      box.destroy();
    },
    onOk: null,
    onCancel: null,
  };

  let previous = null;
  for (const spec of [...buttons].reverse()) {
    const button = g_ui.createWidget('Button', box);
    button.applyProp('text', spec.text);
    button.rect.w = 64;
    button.rect.h = 20;
    button.anchors.push({ edge: 'bottom', targetId: 'parent', targetEdge: 'bottom' });
    if (previous) {
      button.anchors.push({ edge: 'right', targetId: previous.id, targetEdge: 'left' });
      button.margins.right = 6;
    } else {
      button.anchors.push({ edge: 'right', targetId: 'parent', targetEdge: 'right' });
    }
    button.id = spec.id;
    button.element.dataset.id = spec.id;
    button.on('click', () => {
      api.destroy();
      if (spec.role === 'ok' && api.onOk) api.onOk();
      if (spec.role === 'cancel' && api.onCancel) api.onCancel();
    });
    previous = button;
  }

  // centerIn: parent, resolvido pelo proprio layout de ancoras.
  box.anchors.push({ edge: 'horizontalCenter', targetId: 'parent', targetEdge: 'horizontalCenter' });
  box.anchors.push({ edge: 'verticalCenter', targetId: 'parent', targetEdge: 'verticalCenter' });

  host.element.appendChild(overlay);
  host.element.appendChild(box.element);
  host.updateLayout();
  box.element.style.zIndex = '100';

  return api;
}

export function displayErrorBox(title, message) {
  return createBox({ title, message, buttons: [{ id: 'okButton', text: 'Ok', role: 'ok' }] });
}

export function displayInfoBox(title, message) {
  return createBox({ title, message, buttons: [{ id: 'okButton', text: 'Ok', role: 'ok' }] });
}

export function displayCancelBox(title, message) {
  return createBox({ title, message, buttons: [{ id: 'cancelButton', text: 'Cancel', role: 'cancel' }] });
}
