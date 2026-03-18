const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const QuoteCopy = require('../themes/evan/source/js/quote-copy.js');

test('QuoteCopy: formatQuote formats quote correctly', () => {
  const result = QuoteCopy.formatQuote({
    text: 'Hexo is a fast blog framework.',
    title: 'Hexo Tutorial',
    url: 'https://example.com/posts/hexo/'
  });

  assert.equal(
    result,
    `> Hexo is a fast blog framework.\n\n— [Hexo Tutorial](https://example.com/posts/hexo/)`
  );
});

test('QuoteCopy: formatQuote escapes special markdown characters', () => {
  const result = QuoteCopy.formatQuote({
    text: 'Use `hexo init` to start.',
    title: 'Getting Started',
    url: 'https://example.com/start/'
  });

  // The backticks should be preserved
  assert.ok(result.includes('Use `hexo init` to start.'));
  assert.ok(result.includes('[Getting Started](https://example.com/start/)'));
});

test('QuoteCopy: formatQuote handles empty text', () => {
  const result = QuoteCopy.formatQuote({
    text: '',
    title: 'Test Post',
    url: 'https://example.com/test/'
  });

  assert.equal(result, '> \n\n— [Test Post](https://example.com/test/)');
});

test('QuoteCopy: formatQuote handles multiline text', () => {
  const result = QuoteCopy.formatQuote({
    text: 'Line 1\nLine 2\nLine 3',
    title: 'Multiline Test',
    url: 'https://example.com/multiline/'
  });

  // Each line should be prefixed with >
  assert.ok(result.includes('> Line 1'));
  assert.ok(result.includes('> Line 2'));
  assert.ok(result.includes('> Line 3'));
});

test('QuoteCopy: shouldShowButton returns true for selections >= 5 chars', () => {
  assert.equal(QuoteCopy.shouldShowButton('Hello'), true);
  assert.equal(QuoteCopy.shouldShowButton('Hello world'), true);
  assert.equal(QuoteCopy.shouldShowButton('12345'), true);
});

test('QuoteCopy: shouldShowButton returns false for selections < 5 chars', () => {
  assert.equal(QuoteCopy.shouldShowButton(''), false);
  assert.equal(QuoteCopy.shouldShowButton('Hi'), false);
  assert.equal(QuoteCopy.shouldShowButton('Hey'), false);
  assert.equal(QuoteCopy.shouldShowButton(null), false);
  assert.equal(QuoteCopy.shouldShowButton(undefined), false);
});

test('QuoteCopy: calculateButtonPosition returns coordinates', () => {
  const rect = { left: 100, top: 200, width: 300, height: 50 };
  const result = QuoteCopy.calculateButtonPosition(rect, { windowWidth: 1200, windowHeight: 800 });

  assert.ok(typeof result.x === 'number');
  assert.ok(typeof result.y === 'number');
  // Button should be above the selection
  assert.ok(result.y < rect.top || result.y > (rect.top + rect.height));
});

test('QuoteCopy: resolveLang returns zh by default', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;

  const lang = QuoteCopy.resolveLang(document);
  assert.equal(lang, 'zh');

  delete global.document;
});

test('QuoteCopy: resolveLang returns en when langMode is en', () => {
  const dom = new JSDOM(
    '<!doctype html><html data-lang-mode="en"><body></body></html>'
  );
  global.document = dom.window.document;

  const lang = QuoteCopy.resolveLang(document);
  assert.equal(lang, 'en');

  delete global.document;
});

test('QuoteCopy: buttonText returns correct text per language', () => {
  assert.equal(QuoteCopy.buttonText({ lang: 'zh' }), '引用');
  assert.equal(QuoteCopy.buttonText({ lang: 'en' }), 'Quote');
});

test('QuoteCopy: toastSuccessText returns correct text per language', () => {
  assert.equal(QuoteCopy.toastSuccessText({ lang: 'zh' }), '引用已复制');
  assert.equal(QuoteCopy.toastSuccessText({ lang: 'en' }), 'Quote copied');
});

test('QuoteCopy: toastFailureText returns correct text per language', () => {
  assert.equal(QuoteCopy.toastFailureText({ lang: 'zh' }), '复制失败，请手动复制');
  assert.equal(QuoteCopy.toastFailureText({ lang: 'en' }), 'Copy failed, please copy manually');
});

test('QuoteCopy: initQuoteCopy creates button on DOMContentLoaded', async () => {
  const dom = new JSDOM(`<!doctype html><html>
    <head><title>Test</title></head>
    <body>
      <article class="article-content">
        <p>Here is some text to select.</p>
      </article>
      <p data-article-title data-article-url="https://example.com/test/"></p>
    </body>
  </html>`, {
    url: 'https://example.com/test/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  QuoteCopy.initQuoteCopy();

  await new Promise(resolve => setTimeout(resolve, 0));

  const btn = document.querySelector('[data-quote-copy-button]');
  assert.ok(btn, 'Quote copy button should exist');
  assert.equal(btn.className, 'quote-copy-button');
  assert.equal(btn.getAttribute('hidden'), 'hidden');

  delete global.window;
  delete global.document;
  delete global.navigator;
});
