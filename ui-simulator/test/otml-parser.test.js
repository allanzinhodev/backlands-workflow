import { describe, it, expect } from 'vitest';
import { parseOTML } from '../src/otui/OTMLParser.js';

describe('parser OTML', () => {
  it('corta o no no primeiro ":" e trima os dois lados', () => {
    const { root } = parseOTML('text: Mode: "Chat On"');
    const node = root.childNodes()[0];
    expect(node.tag).toBe('text');
    expect(node.value).toBe('Mode: "Chat On"');
    expect(node.unique).toBe(true);
  });

  it('linha sem ":" vira no so-tag (e assim que se declara um widget filho)', () => {
    const { root } = parseOTML(['Panel', '  Label', '    text: oi'].join('\n'));
    const panel = root.childNodes()[0];
    expect(panel.tag).toBe('Panel');
    expect(panel.unique).toBe(false);

    const label = panel.childNodes()[0];
    expect(label.tag).toBe('Label');
    expect(label.childNodes()[0].value).toBe('oi');
  });

  it('nos unicos com a mesma tag se substituem: o ultimo color vence', () => {
    const { root } = parseOTML(['Panel', '  color: red', '  color: blue'].join('\n'));
    const panel = root.childNodes()[0];
    const colors = panel.childNodes().filter((c) => c.tag === 'color');
    expect(colors).toHaveLength(1);
    expect(colors[0].value).toBe('blue');
  });

  it('nos nao-unicos acumulam: dois Label viram dois widgets', () => {
    const { root } = parseOTML(['Panel', '  Label', '  Label'].join('\n'));
    const panel = root.childNodes()[0];
    expect(panel.childNodes().filter((c) => c.tag === 'Label')).toHaveLength(2);
  });

  it('so aceita comentario no inicio da linha, nao no fim', () => {
    const { root } = parseOTML(['// comentario', 'color: red // isto faz parte do valor'].join('\n'));
    const nodes = root.childNodes();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].value).toBe('red // isto faz parte do valor');
  });

  it('recusa tab e indentacao impar', () => {
    expect(() => parseOTML('Panel\n\tLabel')).toThrow(/tab/i);
    expect(() => parseOTML('Panel\n   Label')).toThrow(/impar/i);
  });

  it('"~" marca o no como null e ele some de childNodes (apaga heranca)', () => {
    const { root } = parseOTML(['Panel', '  image-source: ~'].join('\n'));
    const panel = root.childNodes()[0];
    expect(panel.childNodes()).toHaveLength(0);
    expect(panel.children).toHaveLength(1);
    expect(panel.children[0].null).toBe(true);
  });

  it('extrai variaveis globais da raiz em vez de criar nos', () => {
    const { root, globals } = parseOTML('&var-text-color: #dfdfdf');
    expect(root.childNodes()).toHaveLength(0);
    expect(globals.get('var-text-color')).toBe('#dfdfdf');
  });

  it('le blocos de estado como filhos com tag $', () => {
    const source = ['Button < UIButton', '  image-clip: 0 0 43 20', '  $pressed:', '    text-offset: 1 1'].join('\n');
    const { root } = parseOTML(source);
    const style = root.childNodes()[0];
    expect(style.tag).toBe('Button < UIButton');
    const pressed = style.childNodes().find((c) => c.tag === '$pressed');
    expect(pressed.childNodes()[0].value).toBe('1 1');
  });

  it('le uma lista inline [a, b, c] como filhos sem tag', () => {
    const { root } = parseOTML('opcoes: [um, dois, tres]');
    const node = root.childNodes()[0];
    expect(node.childNodes().map((c) => c.value)).toEqual(['um', 'dois', 'tres']);
  });
});
