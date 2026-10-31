const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const factory = require('../themes/evan/source/js/toc-scrollspy');

test('preserves explicit section numbering without adding duplicate indices', () => {
  const dom = new JSDOM('<ol class="toc-nav"><li><a href="#a"><span class="toc-nav-text">2. 双层架构</span></a><ol><li><a href="#b"><span class="toc-nav-text">2.1 Router 层</span></a></li></ol></li></ol>');
  const toc = dom.window.document.querySelector('.toc-nav');
  const api = factory(dom.window.document, dom.window);
  api.enhanceTocAutoNumbering(toc);
  api.enhanceTocAutoNumbering(toc);
  assert.equal(toc.querySelectorAll('.toc-index').length, 0);
  assert.equal(toc.querySelector('a').textContent, '2. 双层架构');
});

test('still numbers unnumbered headings and preserves year-led titles', () => {
  const dom = new JSDOM('<ol class="toc-nav"><li><a href="#a">Introduction</a><ol><li><a href="#b">2026 outlook</a></li></ol></li></ol>');
  const toc = dom.window.document.querySelector('.toc-nav');
  const api = factory(dom.window.document, dom.window);
  api.enhanceTocAutoNumbering(toc);
  api.enhanceTocAutoNumbering(toc);
  assert.deepEqual([...toc.querySelectorAll('.toc-index')].map(x => x.textContent), ['1', '1.1']);
});
