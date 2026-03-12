const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const Toc = require('../../themes/evan/source/js/toc-scrollspy.js');

function makeDom({ langMode = 'zh' } = {}) {
  const html = `<!doctype html>
  <html data-lang-mode="${langMode}">
    <body>
      <aside class="toc-card">
        <div class="toc-header">
          <p class="toc-title">Outline</p>
        </div>
        <nav class="toc-nav">
          <ol>
            <li>
              <a href="#a">A</a>
              <ol>
                <li><a href="#a-1">A1</a></li>
              </ol>
            </li>
            <li>
              <a href="#b">B</a>
              <ol>
                <li><a href="#b-1">B1</a></li>
              </ol>
            </li>
            <li><a href="#c">C</a></li>
          </ol>
        </nav>
      </aside>
    </body>
  </html>`;

  const dom = new JSDOM(html, { url: 'https://example.com/post/' });
  const { window } = dom;
  const { document } = window;

  // Provide lang mode in the same way the site does.
  document.documentElement.dataset.langMode = langMode;

  return { dom, document, window };
}

test('TOC collapse-all button collapses/expands all nested sections and persists to localStorage', () => {
  const { document, window } = makeDom({ langMode: 'zh' });

  const toc = document.querySelector('.toc-nav');
  assert.ok(toc);

  // First enhance per-item collapsibility (creates .toc-collapse-btn and restores state).
  Toc.enhanceCollapsibleToc(toc, { document, storage: window.localStorage, storageKey: 'xdlkc:toc:collapsed' });

  // New feature: inject collapse-all control.
  assert.equal(typeof Toc.injectTocCollapseAllToggle, 'function');
  Toc.injectTocCollapseAllToggle(toc, { document, storage: window.localStorage, storageKey: 'xdlkc:toc:collapsed' });

  const btn = document.querySelector('.toc-collapse-all');
  assert.ok(btn, 'collapse-all button should exist');
  assert.equal(btn.textContent, '收起全部');

  btn.click();

  const collapsibleLis = Array.from(toc.querySelectorAll('li')).filter((li) => li.querySelector(':scope > ol, :scope > ul'));
  assert.equal(collapsibleLis.length, 2);
  collapsibleLis.forEach((li) => assert.ok(li.classList.contains('is-collapsed')));

  const stored = JSON.parse(window.localStorage.getItem('xdlkc:toc:collapsed'));
  assert.deepEqual(new Set(stored), new Set(['#a', '#b']));

  // Now button should switch to expand.
  assert.equal(btn.textContent, '展开全部');

  btn.click();
  collapsibleLis.forEach((li) => assert.ok(!li.classList.contains('is-collapsed')));

  const stored2 = JSON.parse(window.localStorage.getItem('xdlkc:toc:collapsed'));
  assert.deepEqual(stored2, []);
  assert.equal(btn.textContent, '收起全部');
});

test('collapse-all button uses English labels in en mode', () => {
  const { document, window } = makeDom({ langMode: 'en' });
  const toc = document.querySelector('.toc-nav');

  Toc.enhanceCollapsibleToc(toc, { document, storage: window.localStorage, storageKey: 'xdlkc:toc:collapsed' });
  Toc.injectTocCollapseAllToggle(toc, { document, storage: window.localStorage, storageKey: 'xdlkc:toc:collapsed' });

  const btn = document.querySelector('.toc-collapse-all');
  assert.ok(btn);
  assert.equal(btn.textContent, 'Collapse all');
});
