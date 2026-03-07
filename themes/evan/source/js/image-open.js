/* Article image click-to-open.
 *
 * Clicking an image inside `.article-content` opens the original image URL in a new tab.
 * - Does NOT hijack images already wrapped in a link.
 * - Adds `data-image-open="1"` for cursor styling.
 *
 * Exposes window.ImageOpen in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ImageOpen = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function pickImageUrl(img) {
    if (!img) return '';
    const url = img.currentSrc || img.src || '';
    return String(url || '').trim();
  }

  function shouldHijack(img) {
    if (!img || img.nodeType !== 1) return false;
    // If already inside a link, keep default navigation.
    const link = img.closest?.('a[href]');
    if (link) return false;
    return true;
  }

  function markImage(img) {
    try {
      img.setAttribute('data-image-open', '1');
    } catch {
      // ignore
    }
  }

  function initImageOpen({
    document = globalThis.document,
    window = globalThis.window,
    selector = '.article-content img'
  } = {}) {
    if (!document?.querySelectorAll) return;

    const images = Array.from(document.querySelectorAll(selector));
    if (images.length === 0) return;

    images.forEach((img) => {
      markImage(img);

      // Idempotent binding.
      if (img.getAttribute('data-image-open-bound') === '1') return;
      img.setAttribute('data-image-open-bound', '1');

      img.addEventListener('click', (event) => {
        if (!shouldHijack(img)) return;

        const url = pickImageUrl(img);
        if (!url) return;

        event.preventDefault();

        try {
          window?.open?.(url, '_blank', 'noopener');
        } catch {
          // ignore
        }
      });
    });
  }

  // Auto-init in browsers.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.ImageOpen = window.ImageOpen || {};
    window.ImageOpen.initImageOpen = initImageOpen;
    window.addEventListener('DOMContentLoaded', () => initImageOpen());
  }

  return {
    pickImageUrl,
    initImageOpen,
  };
});
