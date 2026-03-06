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
    const lines = Array.from(figure.querySelectorAll?.('.line') || [])
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
        showToast(toast, '复制成功');
        button.textContent = '已复制';
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
    blocks.forEach((block) => injectButton({ block, toast }));
  }

  return {
    normalizeNewlines,
    extractFromPre,
    extractFromHighlightFigure,
    findCodeBlocks,
    initCodeCopy
  };
});
