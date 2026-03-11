/* Article image lightbox (click-to-zoom).
 *
 * Enhances images inside `.article-content`:
 * - Click image => open overlay dialog
 * - Close via backdrop click / Escape / close button
 *
 * Exposes window.ImageLightbox in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ImageLightbox = factory();
    // Auto-init in browsers (safe + idempotent).
    try {
      root.addEventListener('DOMContentLoaded', () => {
        root.ImageLightbox?.initImageLightbox?.();
      });
    } catch {
      // ignore
    }
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function ensureOverlay({ document } = {}) {
    const doc = document || globalThis.document;
    if (!doc?.querySelector) return null;

    const existing = doc.querySelector('[data-image-lightbox]');
    if (existing) return existing;

    const overlay = doc.createElement('div');
    overlay.className = 'image-lightbox';
    overlay.setAttribute('data-image-lightbox', '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="image-lightbox-panel" data-image-lightbox-panel>
        <button class="image-lightbox-close" type="button" data-image-lightbox-close aria-label="Close image">×</button>
        <img class="image-lightbox-img" data-image-lightbox-img alt="" />
        <div class="image-lightbox-caption" data-image-lightbox-caption></div>
      </div>
    `.trim();

    doc.body.appendChild(overlay);
    return overlay;
  }

  function openOverlay(overlay, { src, alt } = {}) {
    if (!overlay) return;

    const img = overlay.querySelector?.('[data-image-lightbox-img]');
    const caption = overlay.querySelector?.('[data-image-lightbox-caption]');

    if (img) {
      img.setAttribute('src', String(src || ''));
      img.setAttribute('alt', String(alt || ''));
    }

    if (caption) {
      const text = String(alt || '').trim();
      caption.textContent = text;
      if (text) caption.removeAttribute('hidden');
      else caption.setAttribute('hidden', 'hidden');
    }

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function initImageLightbox({ window = globalThis.window, document = globalThis.document } = {}) {
    const doc = document;
    const win = window;

    if (!doc?.querySelectorAll || !win) return;

    const overlay = ensureOverlay({ document: doc });
    if (!overlay) return;

    // Bind overlay close behavior (idempotent).
    if (overlay.getAttribute('data-image-lightbox-bound') !== '1') {
      overlay.setAttribute('data-image-lightbox-bound', '1');

      overlay.addEventListener('click', (event) => {
        // Backdrop click closes; clicks inside panel do not.
        const panel = overlay.querySelector?.('[data-image-lightbox-panel]');
        if (panel && panel.contains?.(event.target)) return;
        closeOverlay(overlay);
      });

      const closeBtn = overlay.querySelector?.('[data-image-lightbox-close]');
      closeBtn?.addEventListener('click', (event) => {
        try {
          event.preventDefault?.();
          event.stopPropagation?.();
        } catch {
          // ignore
        }
        closeOverlay(overlay);
      });

      doc.addEventListener('keydown', (event) => {
        const key = String(event?.key || '');
        if (!overlay.classList.contains('is-open')) return;

        if (key === 'Escape') {
          closeOverlay(overlay);
          return;
        }

        // Keyboard navigation when open.
        if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;

        const list = overlay.__xdlkcLightboxImages;
        if (!Array.isArray(list) || list.length <= 1) return;

        const rawIdx = Number(overlay.__xdlkcLightboxIndex);
        const current = Number.isFinite(rawIdx) ? rawIdx : 0;
        const delta = key === 'ArrowRight' ? 1 : -1;

        // Wrap around.
        const nextIndex = (current + delta + list.length) % list.length;
        const nextImg = list[nextIndex];
        if (!nextImg?.getAttribute) return;

        try {
          event.preventDefault?.();
          event.stopPropagation?.();
        } catch {
          // ignore
        }

        overlay.__xdlkcLightboxIndex = nextIndex;
        openOverlay(overlay, {
          src: nextImg.getAttribute('src') || '',
          alt: nextImg.getAttribute('alt') || ''
        });
      });
    }

    // Bind click for article images.
    // Also keep an ordered list for keyboard navigation.
    const imgs = Array.from(doc.querySelectorAll('.article-content img'));
    const eligibleImgs = imgs.filter((img) => {
      if (!img?.closest) return true;
      return !img.closest('a');
    });
    overlay.__xdlkcLightboxImages = eligibleImgs;

    imgs.forEach((img) => {
      if (!img?.getAttribute) return;
      if (img.getAttribute('data-image-lightbox') === '1') return;
      img.setAttribute('data-image-lightbox', '1');

      img.addEventListener('click', (event) => {
        // If image is wrapped by a link, let the link do its job.
        const anchor = img.closest?.('a');
        if (anchor) return;

        try {
          event.preventDefault?.();
          event.stopPropagation?.();
        } catch {
          // ignore
        }

        const idx = eligibleImgs.indexOf(img);
        overlay.__xdlkcLightboxIndex = idx >= 0 ? idx : 0;

        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        openOverlay(overlay, { src, alt });
      });
    });
  }

  return {
    ensureOverlay,
    openOverlay,
    closeOverlay,
    initImageLightbox,
  };
});
