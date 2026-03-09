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

  function formatCopiedLineMessage(lineCount) {
    const count = Math.max(0, Number(lineCount) || 0);
    return `已复制 ${count} 行`;
  }

  function formatCopiedButtonLabel(lineCount) {
    const count = Math.max(0, Number(lineCount) || 0);
    return `已复制（${count} 行）`;
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

      try {
        await copyText(text);
        showToast(toast, '复制成功');
        flashCopiedClass(container, { durationMs: 1200 });
      } catch (error) {
        showToast(toast, '复制失败，请手动复制');
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
    button.textContent = '复制代码';
    button.setAttribute('aria-label', '复制代码');

    button.addEventListener('click', async () => {
      const text = block.type === 'highlight'
        ? extractFromHighlightFigure(container)
        : extractFromPre(container);

      if (!text.trim()) return;

      try {
        await copyText(text);
        const lineCount = countCopiedLines(text);
        showToast(toast, formatCopiedLineMessage(lineCount));
        flashCopiedClass(container, { durationMs: 1200 });
        button.textContent = formatCopiedButtonLabel(lineCount);
        window.setTimeout(() => {
          button.textContent = '复制代码';
        }, 1200);
      } catch (error) {
        showToast(toast, '复制失败，请手动复制');
      }
    });

    container.appendChild(button);
  }

  function initCodeCopy({ root = document } = {}) {
    if (!root?.querySelectorAll) return;

    const toast = ensureToast();

    const blocks = findCodeBlocks({ root });
    blocks.forEach((block) => {
      injectButton({ block, toast });
      bindDoubleClickCopy({ block, toast });
    });
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
