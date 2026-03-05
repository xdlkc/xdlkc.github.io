function cleanText(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstImageFromHtml(html) {
  const input = String(html || '');
  const match = input.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return match ? match[1].trim() : '';
}

function toAbsoluteUrl(value, siteUrl) {
  const input = String(value || '').trim();
  if (!input) return '';

  try {
    return new URL(input, siteUrl).toString();
  } catch (_) {
    return '';
  }
}

function toIso8601(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function normalizeLocale(language) {
  const input = Array.isArray(language) ? language[0] : language;
  const value = String(input || '').trim();
  if (!value) return '';

  const parts = value.replace('_', '-').split('-').filter(Boolean);
  if (parts.length === 0) return '';

  const lang = parts[0].toLowerCase();
  const region = parts[1] ? parts[1].toUpperCase() : '';
  return region ? `${lang}_${region}` : lang;
}

function detectType(page = {}) {
  if (page.layout === 'post' || page.type === 'post') return 'article';
  if (page.date) return 'article';
  return 'website';
}

function pickImage(page = {}, site = {}) {
  const candidates = [
    page.cover,
    page.thumbnail,
    firstImageFromHtml(page.content),
    '/images/avatar.jpg'
  ];

  for (const candidate of candidates) {
    const absolute = toAbsoluteUrl(candidate, site.url);
    if (absolute) {
      return {
        image: absolute,
        fromDefault: candidate === '/images/avatar.jpg'
      };
    }
  }

  return {
    image: '',
    fromDefault: true
  };
}

function buildSocialMeta({ page = {}, site = {}, canonicalUrl = '' } = {}) {
  const title = cleanText(page.title) || cleanText(site.title);
  const description =
    cleanText(page.description) ||
    cleanText(page.excerpt) ||
    cleanText(page.content) ||
    cleanText(site.description);
  const type = detectType(page);
  const { image, fromDefault } = pickImage(page, site);

  return {
    title,
    description,
    url: canonicalUrl || toAbsoluteUrl('/', site.url),
    type,
    image,
    twitterCard: fromDefault ? 'summary' : 'summary_large_image',
    locale: normalizeLocale(site.language),
    articlePublishedTime: type === 'article' ? toIso8601(page.date) : '',
    articleModifiedTime: type === 'article' ? toIso8601(page.updated) : ''
  };
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('social_meta', function socialMeta() {
    return buildSocialMeta({
      page: this.page,
      site: this.config,
      canonicalUrl: this.canonical_url()
    });
  });
}

module.exports = {
  buildSocialMeta
};
