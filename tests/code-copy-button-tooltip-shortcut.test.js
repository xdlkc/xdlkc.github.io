const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('CodeCopy: injected copy button exposes shortcut hint in title (zh/en + lang-change)', () => {
  const CodeCopy = require('../themes/evan/source/js/code-copy');

  const dom = new JSDOM(`<!doctype html><html data-lang-mode="zh"><body>
    <article class="article-content">
      <pre><code>line1\nline2</code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  CodeCopy.initCodeCopy({ root: document });

  const btn = document.querySelector('.code-copy-button');
  assert.ok(btn);

  const titleZh = String(btn.getAttribute('title') || '');
  assert.ok(titleZh.includes('Shift+Ctrl/Cmd+C'), 'zh tooltip should include shortcut literal');
  assert.ok(titleZh.includes('快捷键'), 'zh tooltip should mention 快捷键');

  // Switch to en and dispatch language-change event.
  document.documentElement.dataset.langMode = 'en';
  dom.window.dispatchEvent(new dom.window.Event('xdlkc:lang-change'));

  const titleEn = String(btn.getAttribute('title') || '');
  assert.ok(titleEn.includes('Shift+Ctrl/Cmd+C'), 'en tooltip should include shortcut literal');
  assert.ok(titleEn.toLowerCase().includes('shortcut'), 'en tooltip should mention Shortcut');

  delete global.window;
  delete global.document;
  delete global.navigator;
});
