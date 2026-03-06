const fs = require('node:fs');

function toTime(publishedAt) {
  const t = new Date(publishedAt).getTime();
  if (!Number.isFinite(t)) throw new Error(`Invalid publishedAt: ${publishedAt}`);
  return t;
}

function normalizeNewsItem(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid news item');
  const { id, title, url, publishedAt } = raw;
  if (!id || typeof id !== 'string') throw new Error('news item missing id');
  if (!title || typeof title !== 'string') throw new Error(`news item ${id} missing title`);
  if (!url || typeof url !== 'string') throw new Error(`news item ${id} missing url`);
  if (!publishedAt || typeof publishedAt !== 'string') throw new Error(`news item ${id} missing publishedAt`);

  // Validate date parse
  toTime(publishedAt);

  return {
    id,
    title,
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    url,
    source: typeof raw.source === 'string' ? raw.source : '',
    publishedAt,
    importance: Number.isFinite(raw.importance) ? raw.importance : undefined,
    region: raw.region
  };
}

function loadAndSortNews(newsJsonPath) {
  const text = fs.readFileSync(newsJsonPath, 'utf8');
  const arr = JSON.parse(text);
  if (!Array.isArray(arr)) throw new Error('news.json must be an array');

  const items = arr.map(normalizeNewsItem);
  items.sort((a, b) => toTime(b.publishedAt) - toTime(a.publishedAt));
  return items;
}

function normalizeLimit(limit, fallback = 5) {
  const n = typeof limit === 'string' ? Number(limit) : limit;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function pickLatestNews(newsItems, limit) {
  const n = normalizeLimit(limit, 5);
  return (Array.isArray(newsItems) ? newsItems : []).slice(0, n);
}

module.exports = {
  loadAndSortNews,
  pickLatestNews,
  normalizeLimit
};
