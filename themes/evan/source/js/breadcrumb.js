/* Visible breadcrumb navigation (Home → Archives → (Category) → current post).
 *
 * Note: JSON-LD BreadcrumbList is handled by Hexo helpers in layout.ejs.
 * This module only renders the **UI breadcrumb** on post pages.
 *
 * Exposes window.Breadcrumb in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Breadcrumb = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function lang(document) {
    return document?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
  }

  function buildBreadcrumbItems({ title, categoryName, categoryUrl } = {}) {
    const mode = lang(globalThis.document);

    const items = [
      { name: mode === 'zh' ? '首页' : 'Home', url: '/' },
      { name: mode === 'zh' ? '文章' : 'Archives', url: '/archives/' }
    ];

    const catName = String(categoryName || '').trim();
    const catUrl = String(categoryUrl || '').trim();
    if (catName && catUrl) {
      items.push({ name: catName, url: catUrl });
    }

    items.push({
      name: String(title || '').trim() || (mode === 'zh' ? '当前文章' : 'Current Post'),
      url: null
    });

    return items;
  }

  function clearElement(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }

  function renderBreadcrumb({ document, container, items } = {}) {
    const doc = document || globalThis.document;
    if (!doc || !container || !Array.isArray(items)) return;

    clearElement(container);

    container.classList.add('breadcrumb');
    container.setAttribute('aria-label', lang(doc) === 'zh' ? '面包屑导航' : 'Breadcrumb');

    const list = doc.createElement('ol');
    list.className = 'breadcrumb-list';

    items.forEach((item, idx) => {
      const li = doc.createElement('li');
      li.className = 'breadcrumb-item';

      if (item.url) {
        const a = doc.createElement('a');
        a.className = 'breadcrumb-link';
        a.href = item.url;
        a.textContent = item.name;
        li.appendChild(a);
      } else {
        const span = doc.createElement('span');
        span.className = 'breadcrumb-current';
        span.textContent = item.name;
        span.setAttribute('aria-current', 'page');
        li.appendChild(span);
      }

      list.appendChild(li);

      if (idx !== items.length - 1) {
        const sep = doc.createElement('li');
        sep.className = 'breadcrumb-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '›';
        list.appendChild(sep);
      }
    });

    container.appendChild(list);
  }

  function initBreadcrumb({ document = globalThis.document } = {}) {
    if (!document?.querySelector) return;

    const container = document.querySelector('[data-breadcrumb]');
    if (!container) return;

    // Idempotent.
    if (container.getAttribute('data-breadcrumb-inited') === '1') return;
    container.setAttribute('data-breadcrumb-inited', '1');

    const title = container.getAttribute('data-breadcrumb-title')
      || document.title
      || '当前文章';

    const categoryName = container.getAttribute('data-breadcrumb-category') || '';
    const categoryUrl = container.getAttribute('data-breadcrumb-category-url') || '';

    const items = buildBreadcrumbItems({ title, categoryName, categoryUrl });

    renderBreadcrumb({ document, container, items });
  }

  return {
    buildBreadcrumbItems,
    renderBreadcrumb,
    initBreadcrumb,
  };
});
