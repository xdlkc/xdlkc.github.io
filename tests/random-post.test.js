const test = require('node:test');
const assert = require('node:assert/strict');

const {
  selectRandomPost,
  filterAvailablePosts,
  isCurrentPost,
} = require('../themes/evan/source/js/random-post.js');

// Mock posts for testing
const mockPosts = [
  { path: '/post1', title: 'Post 1' },
  { path: '/post2', title: 'Post 2' },
  { path: '/post3', title: 'Post 3' },
  { path: '/post4', title: 'Post 4' },
  { path: '/post5', title: 'Post 5' },
];

test('isCurrentPost: correctly identifies current post', () => {
  assert.ok(isCurrentPost({ path: '/post1' }, { path: '/post1' }));
  assert.ok(isCurrentPost({ path: '/post1' }, '/post1'));
  assert.ok(!isCurrentPost({ path: '/post1' }, { path: '/post2' }));
  assert.ok(!isCurrentPost({ path: '/post1' }, '/post2'));
});

test('filterAvailablePosts: removes current post from list', () => {
  const filtered = filterAvailablePosts(mockPosts, { path: '/post1' });
  assert.equal(filtered.length, 4);
  assert.ok(filtered.every(post => post.path !== '/post1'));
});

test('filterAvailablePosts: removes current post (string path)', () => {
  const filtered = filterAvailablePosts(mockPosts, '/post1');
  assert.equal(filtered.length, 4);
  assert.ok(filtered.every(post => post.path !== '/post1'));
});

test('filterAvailablePosts: handles empty posts', () => {
  const filtered = filterAvailablePosts([], { path: '/post1' });
  assert.equal(filtered.length, 0);
});

test('filterAvailablePosts: handles currentPost not in list', () => {
  const filtered = filterAvailablePosts(mockPosts, { path: '/not-in-list' });
  assert.equal(filtered.length, 5);
});

test('selectRandomPost: returns a post from the list', () => {
  const selected = selectRandomPost(mockPosts, { path: '/not-in-list' });
  assert.ok(selected);
  assert.equal(typeof selected.path, 'string');
  assert.equal(typeof selected.title, 'string');
  assert.ok(mockPosts.some(post => post.path === selected.path));
});

test('selectRandomPost: never returns current post', () => {
  const currentPath = '/post1';
  for (let i = 0; i < 20; i++) {
    const selected = selectRandomPost(mockPosts, { path: currentPath });
    assert.ok(selected);
    assert.notEqual(selected.path, currentPath, `Iteration ${i}: Should not return current post`);
  }
});

test('selectRandomPost: returns null when no posts available', () => {
  const selected = selectRandomPost([], { path: '/post1' });
  assert.equal(selected, null);
});

test('selectRandomPost: returns null when only current post exists', () => {
  const singlePostList = [{ path: '/post1', title: 'Post 1' }];
  const selected = selectRandomPost(singlePostList, { path: '/post1' });
  assert.equal(selected, null);
});

test('selectRandomPost: returns null when currentPost is not provided', () => {
  const selected = selectRandomPost(mockPosts, null);
  assert.ok(selected); // Should still select from all posts
});
