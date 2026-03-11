const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post template loads post-like script and initializes it', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /\/js\/post-like\.js/);
  assert.match(template, /window\.PostLike\?\.initPostLike\(\)/);
  assert.match(template, /data-post-like/);
});

test('PostLike: toggles like state per-pathname and persists to localStorage', async () => {
  const { initPostLike, STORAGE_KEY } = require('../themes/evan/source/js/post-like');

  const dom = new JSDOM(`<!doctype html><html data-lang-mode="zh"><body>
    <button type="button" data-post-like></button>
  </body></html>`, { url: 'https://example.test/2026/03/11/hello/' });

  const storage = (() => {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
    };
  })();

  initPostLike({
    window: dom.window,
    document: dom.window.document,
    storage,
    location: dom.window.location,
  });

  const btn = dom.window.document.querySelector('[data-post-like]');
  assert.ok(btn);

  // initial
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  assert.match(btn.textContent, /赞/);
  assert.match(btn.textContent, /\(0\)/);

  // like
  btn.click();
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  assert.match(btn.textContent, /已赞/);
  assert.match(btn.textContent, /\(1\)/);

  const raw = storage.getItem(STORAGE_KEY);
  assert.ok(raw, 'should write to localStorage');
  const json = JSON.parse(raw);
  assert.equal(json['/2026/03/11/hello/'].liked, true);
  assert.equal(json['/2026/03/11/hello/'].count, 1);

  // unlike
  btn.click();
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  assert.match(btn.textContent, /赞/);
  assert.match(btn.textContent, /\(0\)/);

  // re-init should restore
  btn.textContent = '';
  btn.removeAttribute('aria-pressed');
  initPostLike({
    window: dom.window,
    document: dom.window.document,
    storage,
    location: dom.window.location,
  });
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  assert.match(btn.textContent, /\(0\)/);
});
