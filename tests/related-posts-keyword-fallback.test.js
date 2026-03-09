const test = require('node:test');
const assert = require('node:assert/strict');

const { computeRelatedPostsDetailed } = require('../scripts/helpers/related-posts');

test('computeRelatedPostsDetailed: falls back to shared title keywords when tags do not overlap', () => {
  const posts = [
    {
      title: 'Hexo Search Highlight Guide',
      path: 'search-highlight/',
      date: new Date('2026-03-09'),
      tags: ['Search']
    },
    {
      title: 'RSS Feed Tweaks',
      path: 'rss-feed/',
      date: new Date('2026-03-08'),
      tags: ['RSS']
    }
  ];

  const out = computeRelatedPostsDetailed({
    currentPost: {
      title: 'Search Highlight Patterns',
      path: 'current/',
      tags: ['UI']
    },
    posts,
    limit: 6,
    sharedTagsLimit: 3
  });

  assert.equal(out.length, 1);
  assert.equal(out[0].post.title, 'Hexo Search Highlight Guide');
  assert.deepEqual(out[0].sharedTags, []);
  assert.deepEqual(out[0].sharedKeywords, ['highlight', 'search']);
});

test('computeRelatedPostsDetailed: prefers shared tags over keyword-only fallback matches', () => {
  const posts = [
    {
      title: 'Search Highlight Guide',
      path: 'keywords/',
      date: new Date('2026-03-09'),
      tags: ['UX']
    },
    {
      title: 'Search UX Patterns',
      path: 'tags/',
      date: new Date('2026-03-08'),
      tags: ['Search']
    }
  ];

  const out = computeRelatedPostsDetailed({
    currentPost: {
      title: 'Search Highlight Patterns',
      path: 'current/',
      tags: ['Search']
    },
    posts,
    limit: 6,
    sharedTagsLimit: 3
  });

  assert.deepEqual(out.map((row) => row.post.path), ['tags/', 'keywords/']);
});
