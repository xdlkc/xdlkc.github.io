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

test('countPostWords: ignores code and pre blocks', () => {
  const content = '<p>你好 world</p><pre><code>const x = 42;</code></pre><p>再见</p>';
  assert.equal(countPostWords(content), 5);
});

test('countPostWords: returns 0 when content is code only', () => {
  const content = '<pre><code>npm run build</code></pre>';
  assert.equal(countPostWords(content), 0);
});
