/* DeepSeek Harness architecture explorer.
 *
 * The article contains usable links and evidence without JavaScript. This
 * module adds view switching, one-at-a-time evidence panels, and keyboard
 * navigation without owning any article content.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DeepSeekHarnessExplorer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const ALLOWED_VIEWS = new Set(['all', 'runtime', 'truth']);

  function normaliseView(value) {
    return ALLOWED_VIEWS.has(value) ? value : 'all';
  }

  function nodeSupportsView(node, view) {
    if (view === 'all') return true;
    const layers = String(node?.getAttribute?.('data-dsh-layer') || '')
      .split(/\s+/)
      .filter(Boolean);
    return layers.includes(view);
  }

  function setView(explorer, requestedView) {
    if (!explorer?.querySelectorAll) return 'all';
    const view = normaliseView(requestedView);
    explorer.dataset.dshActiveView = view;

    explorer.querySelectorAll('[data-dsh-view]').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.dshView === view ? 'true' : 'false');
    });

    explorer.querySelectorAll('[data-dsh-node]').forEach((node) => {
      if (nodeSupportsView(node, view)) {
        node.removeAttribute('data-dsh-muted');
      } else {
        node.setAttribute('data-dsh-muted', 'true');
      }
    });

    return view;
  }

  function setActiveNode(explorer, nodeId) {
    if (!explorer?.querySelectorAll) return null;
    const nodes = Array.from(explorer.querySelectorAll('[data-dsh-node]'));
    const active = nodes.find((node) => node.dataset.dshNode === nodeId) || nodes[0];
    if (!active) return null;

    nodes.forEach((node) => {
      const selected = node === active;
      node.setAttribute('aria-selected', selected ? 'true' : 'false');
      node.tabIndex = selected ? 0 : -1;
    });

    explorer.querySelectorAll('[data-dsh-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.dshPanel !== active.dataset.dshNode;
    });

    explorer.dataset.dshActiveNode = active.dataset.dshNode;
    return active.dataset.dshNode;
  }

  function moveNodeFocus(explorer, current, direction) {
    const nodes = Array.from(explorer.querySelectorAll('[data-dsh-node]'));
    const index = nodes.indexOf(current);
    if (index < 0 || nodes.length < 2) return;
    const nextIndex = (index + direction + nodes.length) % nodes.length;
    const next = nodes[nextIndex];
    setActiveNode(explorer, next.dataset.dshNode);
    next.focus();
  }

  function bindNodeKeyboard(explorer, node) {
    node.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveNodeFocus(explorer, node, 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveNodeFocus(explorer, node, -1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        const first = explorer.querySelector('[data-dsh-node]');
        if (first) {
          setActiveNode(explorer, first.dataset.dshNode);
          first.focus();
        }
      } else if (event.key === 'End') {
        event.preventDefault();
        const nodes = explorer.querySelectorAll('[data-dsh-node]');
        const last = nodes[nodes.length - 1];
        if (last) {
          setActiveNode(explorer, last.dataset.dshNode);
          last.focus();
        }
      }
    });
  }

  function initExplorer(explorer) {
    if (!explorer?.querySelectorAll || explorer.dataset.dshBound === 'true') return;
    explorer.dataset.dshBound = 'true';
    explorer.classList.add('is-enhanced');

    explorer.querySelectorAll('[data-dsh-view]').forEach((button) => {
      button.addEventListener('click', () => setView(explorer, button.dataset.dshView));
    });

    explorer.querySelectorAll('[data-dsh-node]').forEach((node) => {
      node.addEventListener('click', () => setActiveNode(explorer, node.dataset.dshNode));
      bindNodeKeyboard(explorer, node);
    });

    setView(explorer, explorer.dataset.dshActiveView || 'all');
    setActiveNode(explorer, explorer.dataset.dshActiveNode);
  }

  function initAll(document = globalThis.document) {
    if (!document?.querySelectorAll) return;
    document.querySelectorAll('[data-dsh-explorer]').forEach(initExplorer);
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => initAll(document));
  }

  return {
    normaliseView,
    nodeSupportsView,
    setView,
    setActiveNode,
    initExplorer,
    initAll,
  };
});
