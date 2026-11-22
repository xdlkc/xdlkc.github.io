const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const CodeCopy = require('../themes/evan/source/js/code-copy.js');
const CodeCollapse = require('../themes/evan/source/js/code-collapse.js');

function buildTallHighlightHtml(lang = 'python', lineCount = 12) {
  const lines = Array.from({ length: lineCount }, (_, i) => `<span class="line">print(${i + 1})</span>`).join('\n');
  return `<!doctype html>
  <html><body>
    <article class="article-content">
      <figure class="highlight ${lang}">
        <table><tbody><tr><td class="code"><pre>${lines}</pre></td></tr></tbody></table>
      </figure>
    </article>
  </body></html>`;
}

function setupDom(html) {
  const dom = new JSDOM(html, { url: 'https://example.com/' });
  global.window = dom.window;
  global.document = dom.window.document;
  const copied = [];
  Object.defineProperty(dom.window.navigator, 'clipboard', {
    value: {
      writeText: async (text) => {
        copied.push(text);
      }
    },
    configurable: true
  });
  Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    configurable: true
  });
  return { dom, copied };
}

test('CodeCopy + CodeCollapse share one toolbar with non-overlapping sibling buttons (copy first)', async () => {
  const { dom, copied } = setupDom(buildTallHighlightHtml('python', 12));
  const { document } = dom.window;

  CodeCopy.initCodeCopy({ root: document });
  CodeCollapse.initCodeCollapse({ document });

  const figure = document.querySelector('figure.highlight');
  const toolbars = figure.querySelectorAll('.code-block-toolbar');
  assert.equal(toolbars.length, 1);

  const langBadge = toolbars[0].querySelector('.code-block-lang');
  assert.ok(langBadge);
  assert.equal(langBadge.textContent, 'python');

  const actions = toolbars[0].querySelector('.code-block-actions');
  assert.ok(actions);
  const buttons = Array.from(actions.children);
  assert.equal(buttons.length, 2);
  assert.ok(buttons[0].classList.contains('code-collapse-button'));
  assert.ok(buttons[1].classList.contains('code-copy-button'));

  // Collapse button works independently
  buttons[0].click();
  assert.equal(figure.classList.contains('is-collapsed'), true);
  buttons[0].click();
  assert.equal(figure.classList.contains('is-collapsed'), false);

  // Copy button copies only code lines (never toolbar text)
  buttons[1].click();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(copied.length, 1);
  assert.ok(copied[0].startsWith('print(1)\nprint(2)'));
  assert.ok(!copied[0].includes('python'));
  assert.ok(!copied[0].includes('折叠'));
});

test('CodeCollapse + CodeCopy share one toolbar in consistent order (collapse first)', () => {
  const { dom } = setupDom(buildTallHighlightHtml('javascript', 12));
  const { document } = dom.window;

  CodeCollapse.initCodeCollapse({ document });
  CodeCopy.initCodeCopy({ root: document });

  const figure = document.querySelector('figure.highlight');
  assert.equal(figure.querySelectorAll('.code-block-toolbar').length, 1);

  const actions = figure.querySelector('.code-block-actions');
  const buttons = Array.from(actions.children);
  assert.equal(buttons.length, 2);
  assert.ok(buttons[0].classList.contains('code-collapse-button'));
  assert.ok(buttons[1].classList.contains('code-copy-button'));
});

test('code-collapse.css includes toolbar layout, syntax highlighting for light & dark, and inline code wrap fix', () => {
  const cssPath = path.resolve(__dirname, '../themes/evan/source/css/code-collapse.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Toolbar layout & non-overlapping static buttons
  assert.match(css, /\.code-block-toolbar/);
  assert.match(css, /\.code-block-actions/);
  assert.match(css, /position:\s*static/);

  // Light and dark/midnight theme syntax tokens
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /\[data-theme-palette="midnight"\]/);
  for (const token of ['.keyword', '.string', '.comment', '.number', '.title', '.built_in', '.attr']) {
    assert.ok(css.includes(`.highlight ${token}`), `Missing syntax rule for ${token}`);
  }

  // Inline code wrapping fix
  assert.match(css, /\.article-content\s+:not\(pre\)\s*>\s*code[\s\S]*word-break:\s*normal/);
  assert.match(css, /\.article-content\s+:not\(pre\)\s*>\s*code[\s\S]*overflow-wrap:\s*break-word/);
});
