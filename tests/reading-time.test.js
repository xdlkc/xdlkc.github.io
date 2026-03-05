const test = require('node:test');
const assert = require('node:assert/strict');

const { estimateReadingMinutes } = require('../scripts/helpers/reading-time');

test('estimateReadingMinutes: counts Chinese chars at 300 chars/min', () => {
  const content = '你'.repeat(600);
  assert.equal(estimateReadingMinutes(content), 2);
});

test('estimateReadingMinutes: counts English words at 200 words/min', () => {
  const content = Array.from({ length: 201 }, () => 'word').join(' ');
  assert.equal(estimateReadingMinutes(content), 2);
});

test('estimateReadingMinutes: strips HTML and defaults to 1 minute for empty content', () => {
  assert.equal(estimateReadingMinutes('<p><br/></p>'), 1);
});
