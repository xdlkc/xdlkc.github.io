const test = require('node:test');
const assert = require('node:assert/strict');
const { countPostWords } = require('../scripts/helpers/post-word-count');
const { estimateReadingMinutes } = require('../scripts/helpers/reading-time');

// Test post_word_count helper
test('post_word_count: counts Chinese characters correctly', () => {
  const content = '<p>你好世界</p>';
  const count = countPostWords(content);
  assert.strictEqual(count, 4);
});

test('post_word_count: counts English words correctly', () => {
  const content = '<p>Hello World Test</p>';
  const count = countPostWords(content);
  assert.strictEqual(count, 3);
});

test('post_word_count: counts mixed content correctly', () => {
  const content = '<p>你好 World 测试</p>';
  const count = countPostWords(content);
  assert.strictEqual(count, 5); // 2 Chinese + 3 English
});

test('post_word_count: excludes HTML tags', () => {
  const content = '<div><p>测试</p></div>';
  const count = countPostWords(content);
  assert.strictEqual(count, 2);
});

test('post_word_count: handles empty content', () => {
  const content = '';
  const count = countPostWords(content);
  assert.strictEqual(count, 0);
});

test('post_word_count: excludes code blocks', () => {
  const content = '<p>测试文本</p><pre><code>console.log("code");</code></pre>';
  const count = countPostWords(content);
  assert.strictEqual(count, 4); // Only Chinese characters from the paragraph
});

// Test post_reading_time helper
test('post_reading_time: estimates Chinese reading time correctly', () => {
  const content = '你好世界测试文章内容';
  const minutes = estimateReadingMinutes(content);
  assert.strictEqual(minutes, 1); // 8 chars / 300 = 0.027 → 1 min (ceiling)
});

test('post_reading_time: estimates English reading time correctly', () => {
  const content = 'Hello World Test This Is A Long Article';
  const minutes = estimateReadingMinutes(content);
  assert.strictEqual(minutes, 1); // 8 words / 200 = 0.04 → 1 min (ceiling)
});

test('post_reading_time: estimates mixed content correctly', () => {
  const chineseContent = '你好世界测试文章内容'.repeat(50); // 400 chars
  const englishContent = 'Hello World Test This Is A Long Article '.repeat(25); // 200 words
  const content = `<p>${chineseContent}</p><p>${englishContent}</p>`;

  const minutes = estimateReadingMinutes(content);
  // Chinese: 400 / 300 = 1.33 → 2 min (ceiling)
  // English: 200 / 200 = 1 min
  // Total: 3 min
  assert.strictEqual(minutes, 3);
});

test('post_reading_time: minimum is 1 minute', () => {
  const content = '测试';
  const minutes = estimateReadingMinutes(content);
  assert.strictEqual(minutes, 1); // Minimum 1 minute
});

test('post_reading_time: handles empty content', () => {
  const content = '';
  const minutes = estimateReadingMinutes(content);
  assert.strictEqual(minutes, 1); // Minimum 1 minute
});

test('post_reading_time: excludes code blocks from estimation', () => {
  const content = '<p>测试文本</p><pre><code>console.log("code with many words");</code></pre>';
  const minutes = estimateReadingMinutes(content);
  assert.strictEqual(minutes, 1); // Only Chinese characters from the paragraph
});
