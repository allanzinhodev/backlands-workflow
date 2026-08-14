import { UIWidget } from './UIWidget.js';

export class UIButton extends UIWidget {
  constructor(config = {}) {
    const buttonConfig = {
      'image-source': '@images/ui/button-darkgrey-up.png',
      'image-border': 3,
      ...config
    };
    
    super(buttonConfig);
    this.element.classList.remove('UIWidget');
    this.element.classList.add('UIButton');
    
    // Add dynamic hover/active handling via JS to simulate UI events better
    this.element.addEventListener('mousedown', () => {
      this.element.style.borderImageSource = `url('@images/ui/button-darkgrey-down.png')`;
    });
    
    this.element.addEventListener('mouseup', () => {
      this.element.style.borderImageSource = `url('${buttonConfig['image-source']}')`;
    });
    
    this.element.addEventListener('mouseleave', () => {
      this.element.style.borderImageSource = `url('${buttonConfig['image-source']}')`;
    });
  }
}
