const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post template renders related post excerpt via helper when available', () => {
  const template = read('themes/evan/layout/post.ejs');

  assert.match(template, /related_posts_excerpt\(/);
  assert.match(template, /related-posts-excerpt/);
});
