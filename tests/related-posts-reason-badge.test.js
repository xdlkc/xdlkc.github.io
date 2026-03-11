const test = require('node:test');
const assert = require('node:assert/strict');

const { computeRelatedPostsDetailed } = require('../scripts/helpers/related-posts');

test('computeRelatedPostsDetailed: annotates each related row with reason=tags when sharedTags exists', () => {
  const posts = [
    { title: 'A', path: 'a/', date: new Date('2026-03-01'), tags: ['hexo', 'tdd'] },
    { title: 'B', path: 'b/', date: new Date('2026-03-02'), tags: ['hexo'] }
  ];

  const out = computeRelatedPostsDetailed({
    currentPost: { title: 'A', path: 'a/', tags: ['hexo', 'tdd'] },
    posts,
    limit: 6,
    sharedTagsLimit: 3,
    sharedKeywordsLimit: 3,
    fallbackRecent: false
  });

  assert.equal(out.length, 1);
  assert.equal(out[0].post.path, 'b/');
  assert.equal(out[0].reason, 'tags');
});

test('computeRelatedPostsDetailed: annotates reason=keywords when no shared tags but shared title keywords exists', () => {
  const posts = [
    { title: 'Hello OpenClaw', path: 'a/', date: new Date('2026-03-01'), tags: ['x'] },
    { title: 'OpenClaw Tips', path: 'b/', date: new Date('2026-03-02'), tags: ['y'] }
  ];

  const out = computeRelatedPostsDetailed({
    currentPost: { title: 'Hello OpenClaw', path: 'a/', tags: ['x'] },
    posts,
    limit: 6,
    sharedTagsLimit: 3,
    sharedKeywordsLimit: 3,
    fallbackRecent: false
  });

  assert.equal(out.length, 1);
  assert.equal(out[0].post.path, 'b/');
  assert.equal(out[0].reason, 'keywords');
});

test('computeRelatedPostsDetailed: annotates reason=recent for fallbackRecent rows', () => {
  const posts = [
    { title: 'Old', path: 'old/', date: new Date('2026-03-01'), tags: ['misc'] },
    { title: 'New', path: 'new/', date: new Date('2026-03-10'), tags: ['misc'] }
  ];

  const out = computeRelatedPostsDetailed({
    currentPost: { title: 'Totally Unique', path: 'current/', tags: ['unique-tag'] },
    posts,
    limit: 2,
    sharedTagsLimit: 3,
    sharedKeywordsLimit: 3,
    fallbackRecent: true
  });

  assert.equal(out.length, 2);
  out.forEach((row) => assert.equal(row.reason, 'recent'));
});
