const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layout includes shortcut-help script, and templates include the trigger button', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /\/js\/shortcut-help\.js/);

  const templates = [
    'themes/evan/layout/index.ejs',
    'themes/evan/layout/post.ejs',
    'themes/evan/layout/page.ejs'
  ];

  templates.forEach((p) => {
    const tpl = read(p);
    assert.match(tpl, /data-shortcut-help-trigger/, `${p} should include shortcut help trigger button`);
  });
});

test('ShortcutHelp opens with ? and closes with Escape', () => {
  const ShortcutHelp = require('../themes/evan/source/js/shortcut-help.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-shortcut-help-trigger>?</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  ShortcutHelp.initShortcutHelp({ root: document });

  const openEvent = new window.KeyboardEvent('keydown', { key: '?', bubbles: true });
  document.dispatchEvent(openEvent);

  const dialog = document.querySelector('[data-shortcut-help-dialog]');
  assert.ok(dialog);
  assert.equal(dialog.getAttribute('aria-hidden'), 'false');
  assert.ok(dialog.classList.contains('is-open'));

  const closeEvent = new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
  document.dispatchEvent(closeEvent);

  assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  assert.ok(!dialog.classList.contains('is-open'));

  delete global.window;
  delete global.document;
});

test('ShortcutHelp does not open with ? while typing in input', () => {
  const ShortcutHelp = require('../themes/evan/source/js/shortcut-help.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <input id="outside" />
    <button data-shortcut-help-trigger>?</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  ShortcutHelp.initShortcutHelp({ root: document });

  const outside = document.getElementById('outside');
  outside.focus();

  const openEvent = new window.KeyboardEvent('keydown', { key: '?', bubbles: true });
  outside.dispatchEvent(openEvent);

  const dialog = document.querySelector('[data-shortcut-help-dialog]');
  assert.ok(dialog);
  assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  assert.ok(!dialog.classList.contains('is-open'));

  delete global.window;
  delete global.document;
});
