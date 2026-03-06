const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('theme loads HeadingAnchorCopy script and post template initializes it', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /\/js\/heading-anchor-copy\.js/);
  assert.match(template, /window\.HeadingAnchorCopy\?\.initHeadingAnchorCopy\(\)/);
});

test('stylesheet contains heading anchor button styles', () => {
  const css = read('themes/evan/source/css/style.css');
  assert.match(css, /\.heading-anchor-button\s*\{/);
});

test('HeadingAnchorCopy: clicking anchor button copies full URL with hash', async () => {
  const { initHeadingAnchorCopy } = require('../themes/evan/source/js/heading-anchor-copy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <h2 id="section-1">Section</h2>
      <p>hello</p>
    </article>
  </body></html>`, { url: 'https://example.test/posts/hello-world/' });

  let copied = null;
  dom.window.navigator.clipboard = {
    writeText: async (text) => {
      copied = text;
    }
  };

  initHeadingAnchorCopy({
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    history: dom.window.history,
  });

  const button = dom.window.document.querySelector('.heading-anchor-button');
  assert.ok(button, 'should inject a button next to heading');

  button.click();
  // wait microtask
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  assert.equal(copied, 'https://example.test/posts/hello-world/#section-1');
});
