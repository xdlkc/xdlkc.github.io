/* Article link copy button.
 *
 * Adds click handler for a button annotated with [data-article-link-copy].
 * Clicking copies the current page URL without hash and shows a toast.
 *
 * Exposes window.ArticleLinkCopy in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArticleLinkCopy = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function lang(document) {
    return document?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
  }

  function t(document, key) {
    const map = {
      copied: { en: 'Link copied', zh: '链接已复制' },
      copiedBtn: { en: 'Copied', zh: '已复制' },
      copyBtn: { en: 'Copy Link', zh: '复制链接' },
      copyFailed: { en: 'Copy failed, please copy manually', zh: '复制失败，请手动复制' }
    };
    const row = map[key] || map.copyBtn;
    return lang(document) === 'zh' ? row.zh : row.en;
  }

  function ensureToast({ document } = {}) {
    const existing = document.querySelector('.code-copy-toast');
    if (existing) return existing;

    const toast = document.createElement('div');
    toast.className = 'code-copy-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    return toast;
  }

  function showToast(toast, message, { window } = {}) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    (window || globalThis).clearTimeout(showToast.timer);
    showToast.timer = (window || globalThis).setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1400);
  }

  function fallbackCopy(text, { document } = {}) {
    const area = document.createElement('textarea');
    area.value = String(text || '');
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const success = document.execCommand('copy');
    document.body.removeChild(area);
    if (!success) throw new Error('copy failed');
  }

  async function copyText(text, { navigator, document } = {}) {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    fallbackCopy(text, { document });
  }

  function buildUrlWithoutHash({ location } = {}) {
    const href = String(location?.href || '');
    if (!href) return '';
    const url = new URL(href);
    url.hash = '';
    return url.toString();
  }

  function initArticleLinkCopy({
    document = globalThis.document,
    navigator = globalThis.navigator,
    location = globalThis.location,
    window = globalThis.window,
  } = {}) {
    if (!document?.querySelector) return;

    const button = document.querySelector('[data-article-link-copy]');
    if (!button) return;

    const toast = ensureToast({ document });

    // Prevent double-binding.
    if (button.dataset.articleLinkCopyBound === '1') return;
    button.dataset.articleLinkCopyBound = '1';

    button.addEventListener('click', async () => {
      const url = buildUrlWithoutHash({ location });
      if (!url) return;

      try {
        await copyText(url, { navigator, document });
        showToast(toast, t(document, 'copied'), { window });
        const previous = button.textContent;
        button.textContent = t(document, 'copiedBtn');
        (window || globalThis).setTimeout(() => {
          button.textContent = previous || t(document, 'copyBtn');
        }, 1200);
      } catch {
        showToast(toast, t(document, 'copyFailed'), { window });
      }
    });
  }

  // Auto-init in browsers.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.ArticleLinkCopy = window.ArticleLinkCopy || {};
    window.ArticleLinkCopy.initArticleLinkCopy = initArticleLinkCopy;
    window.addEventListener('DOMContentLoaded', () => initArticleLinkCopy());
  }

  return {
    buildUrlWithoutHash,
    initArticleLinkCopy,
  };
});
