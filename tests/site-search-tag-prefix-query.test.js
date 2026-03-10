const test = require('node:test');
const assert = require('node:assert/strict');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

test('site-search: tag: prefix triggers tag-only search (case-insensitive, contains match)', () => {
  const posts = [
    { title: 'Hello World', path: 'hello', tags: ['FooBar'] },
    { title: 'Foo in title only', path: 'title-foo', tags: ['misc'] },
    { title: 'Other', path: 'other', tags: ['bar'] }
  ];

  const results = SiteSearch.searchPosts(posts, 'tag:foo');
  assert.equal(results.length, 1);
  assert.equal(results[0].path, 'hello');
});

test('site-search: tags: prefix is an alias of tag:', () => {
  const posts = [
    { title: 'Hello World', path: 'hello', tags: ['FooBar'] },
    { title: 'Foo in title only', path: 'title-foo', tags: ['misc'] }
  ];

  const results = SiteSearch.searchPosts(posts, 'tags: foo');
  assert.equal(results.length, 1);
  assert.equal(results[0].path, 'hello');
});

test('site-search: edge cases for tag: prefix return empty without throwing', () => {
  const posts = [
    { title: 'Hello', path: 'hello', tags: ['foo'] }
  ];

  assert.deepEqual(SiteSearch.searchPosts(posts, 'tag:'), []);
  assert.deepEqual(SiteSearch.searchPosts(posts, 'tag:   '), []);
  assert.deepEqual(SiteSearch.searchPosts(posts, '   tag:   '), []);
});
