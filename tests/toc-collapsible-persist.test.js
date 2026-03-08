const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { enhanceCollapsibleToc } = require('../themes/evan/source/js/toc-scrollspy');

function setupDom() {
  const dom = new JSDOM(`<!doctype html>
    <html><body>
      <nav class="toc-nav">
        <ol>
          <li class="toc-nav-item">
            <a class="toc-nav-link" href="#a">A</a>
            <ol>
              <li><a href="#a-1">A-1</a></li>
            </ol>
          </li>
          <li class="toc-nav-item"><a href="#b">B</a></li>
        </ol>
      </nav>
    </body></html>`);
  return dom;
}

function createStorageStub() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    _store: store
  };
}

test('enhanceCollapsibleToc: persists collapsed items to localStorage and restores on init', () => {
  const dom = setupDom();
  const { document } = dom.window;

  const storage = createStorageStub();

  const toc = document.querySelector('.toc-nav');
  enhanceCollapsibleToc(toc, { document, storage });

  const item = document.querySelector('.toc-nav-item');
  const btn = item.querySelector('.toc-collapse-btn');
  assert.ok(btn);

  // Collapse it
  btn.click();
  assert.ok(item.classList.contains('is-collapsed'));

  // Simulate re-init (e.g. page reload) by clearing DOM state but keeping storage.
  item.classList.remove('is-collapsed');
  btn.setAttribute('aria-expanded', 'true');

  enhanceCollapsibleToc(toc, { document, storage });

  // Should restore collapsed state.
  assert.ok(item.classList.contains('is-collapsed'));
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
});
