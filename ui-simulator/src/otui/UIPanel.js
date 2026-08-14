import { UIWidget } from './UIWidget.js';

export class UIPanel extends UIWidget {
  constructor(config = {}) {
    super(config);
    this.element.classList.remove('UIWidget');
    this.element.classList.add('UIPanel');
    if (config.className) {
      this.element.classList.add(config.className);
    }
  }
}
