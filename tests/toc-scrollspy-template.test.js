const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('post template injects TOC scroll-spy script and bootstraps it', () => {
  const templatePath = path.join(__dirname, '..', 'themes', 'evan', 'layout', 'post.ejs');
  const content = fs.readFileSync(templatePath, 'utf8');

  assert.match(content, /\/js\/toc-scrollspy\.js/);
  assert.match(content, /TocScrollSpy\?\.initTocScrollSpy\(\)/);
});
