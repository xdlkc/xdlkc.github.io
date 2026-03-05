const test = require('node:test');
const assert = require('node:assert/strict');

const { countPostWords } = require('../scripts/helpers/post-word-count');

test('countPostWords: counts Chinese chars as 1 each', () => {
  assert.equal(countPostWords('你'.repeat(12)), 12);
});

test('countPostWords: counts English tokens split by spaces', () => {
  const content = 'hello world 2026';
  assert.equal(countPostWords(content), 3);
});

test('countPostWords: strips HTML before counting', () => {
  const content = '<p>你好 <strong>hello world</strong></p>';
  assert.equal(countPostWords(content), 4);
});

test('countPostWords: returns 0 for empty content', () => {
  assert.equal(countPostWords('<p><br/></p>'), 0);
});
