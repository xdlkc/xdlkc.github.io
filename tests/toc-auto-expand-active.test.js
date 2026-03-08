const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { expandTocAncestorsForLink } = require('../themes/evan/source/js/toc-scrollspy');

test('expandTocAncestorsForLink: expands all collapsed ancestor list items', () => {
  const dom = new JSDOM(`<!doctype html>
    <html><body>
      <nav class="toc-nav">
        <ol>
          <li class="toc-nav-item is-collapsed" id="li-a">
            <button class="toc-collapse-btn" type="button" aria-expanded="false"></button>
            <a href="#a">A</a>
            <ol>
              <li class="toc-nav-item" id="li-a1"><a href="#a-1" id="link-a1">A-1</a></li>
            </ol>
          </li>
        </ol>
      </nav>
    </body></html>`);

  const { document } = dom.window;
  const link = document.getElementById('link-a1');
  const parent = document.getElementById('li-a');

  assert.ok(parent.classList.contains('is-collapsed'));

  expandTocAncestorsForLink(link);

  assert.ok(!parent.classList.contains('is-collapsed'));
});

test('expandTocAncestorsForLink: is safe on null input', () => {
  assert.doesNotThrow(() => expandTocAncestorsForLink(null));
});
