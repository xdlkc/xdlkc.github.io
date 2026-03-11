const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ExternalLinks = require('../themes/evan/source/js/external-links');

function setupDom(html, { url = 'https://xdlkc.com/2026/03/11/post/' } = {}) {
  const dom = new JSDOM(html, { url });
  global.window = dom.window;
  global.document = dom.window.document;
  global.location = dom.window.location;
  return dom;
}

test('external link gets target=_blank, rel noopener/noreferrer, and class external-link', () => {
  const dom = setupDom(`
    <div class="article-content">
      <a id="ext" href="https://example.com/a">Example</a>
    </div>
  `);

  ExternalLinks.initExternalLinks({ root: dom.window.document, location: dom.window.location });

  const a = dom.window.document.querySelector('#ext');
  assert.equal(a.getAttribute('target'), '_blank');
  const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
  assert.ok(rel.includes('noopener'));
  assert.ok(rel.includes('noreferrer'));
  assert.ok(a.classList.contains('external-link'));
});

test('same-origin absolute link is not modified', () => {
  const dom = setupDom(`
    <div class="article-content">
      <a id="same" href="https://xdlkc.com/tags/">Tags</a>
    </div>
  `);

  ExternalLinks.initExternalLinks({ root: dom.window.document, location: dom.window.location });

  const a = dom.window.document.querySelector('#same');
  assert.equal(a.getAttribute('target'), null);
  assert.equal(a.getAttribute('rel'), null);
  assert.ok(!a.classList.contains('external-link'));
});

test('relative/hash/mailto links are not modified', () => {
  const dom = setupDom(`
    <div class="article-content">
      <a id="rel" href="/archives/">Archives</a>
      <a id="hash" href="#section">Section</a>
      <a id="mail" href="mailto:test@example.com">Mail</a>
    </div>
  `);

  ExternalLinks.initExternalLinks({ root: dom.window.document, location: dom.window.location });

  ['#rel', '#hash', '#mail'].forEach((sel) => {
    const a = dom.window.document.querySelector(sel);
    assert.equal(a.getAttribute('target'), null);
    assert.equal(a.getAttribute('rel'), null);
    assert.ok(!a.classList.contains('external-link'));
  });
});

test('initExternalLinks is idempotent', () => {
  const dom = setupDom(`
    <div class="article-content">
      <a id="ext" href="https://example.com/a" rel="nofollow">Example</a>
    </div>
  `);

  ExternalLinks.initExternalLinks({ root: dom.window.document, location: dom.window.location });
  ExternalLinks.initExternalLinks({ root: dom.window.document, location: dom.window.location });

  const a = dom.window.document.querySelector('#ext');
  assert.equal(a.getAttribute('target'), '_blank');
  const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
  assert.ok(rel.includes('nofollow'));
  assert.ok(rel.includes('noopener'));
  assert.ok(rel.includes('noreferrer'));
  assert.ok(a.classList.contains('external-link'));
});
