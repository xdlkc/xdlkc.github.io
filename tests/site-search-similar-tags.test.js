const test = require('node:test');
const assert = require('node:assert/strict');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

test('suggestSimilarTags: prefers substring matches over edit-distance matches', () => {
  const allTags = ['javascript', 'typescript', 'react', 'hexo', 'css'];
  const out = SiteSearch.suggestSimilarTags(allTags, ['script']);
  // substring hit: javascript/typescript should appear
  assert.equal(out[0], 'javascript');
  assert.equal(out[1], 'typescript');
});

test('suggestSimilarTags: supports small typos via edit distance', () => {
  const allTags = ['mermaid', 'markdown', 'hexo'];
  const out = SiteSearch.suggestSimilarTags(allTags, ['markdwon']);
  assert.ok(out.includes('markdown'));
});

test('suggestSimilarTags: de-dupes case-insensitively and keeps original display casing', () => {
  const allTags = ['React', 'react', 'ReAct', 'redux'];
  const out = SiteSearch.suggestSimilarTags(allTags, ['reac']);
  // only one react-like tag
  const reactCount = out.filter(t => t.toLowerCase() === 'react').length;
  assert.equal(reactCount, 1);
  // keep first-seen casing
  assert.equal(out[0], 'React');
});

test('suggestSimilarTags: respects limit', () => {
  const allTags = ['a', 'ab', 'abc', 'abcd', 'abcde', 'abcdef', 'abcdefg', 'abcdefgh', 'abcdefghi'];
  const out = SiteSearch.suggestSimilarTags(allTags, ['abc'], { limit: 3, maxDistance: 2 });
  assert.equal(out.length, 3);
});
