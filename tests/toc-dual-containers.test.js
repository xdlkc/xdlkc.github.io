const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('TocScrollSpy enhances both mobile and desktop TOCs (desktop toggle works even if mobile TOC comes first)', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy.js');

  const dom = new JSDOM(`<!doctype html>
  <html><body>
    <article>
      <main>
        <details class="toc-mobile">
          <summary>Outline</summary>
          <div class="toc-mobile-body">
            <nav class="toc-nav">
              <ol><li><a href="#h2-1">H2</a></li></ol>
            </nav>
          </div>
        </details>

        <article class="article-content">
          <h2 id="h2-1">H2</h2>
          <h2 id="h2-2">H2-2</h2>
        </article>
      </main>

      <aside class="toc-card">
        <div class="toc-header">
          <button type="button" data-toc-visibility-toggle aria-label="隐藏目录" aria-pressed="false">Hide</button>
        </div>
        <nav class="toc-nav">
          <ol><li><a href="#h2-1">H2</a></li></ol>
        </nav>
      </aside>
    </article>
  </body></html>`, { url: 'https://example.com/p/' });

  global.window = dom.window;
  global.document = dom.window.document;

  TocScrollSpy.initTocScrollSpy();

  const desktopToc = document.querySelector('.toc-card .toc-nav');
  const btn = document.querySelector('[data-toc-visibility-toggle]');
  assert.ok(desktopToc);
  assert.ok(btn);

  // First click should hide the desktop TOC.
  btn.click();
  assert.equal(desktopToc.getAttribute('hidden'), 'hidden');
  assert.equal(desktopToc.getAttribute('aria-hidden'), 'true');

  // Second click should restore.
  btn.click();
  assert.equal(desktopToc.hasAttribute('hidden'), false);
  assert.equal(desktopToc.hasAttribute('aria-hidden'), false);

  // Mobile TOC should remain present.
  const mobileToc = document.querySelector('details.toc-mobile .toc-nav');
  assert.ok(mobileToc);

  delete global.window;
  delete global.document;
});
