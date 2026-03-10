/* Code block collapse / expand toggle.
 *
 * Supports:
 * - <pre><code>...</code></pre>
 * - Hexo highlight: <figure class="highlight ..."> with .line elements
 *
 * Exposes window.CodeCollapse in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CodeCollapse = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const DEFAULT_MIN_LINES = 17;

  function normalizeNewlines(text) {
    return String(text || '').replace(/\r\n?/g, '\n');
  }

  function extractFromPre(pre) {
    if (!pre) return '';
    const code = pre.querySelector?.('code');
    const text = code ? code.textContent : pre.textContent;
    return normalizeNewlines(text || '').trimEnd();
  }

  function extractFromHighlightFigure(figure) {
    if (!figure) return '';

    const codeLines = figure.querySelectorAll?.('.code .line');
    const selector = codeLines && codeLines.length ? '.code .line' : '.line';

    const lines = Array.from(figure.querySelectorAll?.(selector) || [])
      .map((line) => line.textContent || '');

    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

    return normalizeNewlines(lines.join('\n')).trimEnd();
  }

  function countLines(text) {
    const normalized = normalizeNewlines(text).trimEnd();
    if (!normalized) return 0;
    return normalized.split('\n').length;
  }

  function findCodeBlocks({ root = document } = {}) {
    const blocks = [];

    Array.from(root.querySelectorAll?.('.article-content pre') || []).forEach((pre) => {
      blocks.push({ type: 'pre', element: pre });
    });

    Array.from(root.querySelectorAll?.('.article-content figure.highlight') || []).forEach((figure) => {
      blocks.push({ type: 'highlight', element: figure });
    });

    return blocks;
  }

  function ensureToggleButton(container) {
    if (!container) return null;
    const existing = container.querySelector?.('.code-collapse-button');
    if (existing) return existing;

    const button = (container.ownerDocument || document).createElement('button');
    button.type = 'button';
    button.className = 'code-collapse-button';
    button.setAttribute('aria-label', '展开或收起代码');
    container.appendChild(button);
    return button;
  }

  function setExpandedState({ container, button, expanded } = {}) {
    if (!container || !button) return;
    if (expanded) {
      container.classList.remove('is-collapsed');
      button.textContent = '收起代码';
      button.setAttribute('aria-expanded', 'true');
    } else {
      container.classList.add('is-collapsed');
      button.textContent = '展开代码';
      button.setAttribute('aria-expanded', 'false');
    }
  }

  function buildStorageKey({ pathname = '', index = 0 } = {}) {
    const safePath = String(pathname || '/');
    const i = Number.isFinite(Number(index)) ? Number(index) : 0;
    return `xdlkc:code-collapse:${safePath}:${i}`;
  }

  function readSavedState({ storage, pathname, index } = {}) {
    try {
      const key = buildStorageKey({ pathname, index });
      const value = storage?.getItem?.(key);
      return value === 'expanded' || value === 'collapsed' ? value : null;
    } catch {
      return null;
    }
  }

  function saveState({ storage, pathname, index, state } = {}) {
    try {
      const key = buildStorageKey({ pathname, index });
      if (state === 'expanded' || state === 'collapsed') {
        storage?.setItem?.(key, state);
      }
    } catch {
      // ignore
    }
  }

  function bindToggle({ container, button, storage, pathname, index } = {}) {
    if (!container || !button) return;

    // Idempotent: avoid binding twice.
    if (container.getAttribute?.('data-code-collapse-bound') === '1') return;
    container.setAttribute?.('data-code-collapse-bound', '1');

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !expanded;
      setExpandedState({ container, button, expanded: nextExpanded });
      saveState({
        storage,
        pathname,
        index,
        state: nextExpanded ? 'expanded' : 'collapsed'
      });
    });
  }

  function initCodeCollapse({
    root = document,
    minLines = DEFAULT_MIN_LINES,
    storage = (typeof sessionStorage !== 'undefined' ? sessionStorage : null),
    location = (typeof window !== 'undefined' ? window.location : null),
  } = {}) {
    if (!root?.querySelectorAll) return;

    const pathname = String(location?.pathname || '/');

    const blocks = findCodeBlocks({ root });

    blocks.forEach((block, index) => {
      const container = block.element;
      if (!container) return;

      const text = block.type === 'highlight'
        ? extractFromHighlightFigure(container)
        : extractFromPre(container);

      const lines = countLines(text);
      if (lines < Number(minLines || DEFAULT_MIN_LINES)) return;

      const button = ensureToggleButton(container);
      if (!button) return;

      const saved = readSavedState({ storage, pathname, index });

      if (saved === 'expanded') {
        setExpandedState({ container, button, expanded: true });
      } else if (saved === 'collapsed') {
        setExpandedState({ container, button, expanded: false });
      } else {
        // default: collapsed
        if (button.getAttribute('aria-expanded') !== 'true') {
          setExpandedState({ container, button, expanded: false });
        }
      }

      bindToggle({ container, button, storage, pathname, index });
    });
  }

  return {
    DEFAULT_MIN_LINES,
    normalizeNewlines,
    extractFromPre,
    extractFromHighlightFigure,
    countLines,
    findCodeBlocks,
    buildStorageKey,
    initCodeCollapse,
  };
});
