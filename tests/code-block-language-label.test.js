/**
 * @jest-environment jsdom
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('initCodeLanguageLabel adds language label to code blocks with language class', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body>' +
      '<article class="article-content">' +
        '<pre class="language-javascript"><code>const x = 1;</code></pre>' +
        '<pre class="lang-python"><code>def foo():</code></pre>' +
        '<pre class="language-css"><code>body { color: red; }</code></pre>' +
      '</article>' +
    '</body></html>'
  );

  // Mock the module
  const CodeLanguageLabel = require('../themes/evan/source/js/code-language-label.js');

  CodeLanguageLabel.initCodeLanguageLabel({ document: dom.window.document });

  const jsPre = dom.window.document.querySelector('pre.language-javascript');
  const jsLabel = jsPre.querySelector('.code-language-label');
  assert.ok(jsLabel);
  assert.equal(jsLabel.textContent, 'JavaScript');

  const pyPre = dom.window.document.querySelector('pre.lang-python');
  const pyLabel = pyPre.querySelector('.code-language-label');
  assert.ok(pyLabel);
  assert.equal(pyLabel.textContent, 'Python');

  const cssPre = dom.window.document.querySelector('pre.language-css');
  const cssLabel = cssPre.querySelector('.code-language-label');
  assert.ok(cssLabel);
  assert.equal(cssLabel.textContent, 'CSS');
});

test('initCodeLanguageLabel does not add label to code blocks without language class', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body>' +
      '<article class="article-content">' +
        '<pre><code>plain text</code></pre>' +
        '<pre class="code"><code>no language</code></pre>' +
      '</article>' +
    '</body></html>'
  );

  const CodeLanguageLabel = require('../themes/evan/source/js/code-language-label.js');

  CodeLanguageLabel.initCodeLanguageLabel({ document: dom.window.document });

  const pre1 = dom.window.document.querySelector('article pre');
  const label1 = pre1.querySelector('.code-language-label');
  assert.strictEqual(label1, null);

  const pre2 = dom.window.document.querySelector('pre.code');
  const label2 = pre2.querySelector('.code-language-label');
  assert.strictEqual(label2, null);
});

test('initCodeLanguageLabel skips mermaid blocks', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body>' +
      '<article class="article-content">' +
        '<pre class="language-javascript mermaid"><code>graph TD; A-->B;</code></pre>' +
      '</article>' +
    '</body></html>'
  );

  const CodeLanguageLabel = require('../themes/evan/source/js/code-language-label.js');

  CodeLanguageLabel.initCodeLanguageLabel({ document: dom.window.document });

  const pre = dom.window.document.querySelector('pre.mermaid');
  const label = pre.querySelector('.code-language-label');
  assert.strictEqual(label, null);
});

test('extractLanguage maps common language codes to display names', () => {
  const CodeLanguageLabel = require('../themes/evan/source/js/code-language-label.js');

  const dom = new JSDOM('<!doctype html><html><body></body></html>');

  const jsPre = dom.window.document.createElement('pre');
  jsPre.className = 'language-js';
  assert.equal(CodeLanguageLabel.extractLanguage(jsPre), 'JavaScript');

  const pyPre = dom.window.document.createElement('pre');
  pyPre.className = 'lang-py';
  assert.equal(CodeLanguageLabel.extractLanguage(pyPre), 'Python');

  const cppPre = dom.window.document.createElement('pre');
  cppPre.className = 'language-cpp';
  assert.equal(CodeLanguageLabel.extractLanguage(cppPre), 'C++');

  const goPre = dom.window.document.createElement('pre');
  goPre.className = 'lang-go';
  assert.equal(CodeLanguageLabel.extractLanguage(goPre), 'Go');
});

test('extractLanguage returns null for blocks without language class', () => {
  const CodeLanguageLabel = require('../themes/evan/source/js/code-language-label.js');

  const dom = new JSDOM('<!doctype html><html><body></body></html>');

  const pre1 = dom.window.document.createElement('pre');
  pre1.className = '';
  assert.strictEqual(CodeLanguageLabel.extractLanguage(pre1), null);

  const pre2 = dom.window.document.createElement('pre');
  pre2.className = 'code highlight';
  assert.strictEqual(CodeLanguageLabel.extractLanguage(pre2), null);
});

test('addLanguageLabel inserts label as first child of code block', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body>' +
      '<pre class="language-javascript"><code>const x = 1;</code></pre>' +
    '</body></html>'
  );

  const CodeLanguageLabel = require('../themes/evan/source/js/code-language-label.js');

  const pre = dom.window.document.querySelector('pre');
  CodeLanguageLabel.addLanguageLabel(pre, 'JavaScript', dom.window.document);

  const header = pre.querySelector('.code-block-header');
  assert.ok(header);

  const label = header.querySelector('.code-language-label');
  assert.ok(label);
  assert.equal(label.textContent, 'JavaScript');

  // Check that header is first child
  assert.equal(pre.firstChild, header);
});
