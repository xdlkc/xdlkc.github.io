const test = require('node:test');
const assert = require('node:assert/strict');
const { computeRelatedPosts, computeRelatedPostsDetailed } = require('../scripts/helpers/related-posts.js');

test('related-posts-helper: no tags returns empty array', () => {
  const current = { title: 'Post A', path: '/a/', tags: [] };
  const all = [
    { title: 'Post B', path: '/b/', tags: ['foo'], date: '2024-01-02' }
  ];

  const result = computeRelatedPosts({ currentPost: current, posts: all });
  assert.strictEqual(result.length, 0);
});

test('related-posts-helper: current post excluded from results', () => {
  const current = { title: 'Post A', path: '/a/', tags: ['tag1'], date: '2024-01-01' };
  const all = [
    { title: 'Post A', path: '/a/', tags: ['tag1'], date: '2024-01-01' },
    { title: 'Post B', path: '/b/', tags: ['tag1'], date: '2024-01-02' }
  ];

  const result = computeRelatedPosts({ currentPost: current, posts: all });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].title, 'Post B');
});

test('related-posts-helper: score based on shared tag count', () => {
  const current = { title: 'Post A', path: '/a/', tags: ['tag1', 'tag2', 'tag3'], date: '2024-01-01' };
  const all = [
    { title: 'Post B', path: '/b/', tags: ['tag1', 'tag2'], date: '2024-01-02' },
    { title: 'Post C', path: '/c/', tags: ['tag1'], date: '2024-01-03' },
    { title: 'Post D', path: '/d/', tags: ['tag1', 'tag2', 'tag3'], date: '2024-01-04' }
  ];

  const result = computeRelatedPostsDetailed({ currentPost: current, posts: all });
  assert.strictEqual(result.length, 3);

  // Post D shares 3 tags
  assert.strictEqual(result[0].post.title, 'Post D');
  assert.strictEqual(result[0].sharedTags.length, 3);
  assert.strictEqual(result[0].reason, 'tags');

  // Post B shares 2 tags
  assert.strictEqual(result[1].post.title, 'Post B');
  assert.strictEqual(result[1].sharedTags.length, 2);

  // Post C shares 1 tag
  assert.strictEqual(result[2].post.title, 'Post C');
  assert.strictEqual(result[2].sharedTags.length, 1);
});

test('related-posts-helper: case-insensitive tag matching', () => {
  const current = { title: 'Post A', path: '/a/', tags: ['JavaScript', 'Docker'], date: '2024-01-01' };
  const all = [
    { title: 'Post B', path: '/b/', tags: ['javascript'], date: '2024-01-02' },
    { title: 'Post C', path: '/c/', tags: ['DOCKER'], date: '2024-01-03' }
  ];

  const result = computeRelatedPostsDetailed({ currentPost: current, posts: all });
  assert.strictEqual(result.length, 2);

  const postBResult = result.find(r => r.post.title === 'Post B');
  const postCResult = result.find(r => r.post.title === 'Post C');

  const tagsB = postBResult.sharedTags.map(t => t.toLowerCase());
  const tagsC = postCResult.sharedTags.map(t => t.toLowerCase());

  assert.ok(tagsB.includes('javascript'));
  assert.ok(tagsC.includes('docker'));
});

test('related-posts-helper: returns empty when no shared tags', () => {
  const current = { title: 'Alpha', path: '/a/', tags: ['tag1'], date: '2024-01-01' };
  const all = [
    { title: 'Beta', path: '/b/', tags: ['tag2'], date: '2024-01-02' },
    { title: 'Gamma', path: '/c/', tags: ['tag3'], date: '2024-01-03' }
  ];

  const result = computeRelatedPostsDetailed({ currentPost: current, posts: all });
  assert.strictEqual(result.length, 0);
});

test('related-posts-helper: fallback to recent when enabled', () => {
  const current = { title: 'Alpha', path: '/a/', tags: [], date: '2024-01-01' };
  const all = [
    { title: 'Beta', path: '/b/', tags: ['foo'], date: '2024-01-02' },
    { title: 'Gamma', path: '/c/', tags: ['bar'], date: '2024-01-03' }
  ];

  const resultWithoutFallback = computeRelatedPostsDetailed({
    currentPost: current,
    posts: all,
    fallbackRecent: false
  });
  assert.strictEqual(resultWithoutFallback.length, 0);

  const resultWithFallback = computeRelatedPostsDetailed({
    currentPost: current,
    posts: all,
    fallbackRecent: true
  });
  assert.strictEqual(resultWithFallback.length, 2);
  assert.strictEqual(resultWithFallback[0].reason, 'recent');
  assert.strictEqual(resultWithFallback[0].post.title, 'Gamma'); // latest date
});

test('related-posts-helper: respects limit parameter', () => {
  const current = { title: 'Post A', path: '/a/', tags: ['tag1'], date: '2024-01-01' };
  const all = [];
  for (let i = 1; i <= 10; i++) {
    all.push({
      title: `Post ${String.fromCharCode(65 + i)}`,
      path: `/${i}/`,
      tags: ['tag1'],
      date: `2024-01-${String(i + 1).padStart(2, '0')}`
    });
  }

  const result = computeRelatedPostsDetailed({ currentPost: current, posts: all, limit: 5 });
  assert.strictEqual(result.length, 5);
});

test('related-posts-helper: handles tag objects with name property', () => {
  const current = { title: 'Post A', path: '/a/', tags: [{ name: 'JavaScript' }, { name: 'Docker' }], date: '2024-01-01' };
  const all = [
    { title: 'Post B', path: '/b/', tags: [{ name: 'javascript' }], date: '2024-01-02' }
  ];

  const result = computeRelatedPostsDetailed({ currentPost: current, posts: all });
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].sharedTags.some(t => t.toLowerCase() === 'javascript'));
});
