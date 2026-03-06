// RSS browser preview via XSL.
//
// We inject an xml-stylesheet processing instruction into rss.xml so that opening
// the feed in a browser shows a readable HTML view.
//
// Why route-level injection?
// Hexo generators (incl. hexo-generator-feed) register routes in-memory first,
// then write them to public_dir. Mutating the route in `after_generate` is the
// most reliable and keeps it compatible with tests that redirect public_dir.

function injectStylesheetPI(xml) {
  const raw = String(xml || '');
  if (!raw) return raw;
  if (raw.includes('xml-stylesheet') && raw.includes('rss.xsl')) return raw;

  const pi = '<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>\n';

  const xmlDeclMatch = raw.match(/^<\?xml[^>]*\?>\s*\n?/i);
  if (xmlDeclMatch) {
    const decl = xmlDeclMatch[0];
    const rest = raw.slice(decl.length);
    return decl + pi + rest;
  }

  return pi + raw;
}

async function streamToString(stream) {
  if (stream == null) return '';
  if (typeof stream === 'string') return stream;
  if (Buffer.isBuffer(stream)) return stream.toString('utf8');

  // Hexo route.get usually returns a Readable stream.
  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

hexo.extend.filter.register('after_generate', async () => {
  const feedPath = String(hexo.config?.feed?.path || '').replace(/^\//, '');
  if (!feedPath) return;

  const routeStream = hexo.route.get(feedPath);
  if (!routeStream) return;

  const xml = await streamToString(routeStream);
  const injected = injectStylesheetPI(xml);

  if (injected !== xml) {
    hexo.route.set(feedPath, injected);
  }
});

module.exports = {
  injectStylesheetPI
};
