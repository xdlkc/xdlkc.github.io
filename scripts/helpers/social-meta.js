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
    twitterCard: fromDefault ? 'summary' : 'summary_large_image'
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
