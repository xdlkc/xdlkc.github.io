function cleanText(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeBaseUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  return u.endsWith('/') ? u.slice(0, -1) : u;
}

function normalizeRoot(root) {
  const r = String(root || '/').trim() || '/';
  if (!r.startsWith('/')) return `/${r}`;
  return r.endsWith('/') ? r : `${r}/`;
}

function isPostPage(page = {}) {
  return page.layout === 'post' || page.type === 'post' || Boolean(page.date);
}

function joinUrl(base, pathname) {
  const b = normalizeBaseUrl(base);
  const p = String(pathname || '');
  if (!b) return '';
  if (!p) return `${b}/`;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('/')) return `${b}${p}`;
  return `${b}/${p}`;
}

function buildBreadcrumbStructuredData({
  page = {},
  site = {},
  canonicalUrl = ''
} = {}) {
  const canonical = String(canonicalUrl || '').trim();
  if (!canonical) return null;

  const base = normalizeBaseUrl(site.url);
  const root = normalizeRoot(site.root);

  const homeName = cleanText(site.title) || 'Home';
  const homeUrl = base ? joinUrl(base, root) : canonical.replace(/(\/[^/]*$)/, '/');

  const items = [];
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: homeName,
    item: homeUrl
  });

  if (isPostPage(page)) {
    const archivesUrl = base ? joinUrl(base, `${root}archives/`) : '/archives/';

    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Archives',
      item: archivesUrl
    });

    items.push({
      '@type': 'ListItem',
      position: 3,
      name: cleanText(page.title) || 'Post',
      item: canonical
    });
  } else {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: cleanText(page.title) || 'Page',
      item: canonical
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('breadcrumb_structured_data', function breadcrumbStructuredData() {
    return buildBreadcrumbStructuredData({
      page: this.page,
      site: this.config,
      canonicalUrl: this.canonical_url()
    });
  });
}

module.exports = {
  buildBreadcrumbStructuredData
};
