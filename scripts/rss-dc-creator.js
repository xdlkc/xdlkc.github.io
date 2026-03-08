// Inject <dc:creator> into rss.xml items for better RSS reader compatibility.
//
// Why: some readers prefer Dublin Core creator field to show author.
//
// Implementation notes:
// - Avoid extra deps: use conservative string transforms.
// - Idempotent: if xmlns:dc or dc:creator already exists, do nothing.

const DC_NS = 'http://purl.org/dc/elements/1.1/';

function safeCdata(value) {
  // Prevent breaking CDATA. Extremely unlikely for author, but be safe.
  return String(value || '').replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function ensureDcNamespace(xml) {
  const input = String(xml || '');
  if (!input) return input;

  // Already has namespace.
  if (/\sxmlns:dc=("|')http:\/\/purl\.org\/dc\/elements\/1\.1\/("|')/i.test(input)) {
    return input;
  }

  // Insert into the <rss ...> root element.
  return input.replace(/<rss\b([^>]*)>/i, (_m, attrs) => {
    // If replace didn't match, fall back by returning original.
    return `<rss${attrs} xmlns:dc="${DC_NS}">`;
  });
}

function injectCreatorIntoItems(xml, author) {
  const input = String(xml || '');
  if (!input) return input;

  const authorText = String(author || '').trim();
  if (!authorText) return input;

  const creatorNode = `<dc:creator><![CDATA[${safeCdata(authorText)}]]></dc:creator>`;

  return input.replace(/<item>([\s\S]*?)<\/item>/gi, (match, body) => {
    if (/<dc:creator\b/i.test(body)) return match;

    // Prefer inserting after the first <title>..</title> inside item.
    const withAfterTitle = body.replace(/(<title\b[^>]*>[\s\S]*?<\/title>)/i, `$1\n      ${creatorNode}`);

    if (withAfterTitle !== body) {
      return `<item>${withAfterTitle}</item>`;
    }

    // Fallback: insert right after <item>.
    return `<item>\n      ${creatorNode}${body}</item>`;
  });
}

function injectDcCreator(xml, { author } = {}) {
  const input = String(xml || '');
  const authorText = String(author || '').trim();
  if (!input) return input;
  if (!authorText) return input;

  const withNs = ensureDcNamespace(input);
  const withCreator = injectCreatorIntoItems(withNs, authorText);
  return withCreator;
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
    const author = String(hexo.config?.author || '').trim();
    if (!feedPath || !author) return;

    const routeStream = hexo.route.get(feedPath);
    if (!routeStream) return;

    const xml = await streamToString(routeStream);
    const out = injectDcCreator(xml, { author });

    if (out !== xml) {
      hexo.route.set(feedPath, out);
    }
  });
}

module.exports = {
  injectDcCreator,
  // exported for unit tests
  safeCdata,
  ensureDcNamespace,
  injectCreatorIntoItems
};
