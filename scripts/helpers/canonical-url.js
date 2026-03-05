function stripQueryAndHash(urlString) {
  const url = new URL(urlString);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function buildCanonicalUrl({ siteUrl, pagePath }) {
  const normalizedSiteUrl = siteUrl || '/';
  const normalizedPagePath = pagePath || '/';

  const isAbsolute = /^https?:\/\//i.test(normalizedPagePath);

  if (isAbsolute) {
    return stripQueryAndHash(normalizedPagePath);
  }

  const canonical = new URL(normalizedPagePath, normalizedSiteUrl).toString();
  return stripQueryAndHash(canonical);
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('canonical_url', function canonicalUrl() {
    return buildCanonicalUrl({
      siteUrl: this.config.url,
      pagePath: this.path || '/'
    });
  });
}

module.exports = {
  buildCanonicalUrl
};
