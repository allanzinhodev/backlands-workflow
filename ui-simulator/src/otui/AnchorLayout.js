// Resolvedor de ancoras, portado de client/src/framework/ui/uianchorlayout.cpp.
//
// Decisao de projeto (opcao A da spec): o layout e resolvido em JS e o CSS so recebe o resultado
// em px. Flexbox NAO expressa ancora contra irmao arbitrario ('anchors.top: separator.bottom'),
// entao nao da para trocar o resolvedor por CSS puro sem perder fidelidade.
//
// Todos os rects aqui sao EXCLUSIVOS ({x, y, w, h} estilo CSS). O C++ usa Rect inclusivo
// (right == x + w - 1); nas contas de borda o -1 se cancela dos dois lados, mas nos centros
// nao cancela -- por isso horizontalCenter usa ((w - 1) >> 1), igual ao rect.h:56.

export const ANCHOR_EDGES = [
  'left',
  'right',
  'top',
  'bottom',
  'horizontalCenter',
  'verticalCenter',
];

const EDGE_ALIASES = new Map([
  ['horizontalcenter', 'horizontalCenter'],
  ['verticalcenter', 'verticalCenter'],
]);

export function normalizeEdge(edge) {
  const key = String(edge).trim().toLowerCase().replace(/\s+/g, '');
  if (EDGE_ALIASES.has(key)) return EDGE_ALIASES.get(key);
  const found = ANCHOR_EDGES.find((e) => e.toLowerCase() === key);
  return found || null;
}

export function edgePoint(box, edge) {
  switch (edge) {
    case 'left':
      return box.x;
    case 'right':
      return box.x + box.w;
    case 'top':
      return box.y;
    case 'bottom':
      return box.y + box.h;
    case 'horizontalCenter':
      return box.x + ((box.w - 1) >> 1);
    case 'verticalCenter':
      return box.y + ((box.h - 1) >> 1);
    default:
      return 0;
  }
}

// A primeira ancora de cada eixo MOVE o rect (preserva o tamanho); as seguintes REDIMENSIONAM.
// uianchorlayout.cpp:181-250. E isso que faz 'anchors.left' + 'anchors.right' derivar a largura
// e descartar o 'width:' declarado.
function applyEdge(rect, edge, point, margins, moved) {
  const { top = 0, right = 0, bottom = 0, left = 0 } = margins;

  switch (edge) {
    case 'left': {
      const target = point + left;
      if (!moved.h) {
        rect.x = target;
        moved.h = true;
      } else {
        rect.w = rect.x + rect.w - target;
        rect.x = target;
      }
      break;
    }
    case 'right': {
      const target = point - right;
      if (!moved.h) {
        rect.x = target - rect.w;
        moved.h = true;
      } else {
        rect.w = target - rect.x;
      }
      break;
    }
    case 'top': {
      const target = point + top;
      if (!moved.v) {
        rect.y = target;
        moved.v = true;
      } else {
        rect.h = rect.y + rect.h - target;
        rect.y = target;
      }
      break;
    }
    case 'bottom': {
      const target = point - bottom;
      if (!moved.v) {
        rect.y = target - rect.h;
        moved.v = true;
      } else {
        rect.h = target - rect.y;
      }
      break;
    }
    case 'horizontalCenter': {
      rect.x = point + left - right - ((rect.w - 1) >> 1);
      moved.h = true;
      break;
    }
    case 'verticalCenter': {
      rect.y = point + top - bottom - ((rect.h - 1) >> 1);
      moved.v = true;
      break;
    }
    default:
      break;
  }
}

/**
 * Resolve o rect de todos os filhos ancorados de `parent`.
 *
 * `parent` precisa expor:
 *   - children: array de widgets na ordem de insercao
 *   - contentRect: { x, y, w, h } ja descontado o padding (coordenadas LOCAIS ao pai)
 * Cada filho precisa expor:
 *   - rect: { x, y, w, h }
 *   - anchors: array de { edge, targetId, targetEdge } NA ORDEM DE DECLARACAO
 *   - margins: { top, right, bottom, left }
 *   - id
 */
export function resolveAnchors(parent) {
  const updated = new Set();
  const resolving = new Set();

  const childById = new Map();
  for (const child of parent.children) {
    if (child.id) childById.set(child.id, child);
  }

  const resolveTarget = (child, targetId) => {
    if (targetId === 'parent') return parent;
    if (targetId === 'prev') {
      const index = parent.children.indexOf(child);
      return index > 0 ? parent.children[index - 1] : null;
    }
    if (targetId === 'next') {
      const index = parent.children.indexOf(child);
      return index >= 0 && index < parent.children.length - 1 ? parent.children[index + 1] : null;
    }
    // Só filhos diretos do mesmo pai, nao recursivo (uiwidget.cpp:1254-1261).
    return childById.get(targetId) || null;
  };

  const resolveChild = (child) => {
    if (updated.has(child)) return;
    if (resolving.has(child)) {
      // Ciclo: o C++ loga erro e desiste da ancora (uianchorlayout.cpp:168-171).
      console.warn(`[anchors] ciclo de ancoras envolvendo "${child.id || '(sem id)'}"`);
      return;
    }
    resolving.add(child);

    const anchors = child.anchors || [];
    if (anchors.length > 0) {
      const rect = { ...child.rect };
      const moved = { h: false, v: false };

      for (const anchor of anchors) {
        const edge = normalizeEdge(anchor.edge);
        const targetEdge = normalizeEdge(anchor.targetEdge);
        if (!edge || !targetEdge) continue;

        const target = resolveTarget(child, anchor.targetId);
        // Alvo inexistente: ancora silenciosamente ignorada (uianchorlayout.cpp:194-196).
        if (!target) continue;

        let box;
        if (target === parent) {
          // Ancora contra o pai usa a paddingRect do pai, em coordenadas locais.
          box = { x: 0, y: 0, w: parent.contentRect.w, h: parent.contentRect.h };
        } else {
          resolveChild(target); // ordenacao topologica sob demanda
          box = target.rect;
        }

        applyEdge(rect, edge, edgePoint(box, targetEdge), child.margins || {}, moved);
      }

      if (rect.w < 0) rect.w = 0;
      if (rect.h < 0) rect.h = 0;
      child.rect = rect;
    }

    resolving.delete(child);
    updated.add(child);
  };

  for (const child of parent.children) resolveChild(child);
}
