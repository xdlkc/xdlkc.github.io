const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('post template renders article TOC containers and bootstraps anchor navigation', () => {
  const templatePath = path.join(__dirname, '..', 'themes', 'evan', 'layout', 'post.ejs');
  const content = fs.readFileSync(templatePath, 'utf8');

  assert.match(content, /toc\(page\.content,\s*\{[^}]*class:\s*'toc-nav'/);
  assert.match(content, /details\s+class="toc-mobile"/);
  assert.match(content, /aside\s+class="toc-card"/);
  assert.match(content, /\/js\/heading-auto-id\.js/);
  assert.match(content, /\/js\/toc-scrollspy\.js/);
  assert.match(content, /window\.TocScrollSpy\?\.initTocScrollSpy\(\)/);
});
