const test = require('node:test');
const assert = require('node:assert/strict');

const SiteSearch = require('../themes/evan/source/js/site-search');

test('SiteSearch.searchPosts: category name participates in default search', () => {
  const posts = [
    {
      title: 'Hello World',
      path: '2026/01/01/hello/',
      tags: ['misc'],
      categories: ['Life']
    }
  ];

  const results = SiteSearch.searchPosts(posts, 'life');
  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Hello World');
});

test('SiteSearch.searchPosts: cat: prefix searches categories only', () => {
  const posts = [
    {
      title: 'Life hacks',
      path: '2026/01/01/life-hacks/',
      tags: ['life'],
      categories: ['Engineering']
    },
    {
      title: 'Random',
      path: '2026/01/01/random/',
      tags: ['misc'],
      categories: ['Life']
    }
  ];

  const results = SiteSearch.searchPosts(posts, 'cat: life');
  assert.equal(results.length, 1);
  assert.equal(results[0].path, '2026/01/01/random/');
});
