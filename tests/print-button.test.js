const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const PrintButton = require('../themes/evan/source/js/print-button');

function setupDom() {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-shell">
      <header class="article-hero">
        <h1>Test Article</h1>
      </header>
      <main class="article-card">
        <div class="article-content">
          <p>This is a test article.</p>
        </div>
      </main>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;

  // Stub window.print to prevent actual printing
  let printed = false;
  window.print = () => { printed = true; };

  return { dom, window, document, getPrinted: () => printed };
}

test('PrintButton: adds print button to article hero', () => {
  const { document } = setupDom();

  PrintButton.initPrintButton();
  const printButton = document.querySelector('.article-hero [data-print-button]');
  assert.ok(printButton, 'print button should be added');
  assert.strictEqual(printButton.getAttribute('aria-label'), '打印此文章');
  assert.strictEqual(printButton.type, 'button');
});

test('PrintButton: does not add duplicate buttons', () => {
  const { document } = setupDom();

  PrintButton.initPrintButton();
  const printButtons1 = document.querySelectorAll('.article-hero [data-print-button]');
  assert.strictEqual(printButtons1.length, 1);

  PrintButton.initPrintButton();
  const printButtons2 = document.querySelectorAll('.article-hero [data-print-button]');
  assert.strictEqual(printButtons2.length, 1);
});

test('PrintButton: clicking button calls window.print()', () => {
  const { document, getPrinted } = setupDom();

  PrintButton.initPrintButton();
  const printButton = document.querySelector('.article-hero [data-print-button]');
  assert.ok(printButton, 'print button should exist');

  printButton.click();
  assert.strictEqual(getPrinted(), true, 'window.print() should be called');
});

test('PrintButton: button text is in Chinese by default', () => {
  const { document } = setupDom();

  PrintButton.initPrintButton();
  const printButton = document.querySelector('.article-hero [data-print-button]');
  assert.ok(printButton, 'print button should exist');

  assert.strictEqual(printButton.textContent.trim(), '打印');
});

test('PrintButton: button text updates on lang-change event', () => {
  const { window, document } = setupDom();

  PrintButton.initPrintButton();
  const printButton = document.querySelector('.article-hero [data-print-button]');
  assert.ok(printButton, 'print button should exist');

  // Set lang mode to English
  document.documentElement.dataset.langMode = 'en';
  window.dispatchEvent(new window.CustomEvent('xdlkc:lang-change'));

  assert.strictEqual(printButton.textContent.trim(), 'Print');
  assert.strictEqual(printButton.getAttribute('aria-label'), 'Print this article');
});

test('PrintButton: button text switches back to Chinese on lang-change', () => {
  const { window, document } = setupDom();

  PrintButton.initPrintButton();
  const printButton = document.querySelector('.article-hero [data-print-button]');
  assert.ok(printButton, 'print button should exist');

  // Set lang mode to English first
  document.documentElement.dataset.langMode = 'en';
  window.dispatchEvent(new window.CustomEvent('xdlkc:lang-change'));

  // Switch back to Chinese
  document.documentElement.dataset.langMode = 'zh';
  window.dispatchEvent(new window.CustomEvent('xdlkc:lang-change'));

  assert.strictEqual(printButton.textContent.trim(), '打印');
  assert.strictEqual(printButton.getAttribute('aria-label'), '打印此文章');
});
