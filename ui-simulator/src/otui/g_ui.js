// g_ui: registro de estilos + criacao de widgets a partir de OTML.
// Porte de client/src/framework/ui/uimanager.cpp (importStyleFromOTML / createWidgetFromOTML).

import { parseOTML, OTMLNode } from './OTMLParser.js';
import { UIWidget } from './UIWidget.js';

class StyleRegistry {
  constructor() {
    this.styles = new Map();
    this.unique = new Set();
    this.globals = new Map();
    this.classes = new Map();
  }

  registerClass(name, ctor) {
    this.classes.set(name, ctor);
  }

  setGlobal(name, value) {
    this.globals.set(name, value);
  }

  /**
   * Troca '$var-x' pelo valor da variavel. Duas regras que vieram da fonte:
   *   - so substitui se a variavel existir e nao for vazia (uiwidget.cpp:648-655)
   *   - em propriedades compostas cada componente e resolvido separadamente
   */
  resolveVars(value) {
    if (typeof value !== 'string') return value;
    if (!value.includes('$var-')) return value;
    return value.replace(/\$var-[\w-]+/g, (match) => {
      const key = match.slice(1);
      const resolved = this.globals.get(key);
      return resolved === undefined || resolved === '' ? match : resolved;
    });
  }

  importDocument(source, fileName) {
    const { root, globals } = parseOTML(source, { fileName });
    for (const [name, value] of globals) this.globals.set(name, value);

    for (const node of root.childNodes()) {
      if (node.tag.includes('<')) {
        this.importStyle(node);
      }
    }
    return root;
  }

  importStyle(node) {
    const parts = node.tag.split('<').map((s) => s.trim());
    if (parts.length !== 2) {
      throw new Error(`declaracao de estilo invalida: "${node.tag}"`);
    }
    let [name, base] = parts;

    // '#Nome' marca o estilo como unico: redefinicoes posteriores nao sobrescrevem.
    let isUnique = false;
    if (name.startsWith('#')) {
      name = name.slice(1);
      isUnique = true;
    }
    if (this.unique.has(name)) return;
    if (isUnique) this.unique.add(name);

    const baseStyle = this.getStyle(base);
    const style = baseStyle ? baseStyle.clone() : new OTMLNode(name);
    style.tag = name;
    style.merge(node);
    style.luaClass = (baseStyle && baseStyle.luaClass) || (base.startsWith('UI') ? base : 'UIWidget');
    this.styles.set(name, style);
  }

  /**
   * Estilos cujo nome comeca com 'UI' sao auto-definidos se nao existirem (uimanager.cpp:505-511).
   * E por isso que UIWidget/UIButton/UIItem existem sem nenhum .otui declarar.
   */
  getStyle(name) {
    if (this.styles.has(name)) return this.styles.get(name);
    if (name.startsWith('UI')) {
      const node = new OTMLNode(name);
      node.luaClass = name;
      this.styles.set(name, node);
      return node;
    }
    return null;
  }

  createWidget(styleName, parent) {
    const style = this.getStyle(styleName);
    if (!style) throw new Error(`estilo desconhecido: ${styleName}`);

    const Ctor = this.classes.get(style.luaClass) || this.classes.get(styleName) || UIWidget;
    const widget = new Ctor(styleName);
    widget.styleRegistry = this;

    // O pai e atribuido ANTES de aplicar o estilo; sem isso 'anchors.*' nao teria contra quem
    // resolver (uimanager.cpp:598-631).
    if (parent) parent.addChild(widget);

    this.applyStyleNode(widget, style);
    return widget;
  }

  applyStyleNode(widget, styleNode) {
    const propsNode = new OTMLNode(styleNode.tag);
    const childWidgets = [];

    for (const child of styleNode.childNodes()) {
      if (child.tag.startsWith('anchors.')) {
        this.addAnchor(widget, child);
        continue;
      }
      // Linha sem ':' e um widget filho; com ':' e propriedade.
      if (!child.unique && child.tag && !child.tag.startsWith('$')) {
        childWidgets.push(child);
        continue;
      }
      propsNode.addChild(child);
    }

    widget.setStyleFromNode(propsNode, this);

    for (const childNode of childWidgets) {
      const child = this.createWidget(childNode.tag, widget);
      this.applyStyleNode(child, childNode);
    }

    widget.updateLayout();
  }

  addAnchor(widget, node) {
    const edge = node.tag.slice('anchors.'.length);
    const value = String(node.value || '').trim();

    if (value === 'none') {
      widget.anchors = widget.anchors.filter((a) => a.edge !== edge);
      return;
    }

    // fill e centerIn viram varias ancoras, em ordem fixa (uianchorlayout.cpp:138-150).
    if (edge === 'fill') {
      for (const e of ['left', 'right', 'top', 'bottom']) {
        widget.anchors.push({ edge: e, targetId: value, targetEdge: e });
      }
      return;
    }
    if (edge === 'centerIn') {
      widget.anchors.push({ edge: 'horizontalCenter', targetId: value, targetEdge: 'horizontalCenter' });
      widget.anchors.push({ edge: 'verticalCenter', targetId: value, targetEdge: 'verticalCenter' });
      return;
    }

    const dot = value.lastIndexOf('.');
    if (dot === -1) {
      console.warn(`[otui] descricao de ancora invalida: "${node.tag}: ${value}"`);
      return;
    }
    widget.anchors.push({
      edge,
      targetId: value.slice(0, dot),
      targetEdge: value.slice(dot + 1),
    });
  }
}

export const g_ui = {
  registry: new StyleRegistry(),
  rootWidget: null,

  init(rootId) {
    const element = document.getElementById(rootId);
    if (!element) throw new Error(`elemento raiz #${rootId} nao encontrado`);

    const root = new UIWidget('UIWidget');
    root.element = element;
    root.id = 'root';
    element.classList.add('otui', 'UIRoot');
    root.rect = { x: 0, y: 0, w: element.clientWidth, h: element.clientHeight };
    this.rootWidget = root;

    window.addEventListener('resize', () => {
      root.rect.w = element.clientWidth;
      root.rect.h = element.clientHeight;
      root.updateLayout();
    });

    return root;
  },

  registerClass(name, ctor) {
    this.registry.registerClass(name, ctor);
  },

  importStyles(source, fileName) {
    return this.registry.importDocument(source, fileName);
  },

  setGlobal(name, value) {
    this.registry.setGlobal(name, value);
  },

  createWidget(styleName, parent) {
    return this.registry.createWidget(styleName, parent || this.rootWidget);
  },

  /**
   * Carrega um documento .otui que contem UMA instancia raiz de widget (o formato dos modulos).
   */
  loadUI(source, parent, fileName = '<otui>') {
    const root = this.registry.importDocument(source, fileName);
    const instances = root.childNodes().filter((n) => n.tag && !n.tag.includes('<'));
    if (instances.length === 0) return null;
    if (instances.length > 1) {
      throw new Error(`${fileName}: nao pode haver mais de um widget raiz em um .otui`);
    }
    const node = instances[0];
    const widget = this.registry.createWidget(node.tag, parent || this.rootWidget);
    this.registry.applyStyleNode(widget, node);
    return widget;
  },
};
