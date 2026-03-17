/* Article social share buttons (Twitter, Weibo, LinkedIn, WeChat).
 *
 * Generates share URLs for social platforms and handles WeChat QR modal.
 *
 * Exposes window.ArticleShare in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArticleShare = factory();
    // Auto-init in browsers.
    try {
      root.addEventListener('DOMContentLoaded', () => {
        root.ArticleShare?.initArticleShare?.();
      });
    } catch {
      // ignore
    }
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function encodeComponent(str) {
    try {
      return encodeURIComponent(String(str || ''));
    } catch {
      return '';
    }
  }

  function generateShareUrl({ platform, title, url } = {}) {
    if (!platform) return null;
    const encodedUrl = encodeComponent(url || '');
    const encodedTitle = encodeComponent(title || '');

    switch (platform.toLowerCase()) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=xdlkc`;
      case 'weibo':
        return `https://service.weibo.com/share/share.php?title=${encodedTitle}&url=${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      default:
        return null;
    }
  }

  function ensureQrModal({ document } = {}) {
    const doc = document || globalThis.document;
    if (!doc?.querySelector) return null;

    const existing = doc.querySelector('[data-article-share-qr-modal]');
    if (existing) return existing;

    const modal = doc.createElement('div');
    modal.className = 'article-share-qr-modal';
    modal.setAttribute('data-article-share-qr-modal', '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';

    const panel = doc.createElement('div');
    panel.className = 'article-share-qr-panel';

    const title = doc.createElement('div');
    title.className = 'article-share-qr-title';
    title.textContent = 'Scan to share';

    const img = doc.createElement('img');
    img.className = 'article-share-qr-img';
    img.setAttribute('data-article-share-qr-img', '');
    img.alt = 'QR Code';

    const close = doc.createElement('button');
    close.className = 'article-share-qr-close';
    close.setAttribute('type', 'button');
    close.setAttribute('data-article-share-qr-close', '');
    close.textContent = 'Close';

    panel.appendChild(title);
    panel.appendChild(img);
    panel.appendChild(close);
    modal.appendChild(panel);
    doc.body.appendChild(modal);

    return modal;
  }

  async function openQrModal(modal, url) {
    if (!modal) return;
    const img = modal.querySelector('[data-article-share-qr-img]');
    if (!img) return;

    // Validate URL
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL for QR code generation:', url);
      throw new Error('URL is required and must be a string');
    }

    try {
      // Use qrcode library to generate QR code locally
      let QRCode;
      if (typeof require === 'function') {
        QRCode = require('qrcode');
      } else if (typeof window !== 'undefined' && window.QRCode) {
        QRCode = window.QRCode;
      } else {
        throw new Error('qrcode library not available');
      }

      const dataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M'
      });

      img.src = dataUrl;

      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('is-open');
    } catch (error) {
      console.error('QR Code generation failed:', error);
      // Fallback to external API if local generation fails
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      img.src = qrApiUrl;

      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('is-open');
    }
  }

  function closeQrModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  function initArticleShare({ root = document } = {}) {
    if (!root?.querySelector) return;

    const container = root.querySelector('[data-article-share]');
    if (!container) return;

    // Idempotent
    if (container.getAttribute('data-article-share-inited') === '1') return;
    container.setAttribute('data-article-share-inited', '1');

    // Initialize link-based shares (twitter, weibo, linkedin)
    const links = container.querySelectorAll('a[data-share-platform]');
    links.forEach(link => {
      if (!link?.getAttribute) return;
      const platform = link.getAttribute('data-share-platform');
      const title = link.getAttribute('data-article-title');
      const url = link.getAttribute('data-article-url');

      const shareUrl = generateShareUrl({ platform, title, url });
      if (shareUrl) {
        link.href = shareUrl;
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Initialize WeChat button
    const wechatBtn = container.querySelector('button[data-share-platform="wechat"]');
    if (wechatBtn) {
      const modal = ensureQrModal({ document: root });

      wechatBtn.addEventListener('click', () => {
        // Try to get URL from button first, then from parent container
        let url = wechatBtn.getAttribute('data-article-url');
        if (!url) {
          url = container.getAttribute('data-article-url');
        }
        openQrModal(modal, url);
      });
    }

    // Handle QR modal close
    const modal = root.querySelector('[data-article-share-qr-modal]');
    if (modal) {
      // Close button
      const closeBtn = modal.querySelector('[data-article-share-qr-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => closeQrModal(modal));
      }

      // Click outside to close
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeQrModal(modal);
        }
      });

      // ESC to close
      const win = root.defaultView || globalThis.window;
      if (win?.addEventListener) {
        win.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && modal.style.display !== 'none') {
            closeQrModal(modal);
          }
        });
      }
    }
  }

  return {
    generateShareUrl,
    initArticleShare,
    ensureQrModal,
    openQrModal,
    closeQrModal,
  };
});
