const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('ShortcutHelp: g+h navigates to home, g+a navigates to /archives/ (when not typing)', () => {
  const ShortcutHelp = require('../themes/evan/source/js/shortcut-help.js');

  const dom = new JSDOM(
    `<!doctype html><html><body>
      <button data-shortcut-help-trigger>?</button>
      <input id="q" />
    </body></html>`,
    { url: 'https://example.com/2026/post/' }
  );

  const { document, window } = dom.window;

  const assigned = [];
  const locationStub = {
    assign: (href) => assigned.push(href)
  };

  ShortcutHelp.initShortcutHelp({ root: document, location: locationStub, now: () => 1000 });

  // Not typing: g then h within window.
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'g', bubbles: true }));
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'h', bubbles: true }));

  assert.deepEqual(assigned, ['/']);

  // g then a
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'g', bubbles: true }));
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));

  assert.deepEqual(assigned, ['/', '/archives/']);

  // Typing in input should not trigger.
  const input = document.getElementById('q');
  input.focus();

  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'g', bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'h', bubbles: true }));

  assert.deepEqual(assigned, ['/', '/archives/']);
});

test('ShortcutHelp: g prefix times out after 800ms', () => {
  const ShortcutHelp = require('../themes/evan/source/js/shortcut-help.js');

  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, { url: 'https://example.com/' });
  const { document, window } = dom.window;

  const assigned = [];
  const locationStub = {
    assign: (href) => assigned.push(href)
  };

  let t = 1000;
  const now = () => t;

  ShortcutHelp.initShortcutHelp({ root: document, location: locationStub, now });

  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'g', bubbles: true }));

  // advance beyond timeout
  t += 801;

  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'h', bubbles: true }));

  assert.deepEqual(assigned, []);
});
