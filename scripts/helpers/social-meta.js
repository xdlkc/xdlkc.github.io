const path = require('node:path');

const { inferMimeTypeFromPath, readImageSizeFromFile } = require('./image-dimensions');

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

function isSameOrigin(urlA, urlB) {
  try {
    const a = new URL(urlA);
    const b = new URL(urlB);
    return a.origin === b.origin;
  } catch (_) {
    return false;
  }
}

function safeResolveLocalFile({ imageUrl, siteUrl, rootDir }) {
  const base = String(rootDir || '').trim();
  if (!base) return '';

  const image = String(imageUrl || '').trim();
  if (!image) return '';

  let pathname = '';

  // Only resolve local assets:
  // - root-relative (/images/xx)
  // - same-origin absolute URLs (https://site/...)
  if (image.startsWith('/')) {
    pathname = image;
  } else if (siteUrl && isSameOrigin(image, siteUrl)) {
    try {
      pathname = new URL(image).pathname;
    } catch (_) {
      pathname = '';
    }
  }

  if (!pathname) return '';

  // Only consider common static assets directory.
  if (!pathname.startsWith('/images/')) return '';

  const resolved = path.resolve(base, pathname.replace(/^\/+/, ''));
  const rootResolved = path.resolve(base);

  // Prevent path traversal.
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) return '';

  return resolved;
}

function computeImageMeta({ imageUrl, rootDir, siteUrl }) {
  const imageType = inferMimeTypeFromPath(imageUrl);

  const filepath = safeResolveLocalFile({ imageUrl, rootDir, siteUrl });
  if (!filepath) {
    return {
      imageType,
      imageWidth: 0,
      imageHeight: 0
    };
  }

  const { width, height, type } = readImageSizeFromFile(filepath);

  return {
    imageType: type || imageType,
    imageWidth: Number.isInteger(width) ? width : 0,
    imageHeight: Number.isInteger(height) ? height : 0
  };
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

function normalizeArticleTags(tags, limit = 5) {
  if (!tags) return [];

  const raw = Array.isArray(tags)
    ? tags
    : Array.isArray(tags.data)
      ? tags.data
      : [];

  const seen = new Set();
  const result = [];

  for (const tag of raw) {
    const name = cleanText(typeof tag === 'string' ? tag : tag && tag.name);
    if (!name) continue;
    if (seen.has(name)) continue;

    seen.add(name);
    result.push(name);

    if (result.length >= limit) break;
  }

  return result;
}

function firstPhotoFromPhotosField(photos) {
  if (!photos) return '';
  if (typeof photos === 'string') return photos;
  if (Array.isArray(photos)) return String(photos[0] || '').trim();

  // Some Hexo plugins might store { data: [...] }.
  if (Array.isArray(photos.data)) return String(photos.data[0] || '').trim();

  return '';
}

function pickImage(page = {}, site = {}) {
  const candidates = [
    // Explicit Open Graph image fields (front-matter) should win.
    page.og_image,
    page.ogImage,
    page.open_graph_image,
    page.openGraphImage,
    // Theme-level cover should keep higher priority.
    page.cover,
    // Common front-matter fields used by many themes.
    page.image,
    page.featured_image,
    page.featuredImage,
    page.thumbnail,
    page.banner,
    firstPhotoFromPhotosField(page.photos),
    firstPhotoFromPhotosField(page.photo),
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

function pickImageAlt(page = {}, { fallbackText = '' } = {}) {
  const candidates = [
    page.og_image_alt,
    page.ogImageAlt,
    page.image_alt,
    page.imageAlt
  ];

  for (const candidate of candidates) {
    const value = cleanText(candidate);
    if (value) return value;
  }

  // Fallback: use a human-readable title when author didn't provide alt.
  // This improves share card accessibility without changing image selection logic.
  const fallback = cleanText(fallbackText);
  return fallback || '';
}

function buildSocialMeta({ page = {}, site = {}, canonicalUrl = '', rootDir = '' } = {}) {
  const title = cleanText(page.title) || cleanText(site.title);
  const description =
    cleanText(page.description) ||
    cleanText(page.excerpt) ||
    cleanText(page.content) ||
    cleanText(site.description);
  const type = detectType(page);
  const { image, fromDefault } = pickImage(page, site);

  // If author didn't provide an explicit alt, fall back to a reasonable title.
  // - article pages: use post title
  // - non-article pages: use site title
  const fallbackAlt = type === 'article'
    ? cleanText(page.title)
    : cleanText(site.title);

  const imageAlt = image
    ? pickImageAlt(page, { fallbackText: fallbackAlt })
    : '';

  const articleTags = type === 'article' ? normalizeArticleTags(page.tags) : [];

  const { imageType, imageWidth, imageHeight } = image
    ? computeImageMeta({ imageUrl: image, rootDir, siteUrl: site.url })
    : { imageType: '', imageWidth: 0, imageHeight: 0 };

  let imageSecureUrl = '';
  if (image) {
    try {
      const u = new URL(image);
      if (u.protocol === 'https:') imageSecureUrl = u.toString();
    } catch {
      imageSecureUrl = '';
    }
  }

  return {
    title,
    description,
    // og:site_name
    siteName: cleanText(site.title),
    url: canonicalUrl || toAbsoluteUrl('/', site.url),
    type,
    image,
    imageSecureUrl,
    imageAlt,
    imageType,
    imageWidth,
    imageHeight,
    twitterCard: fromDefault ? 'summary' : 'summary_large_image',
    locale: normalizeLocale(site.language),
    articlePublishedTime: type === 'article' ? toIso8601(page.date) : '',
    articleModifiedTime: type === 'article' ? toIso8601(page.updated) : '',
    articleTags
  };
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('social_meta', function socialMeta() {
    return buildSocialMeta({
      page: this.page,
      site: this.config,
      canonicalUrl: this.canonical_url(),
      rootDir: hexo.base_dir
    });
  });
}

module.exports = {
  buildSocialMeta,
  toAbsoluteUrl
};
