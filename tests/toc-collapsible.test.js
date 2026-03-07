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

test('enhanceCollapsibleToc: injects collapse button only for items with children', () => {
  const dom = setupDom();
  const { document } = dom.window;

  const toc = document.querySelector('.toc-nav');
  enhanceCollapsibleToc(toc, { document });

  const items = document.querySelectorAll('.toc-nav-item');
  assert.equal(items.length, 2);

  const firstBtn = items[0].querySelector('.toc-collapse-btn');
  const secondBtn = items[1].querySelector('.toc-collapse-btn');

  assert.ok(firstBtn, 'first item should have collapse btn');
  assert.equal(secondBtn, null, 'second item without children should have no btn');

  assert.equal(firstBtn.getAttribute('aria-expanded'), 'true');
});

test('enhanceCollapsibleToc: toggles collapsed state and aria-expanded', async () => {
  const dom = setupDom();
  const { document } = dom.window;

  const toc = document.querySelector('.toc-nav');
  enhanceCollapsibleToc(toc, { document });

  const item = document.querySelector('.toc-nav-item');
  const btn = item.querySelector('.toc-collapse-btn');
  assert.ok(btn);

  btn.click();
  assert.ok(item.classList.contains('is-collapsed'));
  assert.equal(btn.getAttribute('aria-expanded'), 'false');

  btn.click();
  assert.ok(!item.classList.contains('is-collapsed'));
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
});

test('enhanceCollapsibleToc: is idempotent (no duplicate buttons)', () => {
  const dom = setupDom();
  const { document } = dom.window;

  const toc = document.querySelector('.toc-nav');
  enhanceCollapsibleToc(toc, { document });
  enhanceCollapsibleToc(toc, { document });

  const btns = document.querySelectorAll('.toc-collapse-btn');
  assert.equal(btns.length, 1);
});
