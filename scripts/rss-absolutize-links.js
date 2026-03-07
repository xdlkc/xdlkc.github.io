// Enhance rss.xml by converting root-relative href/src URLs to absolute URLs.
//
// Problem: RSS readers render the feed outside the site origin; root-relative
// URLs like /images/a.png break.
//
// Implementation: after_generate filter mutates the generated route output.

function toAbsoluteRootRelativeUrl(value, siteUrl) {
  const raw = String(value || '').trim();
  const base = String(siteUrl || '').trim();

  if (!raw) return '';
  if (!base) return raw;

  // Only rewrite root-relative URLs.
  if (!raw.startsWith('/')) return raw;

  // Avoid //example.com (protocol-relative): keep as-is.
  if (raw.startsWith('//')) return raw;

  try {
    return new URL(raw, base).toString();
  } catch (_) {
    return raw;
  }
}

function absolutizeRssXml(xml, siteUrl) {
  const input = String(xml || '');
  if (!input) return input;

  // We only rewrite href/src attributes whose value starts with '/'.
  // Keep other schemes (http(s), mailto, data, etc.) unchanged.
  return input
    .replace(/\bhref=("|')\/(?!\/)([^"']*)(\1)/gi, (_m, quote, rest, q2) => {
      const absolute = toAbsoluteRootRelativeUrl(`/${rest}`, siteUrl);
      return `href=${quote}${absolute}${q2}`;
    })
    .replace(/\bsrc=("|')\/(?!\/)([^"']*)(\1)/gi, (_m, quote, rest, q2) => {
      const absolute = toAbsoluteRootRelativeUrl(`/${rest}`, siteUrl);
      return `src=${quote}${absolute}${q2}`;
    });
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
    const siteUrl = String(hexo.config?.url || '').trim();
    if (!feedPath || !siteUrl) return;

    const routeStream = hexo.route.get(feedPath);
    if (!routeStream) return;

    const xml = await streamToString(routeStream);
    const out = absolutizeRssXml(xml, siteUrl);

    if (out !== xml) {
      hexo.route.set(feedPath, out);
    }
  });
}

module.exports = {
  toAbsoluteRootRelativeUrl,
  absolutizeRssXml
};
