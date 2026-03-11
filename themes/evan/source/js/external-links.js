/* External link enhancer.
 *
 * Applies to links inside .article-content:
 * - external links open in a new tab (target=_blank)
 * - adds rel="noopener noreferrer" for security
 * - adds .external-link class for styling
 *
 * Exposes window.ExternalLinks in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ExternalLinks = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function isSkippableHref(href) {
    const value = String(href || '').trim();
    if (!value) return true;
    if (value.startsWith('#')) return true;

    const lower = value.toLowerCase();
    if (lower.startsWith('mailto:')) return true;
    if (lower.startsWith('tel:')) return true;
    if (lower.startsWith('javascript:')) return true;

    // Relative links we consider internal.
    if (value.startsWith('/')) return true;
    if (value.startsWith('./')) return true;
    if (value.startsWith('../')) return true;

    return false;
  }

  function parseUrl(href, { base } = {}) {
    try {
      return new URL(String(href || ''), String(base || ''));
    } catch {
      return null;
    }
  }

  function isExternalLink(anchor, { location } = {}) {
    if (!anchor) return false;

    const href = anchor.getAttribute?.('href');
    if (isSkippableHref(href)) return false;

    const loc = location || (typeof window !== 'undefined' ? window.location : null);
    const base = String(loc?.href || '');
    const url = parseUrl(href, { base });
    if (!url) return false;

    const origin = String(loc?.origin || '');
    if (!origin) return false;

    return url.origin !== origin;
  }

  function mergeRel(existingRel, tokens) {
    const existing = String(existingRel || '')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const set = new Set(existing);
    (tokens || []).forEach((t) => {
      const token = String(t || '').trim();
      if (token) set.add(token);
    });

    return Array.from(set).join(' ');
  }

  function enhanceAnchor(a, { location } = {}) {
    if (!a?.setAttribute) return;

    if (!isExternalLink(a, { location })) return;

    // Don't override author intent.
    try {
      if (!a.getAttribute('target')) {
        a.setAttribute('target', '_blank');
      }
    } catch {
      // ignore
    }

    try {
      const nextRel = mergeRel(a.getAttribute('rel'), ['noopener', 'noreferrer']);
      if (nextRel) a.setAttribute('rel', nextRel);
    } catch {
      // ignore
    }

    try {
      a.classList?.add?.('external-link');
    } catch {
      // ignore
    }
  }

  function initExternalLinks({ root = document, location } = {}) {
    if (!root?.querySelectorAll) return;

    const anchors = Array.from(root.querySelectorAll?.('.article-content a') || []);
    anchors.forEach((a) => enhanceAnchor(a, { location }));
  }

  return {
    isSkippableHref,
    isExternalLink,
    mergeRel,
    initExternalLinks,
  };
});
