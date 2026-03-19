const { buildBreadcrumbStructuredData } = require('./breadcrumb-structured-data');

function cleanText(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIso8601(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function isPostPage(page = {}) {
  return page.layout === 'post' || page.type === 'post' || Boolean(page.date);
}

function buildStructuredData({
  page = {},
  site = {},
  canonicalUrl = '',
  image = '',
  wordCount
} = {}) {
  if (!isPostPage(page)) return null;

  const headline = cleanText(page.title) || cleanText(site.title);
  const description =
    cleanText(page.description) || cleanText(page.excerpt) || cleanText(page.content);
  const datePublished = toIso8601(page.date);
  const dateModified = toIso8601(page.updated);

  const result = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Person',
      name: cleanText(site.author) || cleanText(site.title)
    }
  };

  if (description) result.description = description;
  if (image) result.image = [image];
  if (datePublished) result.datePublished = datePublished;
  if (dateModified) result.dateModified = dateModified;
  if (Number.isFinite(wordCount) && wordCount > 0) result.wordCount = wordCount;

  // Add BreadcrumbList if available
  const breadcrumbList = buildBreadcrumbStructuredData({
    page,
    site,
    canonicalUrl
  });
  if (breadcrumbList) {
    result.breadcrumbList = breadcrumbList;
  }

  return result;
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('structured_data', function structuredData() {
    const social = this.social_meta();
    const image = social ? social.image : '';

    return buildStructuredData({
      page: this.page,
      site: this.config,
      canonicalUrl: this.canonical_url(),
      image: image,
      wordCount: this.post_word_count(this.page && this.page.content)
    });
  });
}

module.exports = {
  buildStructuredData
};
