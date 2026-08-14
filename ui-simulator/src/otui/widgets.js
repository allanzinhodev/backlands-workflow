// Subclasses de widget. Cada uma corresponde a uma classe do client (C++ ou corelib Lua) e so
// acrescenta o comportamento que o estilo base nao consegue expressar.

import { UIWidget } from './UIWidget.js';

export class UIButton extends UIWidget {
  constructor(styleName = 'UIButton') {
    super(styleName);
    this.element.style.userSelect = 'none';

    this.element.addEventListener('mouseenter', () => {
      if (this.enabled) this.setState('hover', true);
    });
    this.element.addEventListener('mouseleave', () => this.setState('hover', false));

    // O client mantem 'pressed' mesmo se o mouse sair do widget (uimanager.cpp:220-234);
    // por isso o release e escutado no window, nao no elemento.
    this.element.addEventListener('mousedown', () => {
      if (!this.enabled) return;
      this.setState('pressed', true);
      const release = () => {
        this.setState('pressed', false);
        window.removeEventListener('mouseup', release);
      };
      window.addEventListener('mouseup', release);
    });

    this.element.addEventListener('click', () => {
      if (!this.enabled) return;
      this.emit('click');
    });
  }
}

export class UILabel extends UIWidget {
  constructor(styleName = 'UILabel') {
    super(styleName);
  }
}

export class UITextEdit extends UIWidget {
  constructor(styleName = 'UITextEdit') {
    super(styleName);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'otui-input';
    input.style.position = 'absolute';
    input.style.inset = '0';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.background = 'transparent';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.color = 'inherit';
    input.style.font = 'inherit';
    input.style.padding = '0 4px';
    input.style.boxSizing = 'border-box';
    this.input = input;
    this.element.appendChild(input);

    input.addEventListener('input', () => this.emit('textChange', this.getText()));
    input.addEventListener('focus', () => this.setState('focus', true));
    input.addEventListener('blur', () => this.setState('focus', false));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.emit('enter');
    });
  }

  applyProp(name, value) {
    switch (name) {
      case 'text':
        this.input.value = value === null || value === undefined ? '' : String(value);
        return;
      case 'max-length':
        this.input.maxLength = parseInt(value, 10) || 0;
        return;
      case 'text-hidden':
        this.input.type = value === 'true' ? 'password' : 'text';
        return;
      case 'placeholder':
        this.input.placeholder = String(value);
        return;
      case 'only-number':
        if (value === 'true') this.input.inputMode = 'numeric';
        return;
      case 'editable':
        this.input.readOnly = value !== 'true';
        return;
      case 'color':
        this.element.style.color = String(value);
        this.input.style.color = String(value);
        return;
      default:
        super.applyProp(name, value);
    }
  }

  getText() {
    return this.input.value;
  }

  setText(text) {
    this.input.value = text === null || text === undefined ? '' : String(text);
  }

  focus() {
    this.input.focus();
  }
}

export class UICheckBox extends UIWidget {
  constructor(styleName = 'UICheckBox') {
    super(styleName);
    this.element.style.cursor = 'pointer';
    this.element.addEventListener('click', () => {
      if (!this.enabled) return;
      this.setChecked(!this.hasState('checked'));
    });
    this.element.addEventListener('mouseenter', () => this.setState('hover', true));
    this.element.addEventListener('mouseleave', () => this.setState('hover', false));
  }

  setChecked(checked) {
    this.setState('checked', checked);
    this.emit('checkChange', checked);
  }

  isChecked() {
    return this.hasState('checked');
  }
}

export class UIComboBox extends UIWidget {
  constructor(styleName = 'UIComboBox') {
    super(styleName);
    this.options = [];
    this.currentIndex = -1;
    this.element.style.cursor = 'pointer';
    this.element.addEventListener('click', () => this.toggleMenu());
  }

  addOption(text, data) {
    this.options.push({ text, data });
    if (this.currentIndex === -1) this.setCurrentIndex(0);
    return this.options.length - 1;
  }

  clearOptions() {
    this.options = [];
    this.currentIndex = -1;
    this.setText('');
  }

  setCurrentIndex(index) {
    if (index < 0 || index >= this.options.length) return;
    this.currentIndex = index;
    this.setText(this.options[index].text);
    this.emit('optionChange', this.options[index].text, this.options[index].data);
  }

  getCurrentOption() {
    return this.currentIndex >= 0 ? this.options[this.currentIndex] : null;
  }

  toggleMenu() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
      return;
    }
    const menu = document.createElement('div');
    menu.className = 'otui-combo-menu';
    const rect = this.element.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom}px`;
    menu.style.minWidth = `${rect.width}px`;
    this.options.forEach((option, index) => {
      const item = document.createElement('div');
      item.className = 'otui-combo-item';
      item.textContent = option.text;
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        this.setCurrentIndex(index);
        menu.remove();
        this.menu = null;
      });
      menu.appendChild(item);
    });
    document.body.appendChild(menu);
    this.menu = menu;
  }
}

export class UIWindow extends UIWidget {
  constructor(styleName = 'UIWindow') {
    super(styleName);
    // O titulo da janela e o 'text' do proprio widget, desenhado na faixa do topo pela textura
    // 9-slice (image-border-top). Por isso o texto e alinhado no topo, nao ao centro.
    this.ensureTextNode().style.alignItems = 'flex-start';
  }
}

export class UIProgressBar extends UIWidget {
  constructor(styleName = 'UIProgressBar') {
    super(styleName);
    this.percent = 0;
    const fill = document.createElement('div');
    fill.className = 'otui-progress-fill';
    fill.style.position = 'absolute';
    fill.style.left = '0';
    fill.style.top = '0';
    fill.style.height = '100%';
    fill.style.width = '0%';
    fill.style.pointerEvents = 'none';
    this.fillNode = fill;
    // Fica atras do texto para o rotulo continuar legivel.
    this.element.insertBefore(fill, this.element.firstChild);
  }

  applyProp(name, value) {
    if (name === 'percent') {
      this.setPercent(parseFloat(value) || 0);
      return;
    }
    if (name === 'background-color') {
      // Num progressbar, background-color e a cor do PREENCHIMENTO (uiprogressbar.lua:63-71),
      // nao o fundo do widget.
      this.fillNode.style.backgroundColor = String(value);
      return;
    }
    super.applyProp(name, value);
  }

  setPercent(percent) {
    this.percent = Math.max(0, Math.min(100, percent));
    this.fillNode.style.width = `${this.percent}%`;
  }

  getPercent() {
    return this.percent;
  }
}

export function registerCoreWidgets(g_ui) {
  g_ui.registerClass('UIWidget', UIWidget);
  g_ui.registerClass('UIButton', UIButton);
  g_ui.registerClass('UILabel', UILabel);
  g_ui.registerClass('UITextEdit', UITextEdit);
  g_ui.registerClass('UICheckBox', UICheckBox);
  g_ui.registerClass('UIComboBox', UIComboBox);
  g_ui.registerClass('UIWindow', UIWindow);
  g_ui.registerClass('UIProgressBar', UIProgressBar);
}
