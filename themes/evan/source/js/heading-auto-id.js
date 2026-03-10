/* Heading auto-id + TOC link repair.
 *
 * Purpose:
 * - Some rendered HTML headings may miss `id`, causing TOC anchors / heading-link copy to break.
 * - This script assigns stable-ish ids to headings inside `.article-content` and repairs TOC hrefs
 *   when their targets are missing.
 *
 * Exposes window.HeadingAutoId in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HeadingAutoId = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const DEFAULT_CONTAINER_SELECTOR = '.article-content';
  const DEFAULT_TOC_SELECTOR = '.toc-nav';

  function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  // A small, predictable slugifier.
  // - keeps CJK characters
  // - strips most punctuation
  // - converts spaces to '-'
  function slugify(text) {
    const raw = normalizeText(text);
    if (!raw) return '';

    // Normalize unicode (remove diacritics where possible).
    let s = raw;
    try {
      s = s.normalize('NFKD');
      // remove combining marks
      s = s.replace(/[\u0300-\u036f]/g, '');
    } catch {
      // ignore
    }

    s = s.toLowerCase();

    // Replace whitespace with hyphen.
    s = s.replace(/\s+/g, '-');

    // Remove punctuation but keep: a-z, 0-9, '-', '_', and CJK.
    // CJK range is approximate but good enough for headings.
    s = s.replace(/[^a-z0-9\-_\u4e00-\u9fff]+/g, '');

    // Collapse multiple hyphens.
    s = s.replace(/-+/g, '-');
    s = s.replace(/^-+|-+$/g, '');

    return s;
  }

  function isInsideCodeLike(el) {
    if (!el?.closest) return false;
    return !!el.closest('pre, code, kbd, samp');
  }

  function findHeadings({ container } = {}) {
    if (!container?.querySelectorAll) return [];
    return Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .filter((h) => !isInsideCodeLike(h));
  }

  function collectExistingIds({ document } = {}) {
    const ids = new Set();
    if (!document?.querySelectorAll) return ids;
    Array.from(document.querySelectorAll('[id]')).forEach((el) => {
      const id = el.getAttribute?.('id');
      if (id) ids.add(String(id));
    });
    return ids;
  }

  function uniqueId(base, used) {
    const b = String(base || '').trim();
    if (!b) return '';
    if (!used.has(b)) {
      used.add(b);
      return b;
    }

    let i = 2;
    while (used.has(`${b}-${i}`)) i += 1;
    const next = `${b}-${i}`;
    used.add(next);
    return next;
  }

  function ensureHeadingIds({ container, document } = {}) {
    const doc = document || container?.ownerDocument;
    const used = collectExistingIds({ document: doc });

    const headings = findHeadings({ container });
    headings.forEach((h) => {
      const existing = h.getAttribute?.('id');
      if (existing) {
        used.add(String(existing));
        return;
      }

      const text = normalizeText(h.textContent);
      const base = slugify(text) || 'section';
      const id = uniqueId(base, used);
      if (id) h.setAttribute('id', id);
    });
  }

  function findById(document, id) {
    if (!document?.getElementById) return null;
    try {
      return document.getElementById(id);
    } catch {
      return null;
    }
  }

  // Repair TOC links whose targets are missing.
  // Strategy:
  // - For each TOC link (in DOM order), if its current hash target doesn't exist,
  //   match by link text -> next heading with same text (order-sensitive) and re-point.
  function repairTocLinks({
    document = globalThis.document,
    tocSelector = DEFAULT_TOC_SELECTOR,
    containerSelector = DEFAULT_CONTAINER_SELECTOR,
  } = {}) {
    if (!document?.querySelectorAll) return;

    const tocRoots = Array.from(document.querySelectorAll(tocSelector));
    if (tocRoots.length === 0) return;

    const container = document.querySelector(containerSelector);
    if (!container) return;

    const headings = findHeadings({ container });
    if (headings.length === 0) return;

    // Pre-index headings by normalized text with queues (preserve order).
    const queues = new Map();
    headings.forEach((h) => {
      const key = normalizeText(h.textContent);
      if (!key) return;
      if (!queues.has(key)) queues.set(key, []);
      queues.get(key).push(h);
    });

    tocRoots.forEach((toc) => {
      const links = Array.from(toc.querySelectorAll('a[href^="#"]'));

      links.forEach((a) => {
        const href = String(a.getAttribute('href') || '');
        const hash = href.startsWith('#') ? href.slice(1) : '';
        const hasTarget = hash ? !!findById(document, hash) : false;
        if (hasTarget) return;

        const label = normalizeText(a.textContent);
        if (!label) return;

        const q = queues.get(label);
        if (!q || q.length === 0) return;

        // Find first heading in queue that has an id.
        // (ensureHeadingIds should have populated them already, but be defensive.)
        const heading = q.shift();
        if (!heading) return;

        const id = heading.getAttribute('id');
        if (!id) return;

        a.setAttribute('href', `#${id}`);
      });
    });
  }

  function initHeadingAutoId({
    document = globalThis.document,
    containerSelector = DEFAULT_CONTAINER_SELECTOR,
    tocSelector = DEFAULT_TOC_SELECTOR,
  } = {}) {
    if (!document?.querySelector) return;

    const container = document.querySelector(containerSelector);
    if (!container) return;

    ensureHeadingIds({ container, document });
    repairTocLinks({ document, tocSelector, containerSelector });
  }

  // Auto-init in browsers.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.HeadingAutoId = window.HeadingAutoId || {};
    window.HeadingAutoId.initHeadingAutoId = initHeadingAutoId;
    window.addEventListener('DOMContentLoaded', () => initHeadingAutoId());
  }

  return {
    slugify,
    ensureHeadingIds,
    repairTocLinks,
    initHeadingAutoId,
  };
});
