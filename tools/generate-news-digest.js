#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { loadAndSortNews } = require('../lib/news');

function formatDateYYYYMMDD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function escapeYamlInline(s) {
  if (typeof s !== 'string') return '';
  // Minimal inline YAML escaping: wrap with quotes only when needed.
  if (/[:\n\r]/.test(s)) return JSON.stringify(s);
  return s;
}

function renderNewsItemsMd(items) {
  if (!items.length) return '_今日无新闻更新。_\n';

  return items
    .map((n) => {
      const parts = [];
      parts.push(`- **${n.title}**`);
      parts.push(`  - 时间：${n.publishedAt}`);
      if (n.source) parts.push(`  - 来源：${n.source}`);
      parts.push(`  - 链接：${n.url}`);
      if (n.summary) parts.push(`  - 摘要：${n.summary}`);
      return parts.join('\n');
    })
    .join('\n');
}

function parseExistingKeys(markdown) {
  // Collect urls and ids already present.
  const urlRe = /https?:\/\/[^\s)]+/g;
  const idRe = /^\s*-\s*ID：(.+)$/gm;

  const urls = new Set();
  const ids = new Set();

  const urlMatches = markdown.match(urlRe) || [];
  for (const u of urlMatches) urls.add(u);

  let m;
  while ((m = idRe.exec(markdown))) {
    ids.add(m[1].trim());
  }

  return { urls, ids };
}

function filterByDay(items, yyyyMMdd) {
  return items.filter((n) => String(n.publishedAt).slice(0, 10) === yyyyMMdd);
}

function buildFrontMatter({ dateStr }) {
  return [
    '---',
    `title: ${escapeYamlInline(`News Digest ${dateStr}`)}`,
    `date: ${escapeYamlInline(`${dateStr} 00:00:00 +08:00`)}`,
    'tags: [news-digest]',
    '---',
    ''
  ].join('\n');
}

function generateNewsDigest({
  newsJsonPath,
  postsDir,
  date, // YYYY-MM-DD
  now = new Date()
}) {
  if (!newsJsonPath) throw new Error('newsJsonPath required');
  if (!postsDir) throw new Error('postsDir required');

  const dateStr = date || formatDateYYYYMMDD(now);
  const filename = `news-digest-${dateStr}.md`;
  const filepath = path.join(postsDir, filename);

  const allItems = loadAndSortNews(newsJsonPath);
  const todayItems = filterByDay(allItems, dateStr);

  fs.mkdirSync(postsDir, { recursive: true });

  if (!fs.existsSync(filepath)) {
    const content =
      buildFrontMatter({ dateStr }) +
      `# News Digest ${dateStr}\n\n` +
      renderNewsItemsMd(todayItems) +
      '\n';

    fs.writeFileSync(filepath, content, 'utf8');
    return { status: 'created', filepath, addedCount: todayItems.length };
  }

  const existing = fs.readFileSync(filepath, 'utf8');
  const { urls, ids } = parseExistingKeys(existing);

  const newOnes = todayItems.filter((n) => !ids.has(n.id) && !urls.has(n.url));

  if (!newOnes.length) {
    return { status: 'skipped', filepath, addedCount: 0 };
  }

  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');

  const appendBlock =
    `\n\n## ${hh}:${mi} 更新\n\n` +
    newOnes
      .map((n) => {
        const lines = [];
        lines.push(`- **${n.title}**`);
        lines.push(`  - ID：${n.id}`);
        lines.push(`  - 时间：${n.publishedAt}`);
        if (n.source) lines.push(`  - 来源：${n.source}`);
        lines.push(`  - 链接：${n.url}`);
        if (n.summary) lines.push(`  - 摘要：${n.summary}`);
        return lines.join('\n');
      })
      .join('\n') +
    '\n';

  fs.writeFileSync(filepath, existing + appendBlock, 'utf8');
  return { status: 'appended', filepath, addedCount: newOnes.length };
}

module.exports = { generateNewsDigest };

if (require.main === module) {
  const root = path.join(__dirname, '..');
  const newsJsonPath = path.join(root, 'source', '_data', 'news.json');
  const postsDir = path.join(root, 'source', '_posts');

  const res = generateNewsDigest({ newsJsonPath, postsDir, now: new Date() });
  // eslint-disable-next-line no-console
  console.log(`[news:digest] ${res.status}: ${path.relative(root, res.filepath)} (added ${res.addedCount})`);
}
