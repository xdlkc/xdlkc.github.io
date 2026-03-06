(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TocScrollSpy = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function slugifyHeading(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      // Replace common separators with spaces so they collapse into one dash.
      .replace(/[\\/|_]+/g, ' ')
      // Drop punctuation but keep CJK, letters, digits, spaces and hyphens.
      .replace(/[^\p{L}\p{N}\p{Script=Han}\s-]+/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Decide which heading should be considered active given scrollY.
   * headings: [{id, top}] where top is the document Y offset for the heading.
   */
  function pickActiveHeadingId({ scrollY, headings, offset = 0 } = {}) {
    if (!Array.isArray(headings) || headings.length === 0) return null;

    const y = (Number.isFinite(scrollY) ? scrollY : 0) + offset;

    // If before the first heading, keep first active.
    if (y < headings[0].top) return headings[0].id;

    // Find the last heading whose top <= y.
    for (let i = headings.length - 1; i >= 0; i--) {
      if (y >= headings[i].top) return headings[i].id;
    }

    return headings[0].id;
  }

  function getHeadingTopInDocument(element) {
    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    return rect.top + scrollY;
  }

  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function computeScrollTop({ targetTop, headerHeight, margin = 12 } = {}) {
    const top = toNumber(targetTop, 0);
    const header = toNumber(headerHeight, 0);
    const m = toNumber(margin, 12);
    return Math.max(0, Math.round(top - header - m));
  }

  function ensureHeadingIds(headings) {
    const used = new Set();

    headings.forEach((heading) => {
      const existing = heading.getAttribute('id');
      if (existing) {
        used.add(existing);
        return;
      }

      const base = slugifyHeading(heading.textContent || '') || 'section';
      let id = base;
      let i = 2;
      while (used.has(id)) {
        id = `${base}-${i++}`;
      }
      heading.setAttribute('id', id);
      used.add(id);
    });
  }

  function initTocScrollSpy({
    tocSelector = '.toc-nav',
    contentSelector = '.article-content',
    headingSelector = 'h2, h3, h4'
  } = {}) {
    const toc = document.querySelector(tocSelector);
    if (!toc) return;

    const content = document.querySelector(contentSelector) || document;
    const headingElements = Array.from(content.querySelectorAll(headingSelector));
    if (headingElements.length === 0) return;

    // Ensure heading ids exist so TOC anchors have targets.
    ensureHeadingIds(headingElements);

    const tocLinks = Array.from(toc.querySelectorAll('a[href^="#"]'));
    if (tocLinks.length === 0) return;

    const header = document.querySelector('.article-nav');

    // Smooth scroll on click with header offset (keep default anchor behavior as fallback).
    tocLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href') || '';
        const id = href.startsWith('#') ? href.slice(1) : '';
        if (!id) return;

        const target = document.getElementById(id);
        if (!target) return;

        event.preventDefault();

        const headerHeight = header?.getBoundingClientRect
          ? header.getBoundingClientRect().height
          : 0;
        const targetTop = getHeadingTopInDocument(target);
        const scrollTop = computeScrollTop({ targetTop, headerHeight });

        try {
          window.scrollTo({ top: scrollTop, behavior: 'smooth' });
          history.pushState(null, '', `#${id}`);
        } catch (e) {
          // Unsupported: fall back to default jump.
          location.hash = `#${id}`;
        }
      });
    });

    const headingMeta = headingElements.map((el) => ({
      id: el.id,
      top: getHeadingTopInDocument(el)
    }));

    const linkById = new Map();
    tocLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const id = href.startsWith('#') ? href.slice(1) : null;
      if (!id) return;
      linkById.set(id, link);
    });

    let scheduled = false;
    let activeId = null;

    const clearActive = () => {
      tocLinks.forEach((link) => {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      });
    };

    const setActive = (id) => {
      if (!id || id === activeId) return;
      activeId = id;
      clearActive();
      const link = linkById.get(id);
      if (!link) return;
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'true');
    };

    const update = () => {
      scheduled = false;

      // Recompute tops on resize/font load.
      for (let i = 0; i < headingMeta.length; i++) {
        const el = document.getElementById(headingMeta[i].id);
        if (!el) continue;
        headingMeta[i].top = getHeadingTopInDocument(el);
      }

      headingMeta.sort((a, b) => a.top - b.top);

      const id = pickActiveHeadingId({
        scrollY: window.scrollY || window.pageYOffset || 0,
        headings: headingMeta
      });
      setActive(id);
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    update();
  }

  return {
    slugifyHeading,
    pickActiveHeadingId,
    computeScrollTop,
    initTocScrollSpy
  };
});
