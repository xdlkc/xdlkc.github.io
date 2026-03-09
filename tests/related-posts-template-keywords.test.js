const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post template renders keyword chips for keyword-based related posts', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /sharedKeywords/);
  assert.match(template, /related-posts-keywords/);
  assert.match(template, /related-posts-keyword/);
});
