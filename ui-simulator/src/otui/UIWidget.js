// UIWidget: porte de client/src/framework/ui/uiwidget.cpp + uiwidgetbasestyle.cpp.
//
// Modelo de caixa (spec secao 0):
//   - rect e o retangulo EXTERNO ('size:' define ele)
//   - padding NAO muda o tamanho do widget; ele define a area onde os filhos sao posicionados
//   - margin NAO muda o tamanho; so quem posiciona (ancoras e box layouts) le
//   - border e pintura pura, nao participa do layout -> box-shadow inset, nunca 'border' do CSS

import { resolveAnchors, normalizeEdge } from './AnchorLayout.js';
import { clipToDataURL } from './imageClip.js';

const STATE_NAMES = [
  'active',
  'focus',
  'hover',
  'pressed',
  'disabled',
  'checked',
  'on',
  'first',
  'middle',
  'last',
  'alternate',
  'dragging',
  'hidden',
  'mobile',
];

function parseInts(value, count) {
  if (value === null || value === undefined) return [];
  return String(value)
    .trim()
    .split(/\s+/)
    .slice(0, count)
    .map((n) => parseInt(n, 10))
    .map((n) => (Number.isNaN(n) ? 0 : n));
}

// Shorthand de margin/padding: identico ao CSS (uiwidgetbasestyle.cpp:216-285).
function parseBox(value) {
  const parts = parseInts(value, 4);
  if (parts.length === 4) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

function isPercent(value) {
  return typeof value === 'string' && value.trim().endsWith('%');
}

export class UIWidget {
  constructor(styleName = 'UIWidget') {
    this.element = document.createElement('div');
    this.element.classList.add('otui', styleName);

    this.styleName = styleName;
    this.id = '';
    this.children = [];
    this.parent = null;

    this.rect = { x: 0, y: 0, w: 0, h: 0 };
    this.percentSize = { w: null, h: null };
    this.margins = { top: 0, right: 0, bottom: 0, left: 0 };
    this.padding = { top: 0, right: 0, bottom: 0, left: 0 };
    this.anchors = [];

    this.layoutType = 'anchor';
    this.layoutParams = {};

    this.states = new Set();
    this.baseProps = new Map();
    this.stateBlocks = [];
    this.appliedProps = new Map();

    this.eventHandlers = new Map();
    this.luaFields = new Map();

    this.visible = true;
    this.enabled = true;
    this.phantom = false;
    this.focusable = false;

    this.textNode = null;
    this.iconNode = null;

    this.element.style.position = 'absolute';
    this.element.style.boxSizing = 'border-box';
  }

  // ---------------------------------------------------------------- arvore

  addChild(child) {
    child.parent = this;
    this.children.push(child);
    this.element.appendChild(child.element);
    child.updateStateFlags();
    this.updateChildrenPositionStates();
    this.updateLayout();
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index === -1) return;
    this.children.splice(index, 1);
    if (child.element.parentNode === this.element) this.element.removeChild(child.element);
    child.parent = null;
    this.updateChildrenPositionStates();
    this.updateLayout();
  }

  destroy() {
    for (const child of [...this.children]) child.destroy();
    if (this.parent) this.parent.removeChild(this);
    else this.element.remove();
  }

  getChildById(id) {
    return this.children.find((c) => c.id === id) || null;
  }

  // Busca recursiva: nao existe no C++ (la a ancora e so entre irmaos), mas os modulos Lua fazem
  // isso o tempo todo com recursiveGetChildById.
  recursiveGetChildById(id) {
    for (const child of this.children) {
      if (child.id === id) return child;
      const found = child.recursiveGetChildById(id);
      if (found) return found;
    }
    return null;
  }

  // ---------------------------------------------------------------- estilo

  setStyleFromNode(node, styleRegistry) {
    for (const child of node.childNodes()) {
      const tag = child.tag;
      if (!tag) continue;

      if (tag.startsWith('$')) {
        // Bloco de estado: guarda na ORDEM DE DECLARACAO, porque o ultimo que bate vence.
        this.stateBlocks.push({
          conditions: parseStateConditions(tag),
          props: nodeToProps(child, styleRegistry),
        });
        continue;
      }

      if (tag.startsWith('@')) {
        this.luaFields.set(tag.slice(1), child.value);
        continue;
      }

      const name = tag.startsWith('!') || tag.startsWith('&') ? tag.slice(1) : tag;
      const value = styleRegistry ? styleRegistry.resolveVars(child.value) : child.value;
      this.baseProps.set(name, value);
    }

    this.applyProps(this.baseProps);
    this.refreshStateStyle();
  }

  applyProps(props) {
    for (const [name, value] of props) {
      this.applyProp(name, value);
    }
    this.appliedProps = new Map(props);
  }

  applyProp(name, value) {
    const el = this.element;

    switch (name) {
      case 'id':
        this.id = String(value);
        el.dataset.id = this.id;
        return;

      case 'size': {
        const [w, h] = String(value).trim().split(/\s+/);
        this.setWidth(w);
        this.setHeight(h);
        return;
      }
      case 'width':
        this.setWidth(value);
        return;
      case 'height':
        this.setHeight(value);
        return;
      case 'x':
        this.rect.x = parseInt(value, 10) || 0;
        return;
      case 'y':
        this.rect.y = parseInt(value, 10) || 0;
        return;
      case 'pos': {
        const [x, y] = parseInts(value, 2);
        this.rect.x = x || 0;
        this.rect.y = y || 0;
        return;
      }

      case 'margin':
        this.margins = parseBox(value);
        return;
      case 'margin-top':
        this.margins.top = parseInt(value, 10) || 0;
        return;
      case 'margin-right':
        this.margins.right = parseInt(value, 10) || 0;
        return;
      case 'margin-bottom':
        this.margins.bottom = parseInt(value, 10) || 0;
        return;
      case 'margin-left':
        this.margins.left = parseInt(value, 10) || 0;
        return;

      case 'padding':
        this.padding = parseBox(value);
        return;
      case 'padding-top':
        this.padding.top = parseInt(value, 10) || 0;
        return;
      case 'padding-right':
        this.padding.right = parseInt(value, 10) || 0;
        return;
      case 'padding-bottom':
        this.padding.bottom = parseInt(value, 10) || 0;
        return;
      case 'padding-left':
        this.padding.left = parseInt(value, 10) || 0;
        return;

      case 'text':
        this.setText(value);
        return;
      case 'text-align':
        this.setTextAlign(value);
        return;
      case 'text-offset': {
        const [ox, oy] = parseInts(value, 2);
        this.ensureTextNode().style.transform = `translate(${ox || 0}px, ${oy || 0}px)`;
        return;
      }
      case 'text-auto-resize':
        this.textAutoResize = value === 'true';
        return;
      case 'text-wrap':
        this.ensureTextNode().style.whiteSpace = value === 'true' ? 'normal' : 'nowrap';
        return;
      case 'font':
        this.setFont(value);
        return;
      case 'color':
        el.style.color = normalizeColor(value);
        return;

      case 'background-color':
      case 'background':
        el.style.backgroundColor = normalizeColor(value);
        return;

      case 'opacity':
        el.style.opacity = String(parseFloat(value));
        return;

      case 'border': {
        const parts = String(value).trim().split(/\s+/);
        const width = parseInt(parts[0], 10) || 0;
        const color = normalizeColor(parts[1] || '#000000');
        // border e pintura, nao layout -> inset shadow (spec 0.4).
        el.style.boxShadow = `inset 0 0 0 ${width}px ${color}`;
        return;
      }
      case 'border-width':
        this.borderWidth = parseInt(value, 10) || 0;
        this.refreshBorder();
        return;
      case 'border-color':
        this.borderColor = normalizeColor(value);
        this.refreshBorder();
        return;

      case 'visible':
        this.setVisible(value === 'true');
        return;
      case 'enabled':
        this.setEnabled(value === 'true');
        return;
      case 'phantom':
        this.phantom = value === 'true';
        el.style.pointerEvents = this.phantom ? 'none' : '';
        return;
      case 'focusable':
        this.focusable = value === 'true';
        return;
      case 'checked':
        this.setState('checked', value === 'true');
        return;
      case 'on':
        this.setState('on', value === 'true');
        return;

      case 'clipping':
        el.style.overflow = value === 'true' ? 'hidden' : '';
        return;

      case 'layout':
        this.layoutType = String(value).trim();
        return;

      case 'tooltip':
        this.tooltip = String(value);
        el.dataset.tooltip = this.tooltip;
        return;

      case 'cursor':
        el.style.cursor = String(value) === 'pointer' ? 'pointer' : '';
        return;

      case 'image-source':
      case 'image-clip':
      case 'image-border':
      case 'image-border-top':
      case 'image-border-right':
      case 'image-border-bottom':
      case 'image-border-left':
      case 'image-repeated':
      case 'image-color':
        this.imageProps = this.imageProps || {};
        this.imageProps[name] = value;
        this.scheduleImageUpdate();
        return;

      case 'icon':
      case 'icon-source':
        this.setIcon(value);
        return;
      case 'icon-clip':
        this.iconClip = parseInts(value, 4);
        this.refreshIcon();
        return;
      case 'icon-offset': {
        const [ox, oy] = parseInts(value, 2);
        this.iconOffset = { x: ox || 0, y: oy || 0 };
        this.refreshIcon();
        return;
      }

      default:
        // Propriedades de subclasse (max-length, placeholder, percent, ...) ficam disponiveis
        // para quem sabe o que fazer com elas.
        this.luaFields.set(name, value);
        return;
    }
  }

  setWidth(value) {
    if (isPercent(value)) {
      this.percentSize.w = parseFloat(value);
    } else {
      this.percentSize.w = null;
      this.rect.w = parseInt(value, 10) || 0;
    }
  }

  setHeight(value) {
    if (isPercent(value)) {
      this.percentSize.h = parseFloat(value);
    } else {
      this.percentSize.h = null;
      this.rect.h = parseInt(value, 10) || 0;
    }
  }

  refreshBorder() {
    if (this.borderWidth) {
      this.element.style.boxShadow = `inset 0 0 0 ${this.borderWidth}px ${this.borderColor || '#000'}`;
    }
  }

  // ---------------------------------------------------------------- texto e icone

  ensureTextNode() {
    if (!this.textNode) {
      const node = document.createElement('span');
      node.className = 'otui-text';
      // O texto do client e desenhado sobre o rect inteiro e NAO respeita image-border; deixar
      // fora do fluxo evita que a border-image empurre ele.
      node.style.position = 'absolute';
      node.style.inset = '0';
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      node.style.justifyContent = 'center';
      node.style.pointerEvents = 'none';
      node.style.whiteSpace = 'nowrap';
      this.textNode = node;
      this.element.appendChild(node);
    }
    return this.textNode;
  }

  setText(text) {
    const node = this.ensureTextNode();
    node.textContent = text === null || text === undefined ? '' : String(text);
  }

  getText() {
    return this.textNode ? this.textNode.textContent : '';
  }

  setTextAlign(align) {
    const node = this.ensureTextNode();
    const value = String(align).trim().toLowerCase();
    const map = {
      left: ['center', 'flex-start'],
      right: ['center', 'flex-end'],
      top: ['flex-start', 'center'],
      bottom: ['flex-end', 'center'],
      center: ['center', 'center'],
      topleft: ['flex-start', 'flex-start'],
      topright: ['flex-start', 'flex-end'],
      bottomleft: ['flex-end', 'flex-start'],
      bottomright: ['flex-end', 'flex-end'],
    };
    const [alignItems, justify] = map[value] || map.center;
    node.style.alignItems = alignItems;
    node.style.justifyContent = justify;
  }

  setFont(fontName) {
    // As fontes do client sao bitmap fonts; no DOM o equivalente pratico e a familia + tamanho.
    // verdana-11px-antialised e o default (spec 7.1).
    const name = String(fontName).trim();
    this.element.dataset.font = name;
    const size = /(\d+)px/.exec(name);
    const node = this.ensureTextNode();
    node.style.fontFamily = name.toLowerCase().includes('verdana') ? 'Verdana, Geneva, sans-serif' : 'inherit';
    node.style.fontSize = size ? `${size[1]}px` : '11px';
    if (name.toLowerCase().includes('bold')) node.style.fontWeight = '700';
  }

  setIcon(src) {
    this.iconSrc = src;
    this.refreshIcon();
  }

  refreshIcon() {
    if (!this.iconSrc) return;
    if (!this.iconNode) {
      const node = document.createElement('div');
      node.className = 'otui-icon';
      node.style.position = 'absolute';
      node.style.pointerEvents = 'none';
      this.iconNode = node;
      // O icone e desenhado por cima da imagem e por baixo do texto (spec 0.5).
      if (this.textNode) this.element.insertBefore(node, this.textNode);
      else this.element.appendChild(node);
    }
    const node = this.iconNode;
    node.style.backgroundImage = `url('${resolveImagePath(this.iconSrc)}')`;
    node.style.backgroundRepeat = 'no-repeat';
    if (this.iconClip && this.iconClip.length === 4) {
      const [x, y, w, h] = this.iconClip;
      node.style.backgroundPosition = `-${x}px -${y}px`;
      node.style.width = `${w}px`;
      node.style.height = `${h}px`;
    } else {
      node.style.inset = '0';
      node.style.backgroundPosition = 'center';
    }
    const offset = this.iconOffset || { x: 0, y: 0 };
    node.style.left = '50%';
    node.style.top = '50%';
    node.style.transform = `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`;
  }

  // ---------------------------------------------------------------- imagem

  scheduleImageUpdate() {
    if (this._imageUpdateQueued) return;
    this._imageUpdateQueued = true;
    Promise.resolve().then(() => {
      this._imageUpdateQueued = false;
      this.refreshImage();
    });
  }

  async refreshImage() {
    const props = this.imageProps;
    if (!props || !props['image-source']) return;

    const el = this.element;
    const src = resolveImagePath(props['image-source']);
    const clip = props['image-clip'] ? parseInts(props['image-clip'], 4) : null;

    const border = {
      top: intOr(props['image-border-top'], props['image-border']),
      right: intOr(props['image-border-right'], props['image-border']),
      bottom: intOr(props['image-border-bottom'], props['image-border']),
      left: intOr(props['image-border-left'], props['image-border']),
    };
    const has9Slice = border.top || border.right || border.bottom || border.left;

    if (!has9Slice) {
      // Caso simples: recorte vira background-position negativo, sem canvas.
      el.style.borderImageSource = '';
      el.style.borderStyle = '';
      el.style.backgroundImage = `url('${src}')`;
      el.style.backgroundRepeat = props['image-repeated'] === 'true' ? 'repeat' : 'no-repeat';
      if (clip) {
        el.style.backgroundPosition = `-${clip[0]}px -${clip[1]}px`;
      } else {
        el.style.backgroundPosition = '0 0';
      }
      return;
    }

    // 9-slice com recorte: precisa materializar o recorte porque border-image-source nao recorta.
    let source = src;
    if (clip) {
      try {
        source = await clipToDataURL(src, clip[0], clip[1], clip[2], clip[3]);
      } catch (err) {
        console.warn(`[otui] falha ao recortar ${src}:`, err.message);
      }
    }

    el.style.backgroundImage = '';
    el.style.borderStyle = 'solid';
    el.style.borderColor = 'transparent';
    el.style.borderWidth = `${border.top}px ${border.right}px ${border.bottom}px ${border.left}px`;
    el.style.borderImageSource = `url('${source}')`;
    // 'fill' e obrigatorio: sem ele o CSS descarta o centro e o client sempre desenha o centro.
    el.style.borderImageSlice = `${border.top} ${border.right} ${border.bottom} ${border.left} fill`;
    el.style.borderImageWidth = `${border.top}px ${border.right}px ${border.bottom}px ${border.left}px`;
    // O client ladrilha as nove regioes (addRepeatedRects); 'stretch' deformaria gradientes.
    el.style.borderImageRepeat = 'repeat';
  }

  // ---------------------------------------------------------------- estados

  setState(state, on) {
    const had = this.states.has(state);
    if (on === had) return;
    if (on) this.states.add(state);
    else this.states.delete(state);
    this.element.classList.toggle(state, on);
    this.refreshStateStyle();
  }

  hasState(state) {
    return this.states.has(state);
  }

  /**
   * Recalcula a aparencia: parte do estilo base e mescla, NA ORDEM DE DECLARACAO, todos os blocos
   * $ cujas condicoes batem (uiwidget.cpp:1534-1593).
   *
   * A pegadinha do C++ -- uma propriedade so "volta" ao sair do estado se tambem existir no estilo
   * base -- some aqui de proposito: reaplicar sempre a partir do base e mais previsivel e da no
   * mesmo resultado para os estilos de producao, que sempre declaram no base o que os $ mexem.
   */
  refreshStateStyle() {
    const props = new Map(this.baseProps);
    for (const block of this.stateBlocks) {
      if (this.matchesConditions(block.conditions)) {
        for (const [name, value] of block.props) props.set(name, value);
      }
    }
    this.applyProps(props);
  }

  matchesConditions(conditions) {
    // Todos os termos precisam bater (AND). Nao existe OR (uiwidget.cpp:1568-1580).
    return conditions.every((cond) =>
      cond.negated ? !this.states.has(cond.state) : this.states.has(cond.state)
    );
  }

  setVisible(visible) {
    this.visible = visible;
    this.element.style.display = visible ? '' : 'none';
    this.setState('hidden', !visible);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.setState('disabled', !enabled);
    // DisabledState propaga para os filhos (uiwidget.cpp:1444-1456).
    for (const child of this.children) child.setState('disabled', !enabled);
  }

  updateStateFlags() {
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    this.setState('first', index === 0);
    this.setState('last', index === this.parent.children.length - 1);
    this.setState('middle', index > 0 && index < this.parent.children.length - 1);
    this.setState('alternate', (index + 1) % 2 === 1);
  }

  updateChildrenPositionStates() {
    for (const child of this.children) child.updateStateFlags();
  }

  // ---------------------------------------------------------------- layout

  get contentRect() {
    return {
      x: this.padding.left,
      y: this.padding.top,
      w: Math.max(0, this.rect.w - this.padding.left - this.padding.right),
      h: Math.max(0, this.rect.h - this.padding.top - this.padding.bottom),
    };
  }

  updateLayout() {
    const content = this.contentRect;

    for (const child of this.children) {
      if (child.percentSize.w !== null) child.rect.w = Math.round((content.w * child.percentSize.w) / 100);
      if (child.percentSize.h !== null) child.rect.h = Math.round((content.h * child.percentSize.h) / 100);
    }

    if (this.layoutType === 'anchor') {
      resolveAnchors(this);
    } else {
      this.applyBoxLayout(content);
    }

    for (const child of this.children) {
      child.applyRectToDOM(content);
      child.updateLayout();
    }
  }

  applyBoxLayout(content) {
    const spacing = parseInt(this.luaFields.get('spacing'), 10) || 0;
    const vertical = this.layoutType === 'verticalBox';
    let cursor = 0;

    for (const child of this.children) {
      if (!child.visible) continue;
      if (vertical) {
        cursor += child.margins.top;
        child.rect.y = cursor;
        child.rect.x = child.margins.left;
        child.rect.w = Math.max(0, content.w - child.margins.left - child.margins.right);
        cursor += child.rect.h + child.margins.bottom + spacing;
      } else {
        cursor += child.margins.left;
        child.rect.x = cursor;
        child.rect.y = child.margins.top;
        child.rect.h = Math.max(0, content.h - child.margins.top - child.margins.bottom);
        cursor += child.rect.w + child.margins.right + spacing;
      }
    }
  }

  applyRectToDOM(parentContent) {
    const el = this.element;
    // O rect do filho e local a content box do pai; o offset do padding entra aqui porque os
    // filhos sao position:absolute e o bloco contentor do CSS ignora o padding do pai.
    el.style.left = `${this.rect.x + (parentContent ? parentContent.x : 0)}px`;
    el.style.top = `${this.rect.y + (parentContent ? parentContent.y : 0)}px`;
    el.style.width = `${this.rect.w}px`;
    el.style.height = `${this.rect.h}px`;
  }

  // ---------------------------------------------------------------- eventos

  on(event, handler) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, []);
    this.eventHandlers.get(event).push(handler);
    return this;
  }

  emit(event, ...args) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) handler(this, ...args);
  }
}

