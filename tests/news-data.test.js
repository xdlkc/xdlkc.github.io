const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { loadAndSortNews } = require('../lib/news');

test('loadAndSortNews reads news.json and sorts by publishedAt desc', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'news-data-'));
  const newsPath = path.join(dir, 'news.json');

  fs.writeFileSync(
    newsPath,
    JSON.stringify(
      [
        { id: '1', title: 'Old', url: 'https://a', publishedAt: '2026-03-05T12:00:00+08:00' },
        { id: '2', title: 'New', url: 'https://b', publishedAt: '2026-03-06T09:00:00+08:00' },
        { id: '3', title: 'Mid', url: 'https://c', publishedAt: '2026-03-06T08:00:00+08:00' }
      ],
      null,
      2
    )
  );

  const items = loadAndSortNews(newsPath);
  assert.equal(items.length, 3);
  assert.equal(items[0].id, '2');
  assert.equal(items[1].id, '3');
  assert.equal(items[2].id, '1');
});
