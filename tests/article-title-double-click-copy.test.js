const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

function setupDom(html) {
  const dom = new JSDOM(html, { url: 'https://example.com/post' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  return dom;
}

test('post template loads article-title-double-click-copy script and initializes it', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /\/js\/article-title-double-click-copy\.js/);
  assert.match(template, /window\.ArticleTitleDoubleClickCopy\?\.init\(\)/);
});

test('ArticleTitleDoubleClickCopy: double-clicking title copies it to clipboard', async () => {
  const dom = setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-hero">
        <h1>测试文章标题</h1>
      </div>
    </body></html>
  `);

  // Mock navigator.clipboard
  let mockClipboardData = '';
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: function(text) {
        return new Promise(function(resolve) {
          mockClipboardData = text;
          resolve();
        });
      }
    }
  });

  const ArticleTitleDoubleClickCopyModule = require('../themes/evan/source/js/article-title-double-click-copy');
  ArticleTitleDoubleClickCopyModule.init();

  const title = document.querySelector('.article-hero h1');

  // Simulate double click using JSDOM's Event constructor
  title.dispatchEvent(new dom.window.Event('click'));
  title.dispatchEvent(new dom.window.Event('click'));

  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 100));

  assert.strictEqual(mockClipboardData, '测试文章标题');

  // Check toast
  const toast = document.querySelector('[data-article-title-copy-toast]');
  assert.ok(toast);
  assert.ok(toast.textContent.includes('标题已复制'));
  assert.ok(toast.textContent.includes('测试文章标题'));

  // Cleanup
  if (toast) toast.remove();
});

test('ArticleTitleDoubleClickCopy: single click does not copy', async () => {
  const dom = setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-hero">
        <h1>测试文章标题</h1>
      </div>
    </body></html>
  `);

  let mockClipboardData = '';
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: function(text) {
        return new Promise(function(resolve) {
          mockClipboardData = text;
          resolve();
        });
      }
    }
  });

  const ArticleTitleDoubleClickCopyModule = require('../themes/evan/source/js/article-title-double-click-copy');
  ArticleTitleDoubleClickCopyModule.init();

  const title = document.querySelector('.article-hero h1');

  // Single click
  title.dispatchEvent(new dom.window.Event('click'));

  // Wait for double-click timeout
  await new Promise(resolve => setTimeout(resolve, 400));

  assert.strictEqual(mockClipboardData, '');

  // No toast should be shown
  const toast = document.querySelector('[data-article-title-copy-toast]');
  assert.ok(!toast);
});

test('ArticleTitleDoubleClickCopy: empty title does not trigger copy', async () => {
  const dom = setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-hero">
        <h1></h1>
      </div>
    </body></html>
  `);

  let mockClipboardData = '';
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: function(text) {
        return new Promise(function(resolve) {
          mockClipboardData = text;
          resolve();
        });
      }
    }
  });

  const ArticleTitleDoubleClickCopyModule = require('../themes/evan/source/js/article-title-double-click-copy');
  ArticleTitleDoubleClickCopyModule.init();

  const title = document.querySelector('.article-hero h1');

  title.dispatchEvent(new dom.window.Event('click'));
  title.dispatchEvent(new dom.window.Event('click'));

  await new Promise(resolve => setTimeout(resolve, 100));

  assert.strictEqual(mockClipboardData, '');

  const toast = document.querySelector('[data-article-title-copy-toast]');
  assert.ok(!toast);
});

test('ArticleTitleDoubleClickCopy: adds visual cues to title', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-hero">
        <h1>测试文章标题</h1>
      </div>
    </body></html>
  `);

  const ArticleTitleDoubleClickCopyModule = require('../themes/evan/source/js/article-title-double-click-copy');
  ArticleTitleDoubleClickCopyModule.init();

  const title = document.querySelector('.article-hero h1');

  assert.strictEqual(title.style.cursor, 'pointer');
  assert.strictEqual(title.title, '双击复制标题');
});

test('ArticleTitleDoubleClickCopy: toast auto-dismisses after 3 seconds', async () => {
  const dom = setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-hero">
        <h1>测试文章标题</h1>
      </div>
    </body></html>
  `);

  let mockClipboardData = '';
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: function(text) {
        return new Promise(function(resolve) {
          mockClipboardData = text;
          resolve();
        });
      }
    }
  });

  const ArticleTitleDoubleClickCopyModule = require('../themes/evan/source/js/article-title-double-click-copy');
  ArticleTitleDoubleClickCopyModule.init();

  const title = document.querySelector('.article-hero h1');
  title.dispatchEvent(new dom.window.Event('click'));
  title.dispatchEvent(new dom.window.Event('click'));

  await new Promise(resolve => setTimeout(resolve, 100));

  const toast = document.querySelector('[data-article-title-copy-toast]');
  assert.ok(toast);

  // Wait for toast to disappear (3.5 seconds to be safe)
  await new Promise(resolve => setTimeout(resolve, 3500));

  const toastAfter = document.querySelector('[data-article-title-copy-toast]');
  // Toast should be removed or hidden
  if (toastAfter) {
    assert.strictEqual(toastAfter.style.opacity, '0');
  } else {
    assert.ok(!toastAfter);
  }
});

test('ArticleTitleDoubleClickCopy: handles missing article hero gracefully', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div><p>No article hero here</p></div>
    </body></html>
  `);

  assert.doesNotThrow(() => {
    const ArticleTitleDoubleClickCopyModule = require('../themes/evan/source/js/article-title-double-click-copy');
    ArticleTitleDoubleClickCopyModule.init();
  });
});

test('ArticleTitleDoubleClickCopy: init is idempotent', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-hero">
        <h1>测试文章标题</h1>
      </div>
    </body></html>
  `);

  const ArticleTitleDoubleClickCopyModule = require('../themes/evan/source/js/article-title-double-click-copy');

  assert.doesNotThrow(() => {
    ArticleTitleDoubleClickCopyModule.init();
    ArticleTitleDoubleClickCopyModule.init();
    ArticleTitleDoubleClickCopyModule.init();
  });

  const title = document.querySelector('.article-hero h1');
  assert.strictEqual(title.style.cursor, 'pointer');
});
