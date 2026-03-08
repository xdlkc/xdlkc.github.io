const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// Module to be implemented in this iteration.
const {
  pickMermaidTheme,
  stashMermaidSource,
  restoreMermaidSource
} = require('../themes/evan/source/js/mermaid-enhance');

test('pickMermaidTheme: dark -> dark, others -> default', () => {
  assert.equal(pickMermaidTheme('dark'), 'dark');
  assert.equal(pickMermaidTheme('light'), 'default');
  assert.equal(pickMermaidTheme('system'), 'default');
  assert.equal(pickMermaidTheme(undefined), 'default');
});

test('stash/restore: preserve original mermaid source for re-render', () => {
  const dom = new JSDOM('<!doctype html><html><body><div class="mermaid">graph TD; A-->B;</div></body></html>');
  const document = dom.window.document;
  const el = document.querySelector('.mermaid');

  stashMermaidSource(el);
  // Simulate Mermaid render output replacing content.
  el.innerHTML = '<svg><text>rendered</text></svg>';

  restoreMermaidSource(el);
  assert.equal(el.textContent.trim(), 'graph TD; A-->B;');
  assert.equal(el.getAttribute('data-mermaid-source'), 'graph TD; A-->B;');
});
