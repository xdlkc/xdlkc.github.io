// Enhance rss.xml by injecting media:thumbnail for RSS readers.
//
// Why after_generate?
// Similar to rss-stylesheet.js: Hexo generators register routes in-memory. We
// mutate the route output so the final public/rss.xml includes the enhancement.

const MEDIA_NS = 'http://search.yahoo.com/mrss/';

function ensureMediaNamespace(xml) {
  const raw = String(xml || '');
  if (!raw) return raw;

  // If already present, keep unchanged.
  if (/\bxmlns:media=/.test(raw)) return raw;

  // Add to the <rss ...> start tag.
  // We only touch the first <rss ...> tag to keep it safe.
  return raw.replace(/<rss\b([^>]*)>/i, (match, attrs) => {
    // attrs includes leading spaces/newlines, keep formatting.
    return `<rss${attrs} xmlns:media="${MEDIA_NS}">`;
  });
}

function extractFirstImageUrlFromItem(itemXml) {
  const item = String(itemXml || '');
  if (!item) return '';

  // Prefer content:encoded (already HTML).
  const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i);
  const content = contentMatch ? contentMatch[1] : '';
  if (!content) return '';

  const imgMatch = content.match(/<img\b[^>]*\bsrc=("([^"]+)"|'([^']+)')[^>]*>/i);
  if (!imgMatch) return '';

  return (imgMatch[2] || imgMatch[3] || '').trim();
}

function itemHasThumbnail(itemXml) {
  return /<media:thumbnail\b/i.test(String(itemXml || ''));
}

function itemHasMediaContent(itemXml) {
  return /<media:content\b/i.test(String(itemXml || ''));
}

function extractEnclosureUrlFromItem(itemXml) {
  const item = String(itemXml || '');
  if (!item) return '';

  // Typical: <enclosure url="..." type="image/png" />
  const m = item.match(/<enclosure\b[^>]*\burl=("([^"]+)"|'([^']+)')[^>]*>/i);
  if (!m) return '';
  return (m[2] || m[3] || '').trim();
}

function injectMediaIntoItem(itemXml, url) {
  const item = String(itemXml || '');
  const safeUrl = String(url || '').trim();
  if (!item) return item;
  if (!safeUrl) return item;

  // Idempotent: only inject missing pieces.
  const needThumb = !itemHasThumbnail(item);
  const needContent = !itemHasMediaContent(item);
  if (!needThumb && !needContent) return item;

  const lines = [];
  if (needContent) lines.push(`      <media:content url="${safeUrl}" medium="image" />`);
  if (needThumb) lines.push(`      <media:thumbnail url="${safeUrl}" />`);

  return item.replace(/\s*<\/item>\s*$/i, () => {
    const newline = item.includes('\n') ? '\n' : '';
    return `${newline}${lines.join(newline)}${newline}    </item>`;
  });
}

function enhanceRssXml(xml) {
  let out = ensureMediaNamespace(xml);

  // Process each <item>...</item> block.
  out = out.replace(/<item>([\s\S]*?)<\/item>/gi, (full) => {
    // Prefer explicit enclosure (cover image) when present.
    const enclosureUrl = extractEnclosureUrlFromItem(full);
    const url = enclosureUrl || extractFirstImageUrlFromItem(full);
    if (!url) return full;
    return injectMediaIntoItem(full, url);
  });

  return out;
}

async function streamToString(stream) {
  if (stream == null) return '';
  if (typeof stream === 'string') return stream;
  if (Buffer.isBuffer(stream)) return stream.toString('utf8');

  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.filter) {
  hexo.extend.filter.register('after_generate', async () => {
    const feedPath = String(hexo.config?.feed?.path || '').replace(/^\//, '');
    if (!feedPath) return;

    const routeStream = hexo.route.get(feedPath);
    if (!routeStream) return;

    const xml = await streamToString(routeStream);
    const enhanced = enhanceRssXml(xml);

    if (enhanced !== xml) {
      hexo.route.set(feedPath, enhanced);
    }
  });
}

module.exports = {
  MEDIA_NS,
  ensureMediaNamespace,
  extractFirstImageUrlFromItem,
  enhanceRssXml,
  // exported for tests
  extractEnclosureUrlFromItem
};
