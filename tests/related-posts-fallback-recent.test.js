const test = require('node:test');
const assert = require('node:assert/strict');

const { computeRelatedPostsDetailed } = require('../scripts/helpers/related-posts');

test('computeRelatedPostsDetailed: when enabled, falls back to recent posts if no related matches', () => {
  const posts = [
    { title: 'Old one', path: 'old/', date: new Date('2026-03-01'), tags: ['misc'] },
    { title: 'Newer one', path: 'newer/', date: new Date('2026-03-09'), tags: ['misc'] },
    { title: 'Newest one', path: 'newest/', date: new Date('2026-03-10'), tags: ['misc'] }
  ];

  const out = computeRelatedPostsDetailed({
    currentPost: {
      title: 'Totally Unique Title That Matches Nothing',
      path: 'current/',
      tags: ['unique-tag']
    },
    posts,
    limit: 2,
    sharedTagsLimit: 3,
    sharedKeywordsLimit: 3,
    fallbackRecent: true
  });

  // No tag overlap + no shared title tokens (STOP_WORDS filtered, min length etc.),
  // so we expect the fallback list sorted by date desc.
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((row) => row.post.path), ['newest/', 'newer/']);
  out.forEach((row) => {
    assert.deepEqual(row.sharedTags, []);
    assert.deepEqual(row.sharedKeywords, []);
  });
});

