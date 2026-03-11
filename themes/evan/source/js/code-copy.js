/* Code copy button for code blocks.
 *
 * Supports:
 * - <pre><code>...</code></pre>
 * - Hexo highlight: <figure class="highlight ..."> with .line elements
 *
 * Exposes window.CodeCopy in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CodeCopy = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function normalizeNewlines(text) {
    return String(text || '').replace(/\r\n?/g, '\n');
  }

  function extractFromPre(pre) {
    if (!pre) return '';
    const code = pre.querySelector?.('code');
    // Prefer code element content to avoid including the button text.
    const text = code ? code.textContent : pre.textContent;
    return normalizeNewlines(text || '').trimEnd();
  }

  function extractFromHighlightFigure(figure) {
    if (!figure) return '';

    // Prefer the code column when present (Hexo highlight often renders a gutter column
    // with line numbers that also uses `.line`).
    const codeLines = figure.querySelectorAll?.('.code .line');
    const selector = codeLines && codeLines.length ? '.code .line' : '.line';

    const lines = Array.from(figure.querySelectorAll?.(selector) || [])
      .map((line) => line.textContent || '');

    // Some highlight renderers keep an extra trailing empty line; keep internal empties
    // but drop a single final empty line for nicer copy.
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

    return normalizeNewlines(lines.join('\n')).trimEnd();
  }

  function findCodeBlocks({ root = document } = {}) {
    const blocks = [];

    Array.from(root.querySelectorAll('.article-content pre')).forEach((pre) => {
      // Avoid double-injecting for Hexo highlight blocks: <figure.highlight> often contains a <pre>.
      // In that case we treat the whole figure as the copy container.
      if (pre.closest && pre.closest('figure.highlight')) return;
      blocks.push({ type: 'pre', element: pre });
    });

    Array.from(root.querySelectorAll('.article-content figure.highlight')).forEach((figure) => {
      blocks.push({ type: 'highlight', element: figure });
    });

    return blocks;
  }

  function ensureToast() {
    const existing = document.querySelector('.code-copy-toast');
    if (existing) return existing;

    const toast = document.createElement('div');
    toast.className = 'code-copy-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    return toast;
  }

  function showToast(toast, message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1400);
  }

  function countCopiedLines(text) {
    const normalized = normalizeNewlines(text).trimEnd();
    if (!normalized) return 0;
    return normalized.split('\n').length;
  }

  function resolveLang(doc = document) {
    const mode = doc?.documentElement?.dataset?.langMode;
    return mode === 'en' ? 'en' : 'zh';
  }

  function formatCopiedLineMessage(lineCount, { lang = 'zh' } = {}) {
    const count = Math.max(0, Number(lineCount) || 0);
    if (lang === 'en') return `Copied ${count} ${count === 1 ? 'line' : 'lines'}`;
    return `已复制 ${count} 行`;
  }

  function formatCopiedButtonLabel(lineCount, { lang = 'zh' } = {}) {
    const count = Math.max(0, Number(lineCount) || 0);
    if (lang === 'en') return `Copied (${count} ${count === 1 ? 'line' : 'lines'})`;
    return `已复制（${count} 行）`;
  }

  function copyButtonText({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Copy code' : '复制代码';
  }

  function copyButtonAriaLabel({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Copy code' : '复制代码';
  }

  function copySuccessToastText({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Copied' : '复制成功';
  }

  function copyFailureToastText({ lang = 'zh', withHint = false } = {}) {
    if (lang === 'en') {
      return withHint
        ? 'Copy failed. Code selected — press Ctrl/Cmd+C'
        : 'Copy failed, please copy manually';
    }
    return withHint
      ? '复制失败，已选中代码，按 Ctrl/Cmd+C'
      : '复制失败，请手动复制';
  }

  function flashCopiedClass(container, { durationMs = 1200 } = {}) {
    if (!container?.classList) return;

    // Avoid stacking timers when users click repeatedly.
    try {
      const prev = Number(container.getAttribute('data-code-copy-flash-timer') || '0');
      if (prev) window.clearTimeout(prev);
    } catch {
      // ignore
    }

    container.classList.add('is-copied');

    const timer = window.setTimeout(() => {
      container.classList.remove('is-copied');
      try {
        container.removeAttribute('data-code-copy-flash-timer');
      } catch {
        // ignore
      }
    }, Math.max(0, Number(durationMs) || 1200));

    try {
      container.setAttribute('data-code-copy-flash-timer', String(timer));
    } catch {
      // ignore
    }
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const success = document.execCommand('copy');
    document.body.removeChild(area);
    if (!success) throw new Error('copy failed');
  }

  function selectCodeContent(container, { type } = {}) {
    if (!container) return;

    const doc = container?.ownerDocument || document;
    const win = doc?.defaultView || window;

    const target = type === 'highlight'
      ? (container.querySelector?.('.code') || container)
      : (container.querySelector?.('code') || container);

    try {
      const selection = win?.getSelection?.();
      const range = doc?.createRange?.();
      if (!selection || !range || !range.selectNodeContents) return;

      range.selectNodeContents(target);
      selection.removeAllRanges?.();
      selection.addRange?.(range);
    } catch {
      // ignore
    }
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    fallbackCopy(text);
  }

  function bindDoubleClickCopy({ block, toast } = {}) {
    if (!block || !block.element) return;

    const container = block.element;
    // Idempotent: avoid binding twice.
    if (container.getAttribute?.('data-code-copy-dblclick') === '1') return;
    container.setAttribute?.('data-code-copy-dblclick', '1');

    container.addEventListener('dblclick', async () => {
      // If user is selecting text, don't hijack.
      try {
        const selected = window.getSelection?.()?.toString?.() || '';
        if (String(selected).trim()) return;
      } catch {
        // ignore
      }

      const text = block.type === 'highlight'
        ? extractFromHighlightFigure(container)
        : extractFromPre(container);

      if (!text.trim()) return;

      const doc = container?.ownerDocument || document;
      try {
        await copyText(text);
        const lang = resolveLang(doc);
        showToast(toast, copySuccessToastText({ lang }));
        flashCopiedClass(container, { durationMs: 1200 });
      } catch (error) {
        // On failure, select code so user can Ctrl/Cmd+C.
        selectCodeContent(container, { type: block.type });
        const lang = resolveLang(doc);
        showToast(toast, copyFailureToastText({ lang, withHint: true }));
      }
    });
  }

  function bindLongPressCopy({ block, toast, longPressMs = 450 } = {}) {
    if (!block || !block.element) return;

    const container = block.element;
    // Idempotent: avoid binding twice.
    if (container.getAttribute?.('data-code-copy-longpress') === '1') return;
    container.setAttribute?.('data-code-copy-longpress', '1');

    // Only for touch interactions (mobile). touchmove cancels.
    let timer = null;
    const clear = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };

    container.addEventListener('touchstart', () => {
      clear();
      timer = window.setTimeout(async () => {
        timer = null;

        const text = block.type === 'highlight'
          ? extractFromHighlightFigure(container)
          : extractFromPre(container);

        if (!text.trim()) return;

        const doc = container?.ownerDocument || document;
        try {
          await copyText(text);
          const lang = resolveLang(doc);
          const lineCount = countCopiedLines(text);
          showToast(toast, formatCopiedLineMessage(lineCount, { lang }));
          flashCopiedClass(container, { durationMs: 1200 });
        } catch {
          selectCodeContent(container, { type: block.type });
          const lang = resolveLang(doc);
          showToast(toast, copyFailureToastText({ lang, withHint: true }));
        }
      }, Math.max(0, Number(longPressMs) || 0));
    }, { passive: true });

    container.addEventListener('touchend', clear, { passive: true });
    container.addEventListener('touchcancel', clear, { passive: true });
    container.addEventListener('touchmove', clear, { passive: true });
  }

  function ensureFocusable(container) {
    if (!container?.setAttribute) return;

    // Make code blocks keyboard focusable for shortcut usage.
    // Only set when no explicit tabindex exists.
    try {
      if (container.getAttribute('tabindex') == null) {
        container.setAttribute('tabindex', '0');
      }
    } catch {
      // ignore
    }
  }

  function bindKeyboardShortcutCopy({ block, toast } = {}) {
    if (!block || !block.element) return;

    const container = block.element;
    if (container.getAttribute?.('data-code-copy-shortcut') === '1') return;
    container.setAttribute?.('data-code-copy-shortcut', '1');

    container.addEventListener('keydown', async (event) => {
      const key = String(event?.key || '');
      const isC = key === 'c' || key === 'C';
      const hasModifier = !!(event?.ctrlKey || event?.metaKey);
      const isShortcut = isC && hasModifier && !!event?.shiftKey;
      if (!isShortcut) return;

      // Avoid interfering with IME.
      if (event?.isComposing) return;

      try {
        event.preventDefault?.();
        event.stopPropagation?.();
      } catch {
        // ignore
      }

      const text = block.type === 'highlight'
        ? extractFromHighlightFigure(container)
        : extractFromPre(container);

      if (!text.trim()) return;

      const doc = container?.ownerDocument || document;
      try {
        await copyText(text);
        const lang = resolveLang(doc);
        const lineCount = countCopiedLines(text);
        showToast(toast, formatCopiedLineMessage(lineCount, { lang }));
        flashCopiedClass(container, { durationMs: 1200 });
      } catch {
        selectCodeContent(container, { type: block.type });
        const lang = resolveLang(doc);
        showToast(toast, copyFailureToastText({ lang, withHint: true }));
      }
    });
  }

  function injectButton({ block, toast } = {}) {
    if (!block || !block.element) return;

    const container = block.element;
    if (container.querySelector('.code-copy-button')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy-button';
    {
      const doc = container?.ownerDocument || document;
      const lang = resolveLang(doc);
      button.textContent = copyButtonText({ lang });
      button.setAttribute('aria-label', copyButtonAriaLabel({ lang }));
    }

    button.addEventListener('click', async () => {
      const text = block.type === 'highlight'
        ? extractFromHighlightFigure(container)
        : extractFromPre(container);

      if (!text.trim()) return;

      const doc = container?.ownerDocument || document;
      try {
        await copyText(text);
        const lang = resolveLang(doc);
        const lineCount = countCopiedLines(text);
        showToast(toast, formatCopiedLineMessage(lineCount, { lang }));
        flashCopiedClass(container, { durationMs: 1200 });
        button.textContent = formatCopiedButtonLabel(lineCount, { lang });
        window.setTimeout(() => {
          const nextLang = resolveLang(doc);
          button.textContent = copyButtonText({ lang: nextLang });
          button.setAttribute('aria-label', copyButtonAriaLabel({ lang: nextLang }));
        }, 1200);
      } catch (error) {
        // Permission-denied or unsupported clipboard: select code so user can Ctrl/Cmd+C.
        selectCodeContent(container, { type: block.type });
        const lang = resolveLang(doc);
        showToast(toast, copyFailureToastText({ lang, withHint: true }));
      }
    });

    container.appendChild(button);
  }

  function initCodeCopy({ root = document, longPressMs = 450 } = {}) {
    if (!root?.querySelectorAll) return;

    const toast = ensureToast();

    const blocks = findCodeBlocks({ root });
    blocks.forEach((block) => {
      ensureFocusable(block.element);
      injectButton({ block, toast });
      bindDoubleClickCopy({ block, toast });
      bindLongPressCopy({ block, toast, longPressMs });
      bindKeyboardShortcutCopy({ block, toast });
    });

    // React to language mode changes (LangToggle dispatches xdlkc:lang-change).
    // Keep it idempotent across repeated init calls.
    const doc = root?.nodeType === 9 ? root : root?.ownerDocument;
    const win = doc?.defaultView || window;
    if (doc?.documentElement && win?.addEventListener) {
      if (doc.documentElement.getAttribute('data-code-copy-lang-bound') !== '1') {
        doc.documentElement.setAttribute('data-code-copy-lang-bound', '1');
        win.addEventListener('xdlkc:lang-change', () => {
          const lang = resolveLang(doc);
          doc.querySelectorAll('.code-copy-button').forEach((btn) => {
            try {
              btn.textContent = copyButtonText({ lang });
              btn.setAttribute('aria-label', copyButtonAriaLabel({ lang }));
            } catch {
              // ignore
            }
          });
        });
      }
    }
  }

  return {
    normalizeNewlines,
    extractFromPre,
    extractFromHighlightFigure,
    findCodeBlocks,
    countCopiedLines,
    formatCopiedLineMessage,
    formatCopiedButtonLabel,
    initCodeCopy
  };
});
