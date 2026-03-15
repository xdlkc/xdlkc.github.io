const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ReadingProgress = require('../themes/evan/source/js/reading-progress');

test('Reading progress: copy link includes active heading hash when available', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="reading-progress" data-reading-minutes="10" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="reading-progress-bar"></div>
    </div>
    <article class="article-content">
      <h2 id="intro">Intro</h2>
      <p>hello</p>
      <h2 id="next">Next</h2>
      <p>world</p>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });

  global.window = dom.window;
  global.document = dom.window.document;

  // Mock page dimensions used by init.
  Object.defineProperty(dom.window, 'innerHeight', { value: 800, configurable: true });
  Object.defineProperty(dom.window.document.documentElement, 'scrollHeight', { value: 2400, configurable: true });

  // Mock scroll position.
  Object.defineProperty(dom.window, 'scrollY', { value: 200, configurable: true });

  // Control heading positions.
  const intro = dom.window.document.getElementById('intro');
  const next = dom.window.document.getElementById('next');

  intro.getBoundingClientRect = () => ({ top: -100 });
  next.getBoundingClientRect = () => ({ top: 350 });

  let copied = '';
  dom.window.navigator.clipboard = {
    writeText: async (text) => { copied = String(text); }
  };

  ReadingProgress.initReadingProgress();

  const btn = dom.window.document.querySelector('.reading-progress-copy');
  assert.ok(btn, 'copy button should exist');

  btn.click();

  // allow any async copy
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(copied, 'https://example.com/post/#intro');

  const toast = dom.window.document.querySelector('.reading-progress-copy-toast');
  assert.ok(toast, 'toast should be created');
  assert.equal(toast.classList.contains('is-visible'), true);
});

test('Reading progress: copy link omits hash when no active heading id', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="reading-progress" role="progressbar">
      <div class="reading-progress-bar"></div>
    </div>
    <article class="article-content">
      <p>No headings here</p>
    </article>
  </body></html>`, { url: 'https://example.com/page/?q=1#old' });

  global.window = dom.window;
  global.document = dom.window.document;

  Object.defineProperty(dom.window, 'innerHeight', { value: 800, configurable: true });
  Object.defineProperty(dom.window.document.documentElement, 'scrollHeight', { value: 800, configurable: true });

  let copied = '';
  dom.window.navigator.clipboard = {
    writeText: async (text) => { copied = String(text); }
  };

  ReadingProgress.initReadingProgress();

  const btn = dom.window.document.querySelector('.reading-progress-copy');
  assert.ok(btn);

  btn.click();
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(copied, 'https://example.com/page/?q=1');
});
