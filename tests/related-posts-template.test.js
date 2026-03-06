const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post template renders Related Posts section via related_posts helper', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /related_posts\(/);
  assert.match(template, /related-posts/);
  assert.match(template, /相关阅读|Related Posts/);
});
