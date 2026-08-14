import { describe, it, expect } from 'vitest';
import { resolveAnchors, edgePoint } from '../src/otui/AnchorLayout.js';

// Stub minimo com a mesma superficie que o resolvedor consome. Testar o resolvedor puro (sem DOM)
// e o que permite verificar a semantica move/set do C++ com numeros exatos.
function makeChild(id, rect, anchors = [], margins = {}) {
  return {
    id,
    rect: { ...rect },
    anchors,
    margins: { top: 0, right: 0, bottom: 0, left: 0, ...margins },
  };
}

function makeParent(children, contentRect = { x: 0, y: 0, w: 200, h: 100 }) {
  return { children, contentRect };
}

describe('edgePoint', () => {
  it('usa coordenadas exclusivas nas bordas', () => {
    const box = { x: 10, y: 20, w: 43, h: 20 };
    expect(edgePoint(box, 'left')).toBe(10);
    expect(edgePoint(box, 'right')).toBe(53);
    expect(edgePoint(box, 'top')).toBe(20);
    expect(edgePoint(box, 'bottom')).toBe(40);
  });

  it('centro usa (tamanho - 1) >> 1, como o Rect inclusivo do C++', () => {
    // rect.h:56 -> x1 + (x2 - x1)/2, com x2 = x + w - 1
    expect(edgePoint({ x: 0, y: 0, w: 43, h: 20 }, 'horizontalCenter')).toBe(21);
    expect(edgePoint({ x: 0, y: 0, w: 20, h: 20 }, 'verticalCenter')).toBe(9);
  });
});

describe('resolucao de ancoras', () => {
  it('uma ancora sozinha MOVE e preserva a largura declarada', () => {
    const child = makeChild('a', { x: 0, y: 0, w: 86, h: 20 }, [
      { edge: 'right', targetId: 'parent', targetEdge: 'right' },
    ]);
    resolveAnchors(makeParent([child]));
    expect(child.rect.w).toBe(86);
    expect(child.rect.x).toBe(200 - 86);
  });

  it('left + right derivam a largura e descartam o width declarado', () => {
    const child = makeChild('a', { x: 0, y: 0, w: 999, h: 20 }, [
      { edge: 'left', targetId: 'parent', targetEdge: 'left' },
      { edge: 'right', targetId: 'parent', targetEdge: 'right' },
    ]);
    resolveAnchors(makeParent([child]));
    expect(child.rect.x).toBe(0);
    expect(child.rect.w).toBe(200);
  });

  it('aplica as margens com o sinal certo por borda', () => {
    const child = makeChild(
      'a',
      { x: 0, y: 0, w: 50, h: 20 },
      [
        { edge: 'left', targetId: 'parent', targetEdge: 'left' },
        { edge: 'right', targetId: 'parent', targetEdge: 'right' },
      ],
      { left: 13, right: 17 }
    );
    resolveAnchors(makeParent([child]));
    expect(child.rect.x).toBe(13);
    expect(child.rect.w).toBe(200 - 17 - 13);
  });

  it('resolve "prev" contra o irmao anterior', () => {
    const first = makeChild('primeiro', { x: 0, y: 0, w: 40, h: 20 }, [
      { edge: 'top', targetId: 'parent', targetEdge: 'top' },
    ]);
    const second = makeChild('segundo', { x: 0, y: 0, w: 40, h: 20 }, [
      { edge: 'top', targetId: 'prev', targetEdge: 'bottom' },
    ], { top: 14 });
    resolveAnchors(makeParent([first, second]));
    expect(second.rect.y).toBe(20 + 14);
  });

  it('resolve por id em qualquer ordem (ordenacao topologica)', () => {
    // 'segundo' e declarado ANTES de 'alvo' mas ancora nele: o resolvedor precisa resolver o alvo
    // primeiro, recursivamente.
    const second = makeChild('segundo', { x: 0, y: 0, w: 40, h: 20 }, [
      { edge: 'top', targetId: 'alvo', targetEdge: 'bottom' },
    ]);
    const target = makeChild('alvo', { x: 0, y: 0, w: 40, h: 30 }, [
      { edge: 'top', targetId: 'parent', targetEdge: 'top' },
    ], { top: 5 });
    resolveAnchors(makeParent([second, target]));
    expect(target.rect.y).toBe(5);
    expect(second.rect.y).toBe(35);
  });

  it('ignora silenciosamente ancora para alvo inexistente', () => {
    const child = makeChild('a', { x: 7, y: 9, w: 40, h: 20 }, [
      { edge: 'top', targetId: 'naoExiste', targetEdge: 'bottom' },
    ]);
    resolveAnchors(makeParent([child]));
    expect(child.rect).toEqual({ x: 7, y: 9, w: 40, h: 20 });
  });

  it('fill contra o pai equivale a inset com as margens', () => {
    const child = makeChild(
      'a',
      { x: 0, y: 0, w: 0, h: 0 },
      [
        { edge: 'left', targetId: 'parent', targetEdge: 'left' },
        { edge: 'right', targetId: 'parent', targetEdge: 'right' },
        { edge: 'top', targetId: 'parent', targetEdge: 'top' },
        { edge: 'bottom', targetId: 'parent', targetEdge: 'bottom' },
      ],
      { top: 15, right: 13, bottom: 17, left: 13 }
    );
    resolveAnchors(makeParent([child]));
    expect(child.rect).toEqual({ x: 13, y: 15, w: 200 - 26, h: 100 - 32 });
  });

  it('centerIn centraliza preservando o tamanho', () => {
    const child = makeChild('a', { x: 0, y: 0, w: 80, h: 40 }, [
      { edge: 'horizontalCenter', targetId: 'parent', targetEdge: 'horizontalCenter' },
      { edge: 'verticalCenter', targetId: 'parent', targetEdge: 'verticalCenter' },
    ]);
    resolveAnchors(makeParent([child]));
    // centro do pai = (200-1)>>1 = 99 ; deslocamento = (80-1)>>1 = 39
    expect(child.rect.x).toBe(99 - 39);
    expect(child.rect.w).toBe(80);
  });

  it('nao entra em loop infinito com ciclo de ancoras', () => {
    const a = makeChild('a', { x: 0, y: 0, w: 10, h: 10 }, [
      { edge: 'top', targetId: 'b', targetEdge: 'bottom' },
    ]);
    const b = makeChild('b', { x: 0, y: 0, w: 10, h: 10 }, [
      { edge: 'top', targetId: 'a', targetEdge: 'bottom' },
    ]);
    expect(() => resolveAnchors(makeParent([a, b]))).not.toThrow();
  });
});
