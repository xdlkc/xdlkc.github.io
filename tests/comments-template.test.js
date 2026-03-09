const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post template renders utterances comments area with theme sync', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /comments\.enable/);
  assert.match(template, /provider === 'utterances'/);
  assert.match(template, /data-comments-root/);
  assert.match(template, /https:\/\/utteranc\.es\/client\.js/);
  assert.match(template, /type: 'set-theme'/);
});

test('stylesheet contains comments section styles', () => {
  const css = read('themes/evan/source/css/style.css');
  assert.match(css, /\.post-comments\s*\{/);
  assert.match(css, /\.post-comments-title\s*\{/);
  assert.match(css, /\.post-comments-box\s*\{/);
});
