/**
 * Minimal hand-written XML reader/writer for items.xml files.
 * Only understands the subset actually used here: a root element, and
 * descendant elements with quoted attributes (single or double) and
 * self-closing or paired tags, arbitrarily nested. No namespaces, no
 * CDATA, no processing instructions besides the leading <?xml ... ?>.
 *
 * Design goal: round-trip untouched nodes byte-for-byte. Every element
 * node keeps a reference to its raw source slice; callers that don't
 * modify a node can serialize it by re-emitting that raw slice verbatim.
 */
'use strict';

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

// One parsed element: tag name, attributes (ordered), children (elements
// only; we don't need mixed text content for this format), and the exact
// raw source text this element occupies (for verbatim passthrough).
class XmlNode {
  constructor(tag, attrs, raw, start, end) {
    this.tag = tag;
    this.attrs = attrs; // Map<string,string> insertion-ordered
    this.children = [];
    this.raw = raw; // full source slice for this element (open..close tag)
    this.start = start;
    this.end = end;
  }
  attr(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : undefined;
  }
}

function parseXmlFile(text) {
  // Capture the leading <?xml ... ?> line and any whitespace up to the root tag.
  const piMatch = /^(<\?xml[^>]*\?>)(\r?\n)/.exec(text);
  if (!piMatch) throw new Error('Missing <?xml ...?> declaration at file start');
  const header = piMatch[1];
  const headerNewline = piMatch[2];
  let pos = piMatch[0].length;

  const { node: root, end } = parseElement(text, pos);
  const trailing = text.slice(end); // whatever follows </items> (expect just a newline)

  return { header, headerNewline, root, trailing };
}

// Parses one element starting at text[pos] === '<' (not a comment/PI).
// Returns { node, end } where end is the index right after this element's
// closing tag (or after the self-closing '/>').
function parseElement(text, pos) {
  if (text[pos] !== '<') throw new Error(`Expected '<' at ${pos}, got ${JSON.stringify(text.slice(pos, pos + 20))}`);
  const start = pos;

  // Skip XML comments that appear where an element is expected.
  if (text.startsWith('<!--', pos)) {
    const close = text.indexOf('-->', pos);
    if (close === -1) throw new Error('Unterminated comment at ' + pos);
    const end = close + 3;
    const node = new XmlNode('#comment', new Map(), text.slice(start, end), start, end);
    return { node, end };
  }

  let i = pos + 1;
  const tagStart = i;
  while (i < text.length && !/[\s/>]/.test(text[i])) i++;
  const tag = text.slice(tagStart, i);

  const attrs = new Map();
  while (true) {
    while (/\s/.test(text[i])) i++;
    if (text[i] === '/' || text[i] === '>') break;
    const nameStart = i;
    while (text[i] !== '=' && !/\s/.test(text[i])) i++;
    const name = text.slice(nameStart, i);
    while (/\s/.test(text[i])) i++;
    if (text[i] !== '=') throw new Error(`Expected '=' after attribute name '${name}' at ${i}`);
    i++;
    while (/\s/.test(text[i])) i++;
    const quote = text[i];
    if (quote !== '"' && quote !== "'") throw new Error(`Expected quote at ${i}`);
    i++;
    const valStart = i;
    while (text[i] !== quote) i++;
    const value = text.slice(valStart, i);
    i++; // consume closing quote
    attrs.set(name, { value, quote });
  }

  if (text[i] === '/') {
    // self-closing
    if (text[i + 1] !== '>') throw new Error(`Expected '>' after '/' at ${i}`);
    const end = i + 2;
    const node = new XmlNode(tag, attrs, text.slice(start, end), start, end);
    return { node, end };
  }

  // text[i] === '>', open tag; parse children until matching close tag.
  i++;
  const node = new XmlNode(tag, attrs, null, start, null);
  while (true) {
    while (/\s/.test(text[i])) i++;
    if (text.startsWith('</', i)) {
      const closeTagStart = i + 2;
      let j = closeTagStart;
      while (text[j] !== '>') j++;
      const closeTagName = text.slice(closeTagStart, j).trim();
      if (closeTagName !== tag) {
        throw new Error(`Mismatched close tag: expected </${tag}> got </${closeTagName}> at ${i}`);
      }
      const end = j + 1;
      node.end = end;
      node.raw = text.slice(start, end);
      return { node, end };
    }
    if (text[i] !== '<') throw new Error(`Expected child element or close tag at ${i}, got ${JSON.stringify(text.slice(i, i + 20))}`);
    const child = parseElement(text, i);
    if (child.node.tag !== '#comment') node.children.push(child.node);
    i = child.end;
  }
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function escapeAttr(value, quote) {
  // Values in this dataset never contain the quote character they're
  // wrapped in (verified against source); keep serialization minimal and
  // faithful rather than over-escaping and diverging from the original style.
  return value;
}

function serializeAttrs(attrs) {
  let out = '';
  for (const [name, { value, quote }] of attrs) {
    out += ` ${name}=${quote}${escapeAttr(value, quote)}${quote}`;
  }
  return out;
}

// Serializes a freshly-built node (no .raw) using the destination file's
// style: double quotes, tab indentation, space before self-closing '/>'.
function serializeNode(node, indent) {
  const pad = '\t'.repeat(indent);

  // Raw text never includes its own leading indentation (the parser skips
  // whitespace before capturing an element's start) -- only its own
  // internal newlines/indentation for nested children, which are already
  // correct as captured. Re-add just the leading pad for this node's line.
  if (node.raw !== null && node.raw !== undefined) return pad + node.raw;

  const attrsText = serializeAttrs(node.attrs);
  if (node.children.length === 0) {
    return `${pad}<${node.tag}${attrsText} />`;
  }
  const childrenText = node.children
    .map((c) => serializeNode(c, indent + 1))
    .join('\r\n');
  return `${pad}<${node.tag}${attrsText}>\r\n${childrenText}\r\n${pad}</${node.tag}>`;
}

module.exports = { XmlNode, parseXmlFile, parseElement, serializeNode, serializeAttrs };
