/* MermaidEnhance
 *
 * Goal: keep Mermaid diagrams consistent with site theme (light/dark) and
 * re-render diagrams on theme toggle without a page refresh.
 *
 * - Chooses mermaid theme based on documentElement.dataset.theme
 * - Stashes original diagram source in data-mermaid-source so we can restore
 *   and re-render when theme changes.
 *
 * Browser: window.MermaidEnhance
 * Node tests: CommonJS exports
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MermaidEnhance = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function pickMermaidTheme(theme) {
    return String(theme || '') === 'dark' ? 'dark' : 'default';
  }

  function stashMermaidSource(el) {
    if (!el || !el.getAttribute || !el.setAttribute) return;
    if (el.getAttribute('data-mermaid-source')) return;

    // Prefer textContent. If the element already got rendered to SVG, callers
    // should call restoreMermaidSource first.
    const raw = String(el.textContent || '').trim();
    if (!raw) return;
    el.setAttribute('data-mermaid-source', raw);
  }

  function restoreMermaidSource(el) {
    if (!el || !el.getAttribute) return;
    const src = el.getAttribute('data-mermaid-source');
    if (!src) return;

    // Restore source as plain text so Mermaid can parse it again.
    try {
      el.textContent = src;
    } catch {
      // ignore
    }
  }

  function findMermaidBlocks(document) {
    if (!document?.querySelectorAll) return [];
    return Array.from(document.querySelectorAll('.mermaid'));
  }

  // Minimal debounce: avoid multiple re-renders in quick succession.
  function debounce(fn, waitMs, { window } = {}) {
    let t = null;
    return function(...args) {
      const win = window || globalThis;
      if (t) {
        try { win.clearTimeout(t); } catch {}
      }
      t = win.setTimeout(() => {
        t = null;
        fn.apply(null, args);
      }, waitMs);
    };
  }

  async function renderMermaid({ mermaid, document, theme } = {}) {
    if (!mermaid || !document) return;

    const blocks = findMermaidBlocks(document);
    if (blocks.length === 0) return;

    blocks.forEach((el) => {
      stashMermaidSource(el);
      // Always restore before rendering to ensure consistent input.
      restoreMermaidSource(el);
    });

    mermaid.initialize({ startOnLoad: false, theme: theme || 'default' });
    await mermaid.run({ querySelector: '.mermaid' });
  }

  function watchThemeAndRerender({ mermaid, document, window } = {}) {
    if (!document?.documentElement) return;
    if (document.documentElement.dataset.xdlkcMermaidThemeWatchBound === '1') return;
    document.documentElement.dataset.xdlkcMermaidThemeWatchBound = '1';

    const win = window || globalThis.window || globalThis;

    const rerender = debounce(async () => {
      const current = document.documentElement.dataset.theme;
      const theme = pickMermaidTheme(current);
      try {
        await renderMermaid({ mermaid, document, theme });
      } catch {
        // ignore: rendering failures should not break the page
      }
    }, 120, { window: win });

    try {
      const obs = new (win.MutationObserver || MutationObserver)((mutations) => {
        for (const m of mutations || []) {
          if (m.type === 'attributes' && m.attributeName === 'data-theme') {
            rerender();
            break;
          }
        }
      });

      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    } catch {
      // ignore
    }
  }

  async function initMermaidEnhance({ mermaid, document = globalThis.document, window = globalThis.window } = {}) {
    if (!mermaid || !document?.querySelectorAll) return;

    const blocks = findMermaidBlocks(document);
    if (blocks.length === 0) return;

    const theme = pickMermaidTheme(document.documentElement?.dataset?.theme);
    await renderMermaid({ mermaid, document, theme });
    watchThemeAndRerender({ mermaid, document, window });
  }

  return {
    pickMermaidTheme,
    stashMermaidSource,
    restoreMermaidSource,
    initMermaidEnhance,
    // Expose internals for tests
    _renderMermaid: renderMermaid,
  };
});
