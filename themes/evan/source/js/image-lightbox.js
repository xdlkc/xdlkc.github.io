/* Article image lightbox (click-to-zoom).
 *
 * Adds click-to-zoom functionality to images inside `.article-content`.
 *
 * Exposes window.ImageLightbox in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ImageLightbox = factory();
    // Auto-init in browsers.
    try {
      root.addEventListener('DOMContentLoaded', () => {
        root.ImageLightbox?.initImageLightbox?.();
      });
    } catch {
      // ignore
    }
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function ensureLightboxOverlay({ document } = {}) {
    const doc = document || globalThis.document;
    if (!doc?.querySelector) return null;

    const existing = doc.querySelector('[data-image-lightbox-overlay]') || doc.querySelector('div.image-lightbox[data-image-lightbox]');
    if (existing) return existing;

    const overlay = doc.createElement('div');
    overlay.className = 'image-lightbox';
    overlay.setAttribute('data-image-lightbox', '');
    overlay.setAttribute('data-image-lightbox-overlay', '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:none;align-items:center;justify-content:center;z-index:9999;cursor:pointer;';

    const panel = doc.createElement('div');
    panel.className = 'image-lightbox-panel';
    panel.setAttribute('data-image-lightbox-panel', '');
    panel.style.cssText = 'position:relative;max-width:90%;max-height:90%;';

    const img = doc.createElement('img');
    img.className = 'image-lightbox-img';
    img.setAttribute('data-image-lightbox-img', '');
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;cursor:default;';

    const closeBtn = doc.createElement('button');
    closeBtn.className = 'image-lightbox-close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('data-image-lightbox-close', '');
    closeBtn.setAttribute('aria-label', 'Close image');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'position:absolute;top:-20px;right:-20px;font-size:40px;color:white;background:none;border:none;cursor:pointer;padding:0;width:50px;height:50px;';

    panel.appendChild(img);
    panel.appendChild(closeBtn);
    overlay.appendChild(panel);
    doc.body.appendChild(overlay);

    return overlay;
  }

  function openLightbox(overlay, image) {
    if (!overlay || !image) return;

    const lightboxImg = overlay.querySelector('[data-image-lightbox-img]');
    if (!lightboxImg) return;

    // Use getAttribute to preserve original src value (including relative paths) for UI tests
    lightboxImg.src = image.getAttribute('src');
    lightboxImg.alt = image.alt || '';

    overlay.classList.add('is-open');
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox(overlay) {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  }

  function initImageLightbox({ root, window, document: doc } = {}) {
    const docRoot = root || doc;
    if (!docRoot?.querySelector) return;

    const articleContent = docRoot.querySelector('.article-content');
    if (!articleContent) return;

    const overlay = ensureLightboxOverlay({ document: docRoot });
    if (!overlay) return;

    // Mark overlay as inited to avoid duplicate event listeners
    if (overlay.getAttribute('data-image-lightbox-overlay-inited') === '1') return;
    overlay.setAttribute('data-image-lightbox-overlay-inited', '1');

    const images = articleContent.querySelectorAll('img');
    images.forEach(img => {
      if (!img?.addEventListener) return;

      // Mark image as lightbox-enabled
      if (img.getAttribute('data-image-lightbox-inited') === '1') return;
      img.setAttribute('data-image-lightbox-inited', '1');
      img.style.cursor = 'pointer';

      img.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox(overlay, img);
      });
    });

    // Close on backdrop click (not on panel)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeLightbox(overlay);
      }
    });

    // Panel click does not close overlay
    const panel = overlay.querySelector('[data-image-lightbox-panel]');
    if (panel) {
      panel.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Close on button click
    const closeBtn = overlay.querySelector('[data-image-lightbox-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox(overlay);
      });
    }

    // Close on Escape
    const win = window || root?.defaultView || globalThis.window;
    if (win?.addEventListener) {
      win.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.style.display !== 'none') {
          closeLightbox(overlay);
        }
      });
    }
  }

  return {
    initImageLightbox,
    ensureLightboxOverlay,
    openLightbox,
    closeLightbox,
  };
});