// -------------------------------------------------------------------- helpers

export function parseStateConditions(tag) {
  return tag
    .slice(1)
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => {
      const negated = term.startsWith('!');
      const state = (negated ? term.slice(1) : term).toLowerCase();
      return { negated, state };
    })
    .filter((cond) => STATE_NAMES.includes(cond.state));
}

export function nodeToProps(node, styleRegistry) {
  const props = new Map();
  for (const child of node.childNodes()) {
    if (!child.tag) continue;
    const name = child.tag.startsWith('!') || child.tag.startsWith('&') ? child.tag.slice(1) : child.tag;
    props.set(name, styleRegistry ? styleRegistry.resolveVars(child.value) : child.value);
  }
  return props;
}

export function normalizeColor(value) {
  const text = String(value).trim();
  // O client aceita #rrggbbaa; o CSS moderno tambem, entao passa direto.
  return text;
}

function intOr(primary, fallback) {
  const value = primary !== undefined ? primary : fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// '/images/ui/button' -> caminho servido pelo Vite, com extensao .png implicita (o client omite).
export function resolveImagePath(path) {
  let src = String(path).trim();
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  if (src.startsWith('/images/')) src = src.replace('/images/', '/client-images/');
  else if (!src.startsWith('/')) src = `/client-images/${src}`;
  if (!/\.(png|jpg|jpeg|gif|webp)$/i.test(src)) src += '.png';
  return src;
}
