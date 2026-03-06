const test = require('node:test');
const assert = require('node:assert/strict');

const { computeRelatedPosts } = require('../scripts/helpers/related-posts');

test('computeRelatedPosts: ranks posts by shared tags then by date', () => {
  const posts = [
    { title: 'A', path: 'a/', date: new Date('2026-03-01'), tags: [{ name: 'Hexo' }, { name: 'TDD' }] },
    { title: 'B', path: 'b/', date: new Date('2026-03-02'), tags: [{ name: 'Hexo' }] },
    { title: 'C', path: 'c/', date: new Date('2026-03-03'), tags: [{ name: 'SEO' }, { name: 'Hexo' }] },
    { title: 'D', path: 'd/', date: new Date('2026-03-04'), tags: [{ name: 'SEO' }] }
  ];

  const related = computeRelatedPosts({
    currentPost: { path: 'a/', tags: [{ name: 'Hexo' }, { name: 'TDD' }] },
    posts,
    limit: 6
  });

  // Excludes self (A). C shares 1 tag and is newer than B, so comes first.
  assert.deepEqual(
    related.map((post) => post.title),
    ['C', 'B']
  );
});

test('computeRelatedPosts: excludes zero-overlap and returns empty when no matches', () => {
  const posts = [
    { title: 'A', path: 'a/', date: new Date('2026-03-01'), tags: ['TDD'] },
    { title: 'B', path: 'b/', date: new Date('2026-03-02'), tags: ['SEO'] }
  ];

  const related = computeRelatedPosts({
    currentPost: { path: 'a/', tags: ['TDD'] },
    posts,
    limit: 6
  });

  assert.deepEqual(related.map((post) => post.title), []);
});

test('computeRelatedPosts: handles missing tags gracefully', () => {
  const posts = [
    { title: 'A', path: 'a/', date: new Date('2026-03-01') },
    { title: 'B', path: 'b/', date: new Date('2026-03-02'), tags: ['Hexo'] }
  ];

  const related = computeRelatedPosts({
    currentPost: { path: 'a/' },
    posts,
    limit: 6
  });

  assert.deepEqual(related, []);
});
