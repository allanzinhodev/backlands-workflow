// UIWidget: The base element in OTUI mimicking C++ UIWidget
export class UIWidget {
  constructor(config = {}) {
    this.element = document.createElement('div');
    this.element.classList.add('UIWidget');
    this.children = [];
    this.parent = null;
    
    // Virtual OTUI properties
    this.anchors = {};
    
    if (config) {
      this.applyStyle(config);
    }
  }

  // Parse OTUI-like style objects
  applyStyle(config) {
    if (config.id) this.setId(config.id);
    if (config.text) this.setText(config.text);
    
    // Core Layout
    if (config.size) {
      const parts = config.size.split(' ');
      if (parts.length === 2) {
        this.setWidth(parts[0]);
        this.setHeight(parts[1]);
      }
    }
    if (config.width) this.setWidth(config.width);
    if (config.height) this.setHeight(config.height);
    if (config.x !== undefined) this.element.style.left = `${config.x}px`;
    if (config.y !== undefined) this.element.style.top = `${config.y}px`;
    if (config.pos) {
      const parts = config.pos.split(' ');
      if (parts.length === 2) {
        this.element.style.left = `${parts[0]}px`;
        this.element.style.top = `${parts[1]}px`;
      }
    }

    // Margins
    if (config.margin) {
      this.element.style.margin = `${config.margin}px`;
    }
    if (config['margin-top']) this.element.style.marginTop = `${config['margin-top']}px`;
    if (config['margin-bottom']) this.element.style.marginBottom = `${config['margin-bottom']}px`;
    if (config['margin-left']) this.element.style.marginLeft = `${config['margin-left']}px`;
    if (config['margin-right']) this.element.style.marginRight = `${config['margin-right']}px`;

    // Padding
    if (config.padding) {
      this.element.style.padding = `${config.padding}px`;
    }
    if (config['padding-top']) this.element.style.paddingTop = `${config['padding-top']}px`;
    if (config['padding-bottom']) this.element.style.paddingBottom = `${config['padding-bottom']}px`;
    if (config['padding-left']) this.element.style.paddingLeft = `${config['padding-left']}px`;
    if (config['padding-right']) this.element.style.paddingRight = `${config['padding-right']}px`;

    // Visuals (9-slice Image Border)
    if (config['image-source']) {
      // Resolve alias to our vite setup
      let imgSrc = config['image-source'];
      if (imgSrc.startsWith('/images/')) {
        imgSrc = imgSrc.replace('/images/', '@images/');
      } else if (!imgSrc.startsWith('@images/') && !imgSrc.startsWith('http')) {
        imgSrc = `@images/${imgSrc}`;
      }
      
      if (config['image-border'] || config['image-border-top']) {
        this.element.style.borderImageSource = `url('${imgSrc}')`;
        const border = config['image-border'] || 0;
        this.element.style.borderImageSlice = `${border} fill`;
        this.element.style.borderImageWidth = `${border}px`;
        this.element.style.borderImageOutset = `0`;
        this.element.style.borderImageRepeat = `stretch`;
        this.element.style.borderStyle = `solid`;
      } else {
        this.element.style.backgroundImage = `url('${imgSrc}')`;
        this.element.style.backgroundRepeat = 'no-repeat';
        if (config['image-repeated']) this.element.style.backgroundRepeat = 'repeat';
      }
    }
    
    // Colors
    if (config.color) this.element.style.color = config.color;
    if (config['background-color']) this.element.style.backgroundColor = config['background-color'];

    // Anchors
    if (config.anchors) {
      this.anchors = { ...this.anchors, ...config.anchors };
      this.element.style.position = 'absolute'; // Anchored elements are absolute
      this.updateAnchors();
    }
    
    // Tooltip
    if (config.tooltip) {
      this.element.title = config.tooltip;
    }
  }

  // Simplified Anchor Layout Engine
  updateAnchors() {
    // In a real OTClient, UIAnchorLayout updates all children recursively
    // Here we map basic 'parent.top', 'parent.left', etc., to CSS
    for (const [side, targetStr] of Object.entries(this.anchors)) {
      if (targetStr === 'parent.top') this.element.style.top = '0';
      if (targetStr === 'parent.bottom') this.element.style.bottom = '0';
      if (targetStr === 'parent.left') this.element.style.left = '0';
      if (targetStr === 'parent.right') this.element.style.right = '0';
      if (targetStr === 'parent.horizontalCenter') {
        this.element.style.left = '50%';
        this.element.style.transform = 'translateX(-50%)';
      }
      if (targetStr === 'parent.verticalCenter') {
        this.element.style.top = '50%';
        this.element.style.transform = 'translateY(-50%)';
      }
    }
  }

  setId(id) {
    this.element.id = id;
  }

  getId() {
    return this.element.id;
  }

  setText(text) {
    this.element.innerText = text;
  }

  addChild(widget) {
    this.children.push(widget);
    widget.parent = this;
    this.element.appendChild(widget.element);
    widget.updateAnchors(); // Update anchors after mounting
  }

  removeChild(widget) {
    const index = this.children.indexOf(widget);
    if (index > -1) {
      this.children.splice(index, 1);
      this.element.removeChild(widget.element);
      widget.parent = null;
    }
  }

  destroy() {
    if (this.parent) {
      this.parent.removeChild(this);
    } else {
      this.element.remove();
    }
  }

  setWidth(width) {
    this.element.style.width = width.toString().includes('%') ? width : `${width}px`;
  }

  setHeight(height) {
    this.element.style.height = height.toString().includes('%') ? height : `${height}px`;
  }

  onClick(callback) {
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
      callback(e);
    });
  }
}
