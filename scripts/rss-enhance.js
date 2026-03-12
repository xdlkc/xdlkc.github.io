/* RSS post-processing for better compatibility.
 *
 * Enhancements:
 * - Ensure <rss> contains atom/dc namespaces
 * - Ensure <channel> contains <atom:link rel="self" ...>
 * - Ensure each <item> has <dc:creator> (when author is configured)
 *
 * Hexo loads /scripts/*.js automatically; we register an after_generate hook.
 *
 * This file also exports enhanceRssXml() for Node unit tests.
 */

const fs = require('node:fs');
const path = require('node:path');

const ATOM_NS = 'http://www.w3.org/2005/Atom';
const DC_NS = 'http://purl.org/dc/elements/1.1/';

function escapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureNamespace(xml, { prefix, uri } = {}) {
  const p = String(prefix || '').trim();
  const u = String(uri || '').trim();
  if (!p || !u) return xml;

  const re = new RegExp(`xmlns:${p}="[^"]*"`);
  if (re.test(xml)) return xml;

  // Insert into <rss ...> opening tag.
  return xml.replace(/<rss\b([^>]*)>/i, (full, attrs) => {
    // Avoid duplicating if already present (case-insensitive).
    if (new RegExp(`xmlns:${p}=`,'i').test(attrs)) return full;
    return `<rss${attrs} xmlns:${p}="${u}">`;
  });
}

function buildFeedSelfHref({ siteUrl, root = '/', feedPath = 'rss.xml' } = {}) {
  const base = String(siteUrl || '').replace(/\/+$/, '');
  if (!base) return '';

  const rootClean = String(root || '/');
  const rootPath = rootClean.startsWith('/') ? rootClean : `/${rootClean}`;
  const rootNorm = rootPath === '/' ? '/' : rootPath.replace(/\/+$/, '/')

  const fp = String(feedPath || 'rss.xml').replace(/^\/+/, '');
  return `${base}${rootNorm}${fp}`;
}

function ensureChannelAtomSelfLink(xml, { href } = {}) {
  const safeHref = String(href || '').trim();
  if (!safeHref) return xml;

  if (/<atom:link\b[^>]*rel="self"/i.test(xml)) return xml;

  const atomLink = `    <atom:link href="${escapeXml(safeHref)}" rel="self" type="application/rss+xml" />`;

  // Insert right after <channel> if possible.
  if (/<channel>\s*/i.test(xml)) {
    return xml.replace(/<channel>\s*/i, (m) => `${m}${atomLink}\n`);
  }

  return xml;
}

function ensureItemCreators(xml, { author } = {}) {
  const a = String(author || '').trim();
  if (!a) return xml;

  const safeAuthor = escapeXml(a);

  // Replace each <item>...</item> block.
  return xml.replace(/<item>([\s\S]*?)<\/item>/gi, (full, body) => {
    if (/<dc:creator\b/i.test(body)) return full;

    // Prefer insert after <title>..</title> inside item.
    if (/<title>[^<]*<\/title>/i.test(body)) {
      const injected = body.replace(/(<title>[\s\S]*?<\/title>\s*)/i, `$1      <dc:creator>${safeAuthor}</dc:creator>\n`);
      return `<item>${injected}</item>`;
    }

    // Fallback: insert at top of item body.
    return `<item>\n      <dc:creator>${safeAuthor}</dc:creator>\n${body}</item>`;
  });
}

function ensureItemGuids(xml) {
  const out = String(xml || '');
  if (!out) return out;

  // Replace each <item>...</item> block.
  return out.replace(/<item>([\s\S]*?)<\/item>/gi, (full, body) => {
    // Already has guid.
    if (/<guid\b/i.test(body)) return full;

    // Must have <link>...</link> to use as permalink.
    const m = body.match(/<link>([\s\S]*?)<\/link>/i);
    if (!m) return full;

    const linkValue = String(m[1] || '').trim();
    if (!linkValue) return full;

    const guidNode = `      <guid isPermaLink="true">${escapeXml(linkValue)}</guid>`;

    // Prefer insert right after <link>..</link>.
    const injected = body.replace(/(<link>[\s\S]*?<\/link>\s*)/i, `$1${guidNode}\n`);
    return `<item>${injected}</item>`;
  });
}

function enhanceRssXml(xml, { siteUrl, root = '/', feedPath = 'rss.xml', author } = {}) {
  let out = String(xml || '');
  if (!out) return out;

  out = ensureNamespace(out, { prefix: 'atom', uri: ATOM_NS });
  out = ensureNamespace(out, { prefix: 'dc', uri: DC_NS });

  const href = buildFeedSelfHref({ siteUrl, root, feedPath });
  out = ensureChannelAtomSelfLink(out, { href });

  out = ensureItemCreators(out, { author });
  out = ensureItemGuids(out);

  return out;
}

function registerHexoHook(hexo) {
  if (!hexo?.extend?.filter?.register) return;

  hexo.extend.filter.register('after_generate', () => {
    const cfg = hexo.config || {};
    const feed = cfg.feed || {};
    const publicDir = hexo.public_dir || path.join(hexo.base_dir || process.cwd(), 'public');
    const feedPath = typeof feed.path === 'string' && feed.path.trim() ? feed.path.trim() : 'rss.xml';

    const target = path.join(publicDir, feedPath);
    if (!fs.existsSync(target)) return;

    const raw = fs.readFileSync(target, 'utf8');
    const enhanced = enhanceRssXml(raw, {
      siteUrl: cfg.url || '',
      root: cfg.root || '/',
      feedPath,
      author: cfg.author || ''
    });

    if (enhanced !== raw) {
      fs.writeFileSync(target, enhanced, 'utf8');
    }
  });
}

// Hexo runtime: `hexo` is a global injected by Hexo.
try {
  if (typeof hexo !== 'undefined') {
    registerHexoHook(hexo);
  }
} catch {
  // ignore (node tests)
}

module.exports = {
  ATOM_NS,
  DC_NS,
  escapeXml,
  ensureNamespace,
  buildFeedSelfHref,
  ensureChannelAtomSelfLink,
  ensureItemCreators,
  ensureItemGuids,
  enhanceRssXml,
  registerHexoHook,
};
