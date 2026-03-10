const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('page template supports TOC (mobile + desktop) and initializes toc-scrollspy', () => {
  const templatePath = path.join(__dirname, '..', 'themes', 'evan', 'layout', 'page.ejs');
  const content = fs.readFileSync(templatePath, 'utf8');

  // Should generate TOC from page content.
  assert.match(content, /toc\(page\.content,\s*\{[^}]*class:\s*'toc-nav'/);

  // Should include toc-scrollspy script and init call.
  assert.match(content, /\/js\/toc-scrollspy\.js/);
  assert.match(content, /TocScrollSpy\?\.initTocScrollSpy\(\)/);

  // Should provide both mobile and desktop TOC containers.
  assert.match(content, /details\s+class="toc-mobile"/);
  assert.match(content, /aside\s+class="toc-card"/);
});
