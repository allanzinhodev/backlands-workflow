// Parser do formato OTML/.otui, portado de client/src/framework/otml/otmlparser.cpp.
//
// Regras que vieram direto da fonte e que NAO podem ser afrouxadas, porque os .otui reais
// dependem delas:
//   - indentacao e de exatamente 2 espacos por nivel (otmlparser.cpp:61,68-70); tab e erro fatal
//   - comentario e '//' no inicio da linha ja trimada -- nao existe comentario de fim de linha
//   - o no e cortado no PRIMEIRO ':' (otmlparser.cpp:117,125-128)
//   - linha sem ':' e um no so-tag: e assim que se declara um widget filho
//   - node.isUnique() == a linha tinha ':' -- nos unicos se substituem, nao-unicos acumulam
//     (otmlnode.cpp:82-110). E por isso que dois 'color:' o segundo vence, mas dois 'Label'
//     viram dois widgets.

export class OTMLNode {
  constructor(tag = '', value = null, unique = false) {
    this.tag = tag;
    this.rawValue = value;
    this.unique = unique;
    this.children = [];
    this.parent = null;
    this.null = false;
  }

  get value() {
    return this.rawValue;
  }

  addChild(node) {
    // Nos unicos com a mesma tag se fundem; nao-unicos acumulam (otmlnode.cpp:82-110).
    if (node.unique && node.tag) {
      const existing = this.children.find((c) => c.unique && c.tag === node.tag);
      if (existing) {
        existing.rawValue = node.rawValue;
        existing.null = node.null;
        for (const grandChild of node.children) existing.addChild(grandChild);
        return existing;
      }
    }
    node.parent = this;
    this.children.push(node);
    return node;
  }

  get(tag) {
    return this.children.find((c) => c.tag === tag && !c.null) || null;
  }

  has(tag) {
    return this.get(tag) !== null;
  }

  // children() do C++ omite os nos null: e assim que se "apaga" uma propriedade herdada com '~'.
  childNodes() {
    return this.children.filter((c) => !c.null);
  }

  clone() {
    const copy = new OTMLNode(this.tag, this.rawValue, this.unique);
    copy.null = this.null;
    for (const child of this.children) copy.addChild(child.clone());
    return copy;
  }

  // merge do C++: o outro no sobrescreve propriedades unicas e acrescenta as nao-unicas.
  merge(other) {
    for (const child of other.children) {
      this.addChild(child.clone());
    }
    if (other.rawValue !== null && other.rawValue !== undefined) {
      this.rawValue = other.rawValue;
    }
    return this;
  }
}

const MULTILINE_MARKERS = ['|', '|-', '|+'];

function unescapeQuoted(text) {
  return text
    .slice(1, -1)
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n');
}

function parseValue(raw) {
  if (raw === null) return null;
  const text = raw.trim();
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    return unescapeQuoted(text);
  }
  return text;
}

/**
 * Le um documento OTML e devolve o no raiz.
 * Variaveis globais (linhas '&var-x: valor' / '$var-x: valor' na raiz) sao extraidas para
 * `globals` em vez de virarem nos -- exatamente como otmlparser.cpp:203-206.
 */
export function parseOTML(source, { fileName = '<memoria>' } = {}) {
  const root = new OTMLNode('');
  const globals = new Map();
  const lines = source.split(/\r?\n/);

  // Pilha de nos por nivel de indentacao: stack[0] e a raiz.
  const stack = [root];
  let currentDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().length === 0) continue;

    if (line.includes('\t')) {
      throw new Error(`${fileName}:${i + 1}: tab nao e permitido em OTML, use 2 espacos`);
    }

    const indent = line.length - line.trimStart().length;
    if (indent % 2 !== 0) {
      throw new Error(`${fileName}:${i + 1}: indentacao impar (${indent}), deve ser multipla de 2`);
    }
    const depth = indent / 2;
    const trimmed = line.trim();

    // Comentario: so no inicio da linha ja trimada (otmlparser.cpp:87-92).
    if (trimmed.startsWith('//')) continue;

    if (depth > currentDepth + 1) {
      throw new Error(`${fileName}:${i + 1}: salto de indentacao de mais de um nivel`);
    }

    // Sobe/desce a pilha ate o nivel desta linha.
    while (stack.length > depth + 1) stack.pop();
    const parent = stack[stack.length - 1];

    let tag = '';
    let rawValue = null;
    let unique = false;

    if (trimmed.startsWith('- ') || trimmed === '-') {
      // Item de lista sem tag (otmlparser.cpp:121-123).
      rawValue = trimmed.slice(1).trim();
    } else {
      const sep = trimmed.indexOf(':');
      if (sep === -1) {
        tag = trimmed;
      } else {
        tag = trimmed.slice(0, sep).trim();
        rawValue = trimmed.slice(sep + 1).trim();
        unique = true;
      }
    }

    // Valor multi-linha: '|', '|-' ou '|+' consomem as linhas mais indentadas seguintes.
    if (rawValue !== null && MULTILINE_MARKERS.includes(rawValue)) {
      const collected = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const next = lines[j];
        if (next.trim().length === 0) {
          collected.push('');
          continue;
        }
        const nextIndent = next.length - next.trimStart().length;
        if (nextIndent <= indent) break;
        collected.push(next.slice(indent + 2));
      }
      rawValue = collected.join('\n');
      i = j - 1;
    }

    // Variavel global declarada na raiz: nao vira no.
    if (depth === 0 && unique && (tag.startsWith('&var-') || tag.startsWith('$var-'))) {
      globals.set(tag.slice(1), parseValue(rawValue));
      continue;
    }

    const node = new OTMLNode(tag, parseValue(rawValue), unique);

    if (node.rawValue === '~') {
      node.rawValue = null;
      node.null = true;
    }

    // Lista inline: [a, b, c] vira filhos sem tag (otmlparser.cpp:192-198).
    if (typeof node.rawValue === 'string' && node.rawValue.startsWith('[') && node.rawValue.endsWith(']')) {
      const items = node.rawValue
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      node.rawValue = null;
      for (const item of items) node.addChild(new OTMLNode('', item, false));
    }

    const added = parent.addChild(node);
    stack.push(added);
    currentDepth = depth;
  }

  return { root, globals };
}
