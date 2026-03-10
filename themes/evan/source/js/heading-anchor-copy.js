/* Heading anchor copy.
 *
 * Adds a small button next to headings that have an id.
 * Clicking the button copies the full URL with hash and shows a toast.
 *
 * Exposes window.HeadingAnchorCopy in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HeadingAnchorCopy = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const DEFAULT_SELECTOR = '.article-content';

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

  function findHeadingsWithId({ root } = {}) {
    if (!root?.querySelectorAll) return [];
    const selector = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]';
    return Array.from(root.querySelectorAll(selector));
  }

  function resolveLang(document) {
    const mode = document?.documentElement?.dataset?.langMode;
    return mode === 'en' ? 'en' : 'zh';
  }

  function ariaLabelText({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Copy section link' : '复制本节链接';
  }

  function toastSuccessText({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Link copied' : '链接已复制';
  }

  function toastSuccessWithTitleText({ title, lang = 'zh' } = {}) {
    const t = String(title || '').trim();
    if (!t) return toastSuccessText({ lang });
    if (lang === 'en') return `Link copied: ${t}`;
    return `已复制：${t}`;
  }

  function toastFailureText({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Copy failed, please copy manually' : '复制失败，请手动复制';
  }

  function injectButtonIntoHeading({ heading, document } = {}) {
    if (!heading || !document) return null;
    if (heading.querySelector('.heading-anchor-button')) return null;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'heading-anchor-button';
    button.textContent = '#';

    const lang = resolveLang(document);
    button.setAttribute('aria-label', ariaLabelText({ lang }));

    heading.classList.add('heading-anchor-host');
    heading.appendChild(button);

    return button;
  }

  function updateAllButtonAriaLabels({ document } = {}) {
    if (!document?.querySelectorAll) return;
    const lang = resolveLang(document);
    document.querySelectorAll('.heading-anchor-button').forEach((button) => {
      try {
        button.setAttribute('aria-label', ariaLabelText({ lang }));
      } catch {
        // ignore
      }
    });
  }

  function buildUrlWithHash({ location, headingId } = {}) {
    const base = String(location?.href || '');
    const url = new URL(base);
    url.hash = `#${headingId}`;
    return url.toString();
  }

  function initHeadingAnchorCopy({
    document = globalThis.document,
    navigator = globalThis.navigator,
    location = globalThis.location,
    history = globalThis.history,
    selector = DEFAULT_SELECTOR,
    window = globalThis.window,
  } = {}) {
    if (!document?.querySelector) return;

    const container = document.querySelector(selector);
    if (!container) return;

    const toast = ensureToast({ document });

    const headings = findHeadingsWithId({ root: container });
    headings.forEach((heading) => {
      const id = heading.getAttribute('id');
      if (!id) return;

      const button = injectButtonIntoHeading({ heading, document });
      if (!button) return;

      button.addEventListener('click', async () => {
        const url = buildUrlWithHash({ location, headingId: id });

        try {
          await copyText(url, { navigator, document });
          // Update URL hash without jump (browser may still jump if user clicks heading itself; here it's a button).
          try {
            history?.replaceState?.(null, '', url);
          } catch {
            // ignore
          }
          const lang = resolveLang(document);
          const title = String(heading.textContent || '').replace(/#/g, '').trim();
          showToast(toast, toastSuccessWithTitleText({ title, lang }), { window });
          button.classList.add('is-copied');
          (window || globalThis).setTimeout(() => button.classList.remove('is-copied'), 1200);
        } catch {
          const lang = resolveLang(document);
          showToast(toast, toastFailureText({ lang }), { window });
        }
      });
    });

    if (document?.documentElement && window?.addEventListener) {
      if (document.documentElement.getAttribute('data-heading-anchor-lang-bound') !== '1') {
        document.documentElement.setAttribute('data-heading-anchor-lang-bound', '1');
        window.addEventListener('xdlkc:lang-change', () => {
          updateAllButtonAriaLabels({ document });
        });
      }
    }
  }

  // Auto-init in browsers.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.HeadingAnchorCopy = window.HeadingAnchorCopy || {};
    window.HeadingAnchorCopy.initHeadingAnchorCopy = initHeadingAnchorCopy;
    window.addEventListener('DOMContentLoaded', () => initHeadingAnchorCopy());
  }

  return {
    buildUrlWithHash,
    initHeadingAnchorCopy,
  };
});
