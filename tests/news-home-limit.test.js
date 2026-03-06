const test = require('node:test');
const assert = require('node:assert/strict');

const { pickLatestNews } = require('../lib/news');

test('pickLatestNews only returns configured number of items (default 5 fallback)', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), publishedAt: `2026-03-${String(i + 1).padStart(2, '0')}T00:00:00+08:00` }));

  assert.equal(pickLatestNews(items, 3).length, 3);
  assert.equal(pickLatestNews(items, 0).length, 5);
  assert.equal(pickLatestNews(items, -1).length, 5);
  assert.equal(pickLatestNews(items, 'abc').length, 5);
});
