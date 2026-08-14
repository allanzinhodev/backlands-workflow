import { UIWidget } from './UIWidget.js';

export class UIWindow extends UIWidget {
  constructor(config = {}) {
    // Apply window defaults like in OTUI Base Style
    const windowConfig = {
      'image-source': '@images/ui/2pixel-up-frame-borderimage.png',
      'image-border': 2,
      'padding': 4,
      ...config
    };
    
    super(windowConfig);
    this.element.classList.remove('UIWidget'); 
    this.element.classList.add('UIWindow');

    // Title bar
    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('UIWindow-title');
    this.titleBar.innerText = config.title || config.text || 'Window';
    this.element.appendChild(this.titleBar);

    // Content container
    this.content = document.createElement('div');
    this.content.classList.add('UIWindow-content');
    this.element.appendChild(this.content);

    // Basic drag support
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.titleBar.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      const rect = this.element.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const root = document.getElementById('ui-root');
      const rootRect = root.getBoundingClientRect();
      
      let x = e.clientX - this.dragOffsetX - rootRect.left;
      let y = e.clientY - this.dragOffsetY - rootRect.top;
      
      this.element.style.left = `${x}px`;
      this.element.style.top = `${y}px`;
    });
  }

  // Override addChild to append to content container
  addChild(widget) {
    this.children.push(widget);
    widget.parent = this;
    this.content.appendChild(widget.element);
    widget.updateAnchors();
  }
}
