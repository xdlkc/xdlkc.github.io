const test = require('node:test');
const assert = require('node:assert/strict');

const { computeRelatedPostsDetailed } = require('../scripts/helpers/related-posts');

test('computeRelatedPostsDetailed: returns sharedTags (intersection) and truncates to 3 sorted tags', () => {
  const posts = [
    {
      title: 'A',
      path: 'a/',
      date: new Date('2026-03-01'),
      tags: [{ name: 'Hexo' }, { name: 'TDD' }, { name: 'JavaScript' }, { name: 'SEO' }]
    },
    {
      title: 'B',
      path: 'b/',
      date: new Date('2026-03-02'),
      tags: [{ name: 'Hexo' }, { name: 'SEO' }, { name: 'Zzz' }, { name: 'TDD' }]
    },
  ];

  const out = computeRelatedPostsDetailed({
    currentPost: { path: 'a/', tags: [{ name: 'Hexo' }, { name: 'TDD' }, { name: 'SEO' }, { name: 'JavaScript' }] },
    posts,
    limit: 6,
  });

  assert.equal(out.length, 1);
  assert.equal(out[0].post.title, 'B');

  // sorted + truncated to 3
  assert.deepEqual(out[0].sharedTags, ['Hexo', 'SEO', 'TDD']);
});

