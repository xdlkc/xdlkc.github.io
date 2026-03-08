const test = require('node:test');
const assert = require('node:assert/strict');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

test('site-search: #tag query matches only tags (case-insensitive, contains match)', () => {
  const posts = [
    { title: 'Hello World', path: 'hello', tags: ['FooBar'] },
    { title: 'Foo in title only', path: 'title-foo', tags: ['misc'] },
    { title: 'Other', path: 'other', tags: ['bar'] }
  ];

  const results = SiteSearch.searchPosts(posts, '#foo');
  assert.equal(results.length, 1);
  assert.equal(results[0].path, 'hello');
});

test('site-search: normal query still matches title', () => {
  const posts = [
    { title: 'Foo in title', path: 'title-foo', tags: ['misc'] },
    { title: 'Other', path: 'other', tags: ['bar'] }
  ];

  const results = SiteSearch.searchPosts(posts, 'foo');
  assert.equal(results.length, 1);
  assert.equal(results[0].path, 'title-foo');
});

test('site-search: edge cases for #tag query return empty without throwing', () => {
  const posts = [
    { title: 'Hello', path: 'hello', tags: ['foo'] }
  ];

  assert.deepEqual(SiteSearch.searchPosts(posts, '#'), []);
  assert.deepEqual(SiteSearch.searchPosts(posts, '#   '), []);
  assert.deepEqual(SiteSearch.searchPosts(posts, '   #   '), []);
});
