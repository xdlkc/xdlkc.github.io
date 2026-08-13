const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const Explorer = require('../themes/evan/source/js/deepseek-harness-explorer');

function makeExplorer() {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section data-dsh-explorer>
      <button data-dsh-view="all">全部</button>
      <button data-dsh-view="runtime">运行时</button>
      <button data-dsh-view="truth">持久事实</button>
      <div role="tablist">
        <button data-dsh-node="cordis" data-dsh-layer="runtime">Cordis</button>
        <button data-dsh-node="session" data-dsh-layer="truth">Session</button>
        <button data-dsh-node="loop" data-dsh-layer="runtime truth">Agent Loop</button>
      </div>
      <article data-dsh-panel="cordis">Cordis evidence</article>
      <article data-dsh-panel="session">Session evidence</article>
      <article data-dsh-panel="loop">Loop evidence</article>
    </section>
  </body></html>`, { url: 'https://example.com/deepseek-harness/' });
  return { dom, root: dom.window.document.querySelector('[data-dsh-explorer]') };
}

test('view switch marks unrelated nodes as context instead of deleting them', () => {
  const { root } = makeExplorer();
  Explorer.initExplorer(root);

  const runtimeButton = root.querySelector('[data-dsh-view="runtime"]');
  runtimeButton.click();

  assert.equal(root.dataset.dshActiveView, 'runtime');
  assert.equal(runtimeButton.getAttribute('aria-pressed'), 'true');
  assert.equal(root.querySelector('[data-dsh-node="session"]').dataset.dshMuted, 'true');
  assert.equal(root.querySelector('[data-dsh-node="loop"]').hasAttribute('data-dsh-muted'), false);
});

test('selecting a node reveals only its evidence and updates roving tabindex', () => {
  const { root } = makeExplorer();
  Explorer.initExplorer(root);

  root.querySelector('[data-dsh-node="session"]').click();

  assert.equal(root.dataset.dshActiveNode, 'session');
  assert.equal(root.querySelector('[data-dsh-node="session"]').tabIndex, 0);
  assert.equal(root.querySelector('[data-dsh-node="cordis"]').tabIndex, -1);
  assert.equal(root.querySelector('[data-dsh-panel="session"]').hidden, false);
  assert.equal(root.querySelector('[data-dsh-panel="cordis"]').hidden, true);
});

test('arrow keys move selection through nodes in document order', () => {
  const { dom, root } = makeExplorer();
  Explorer.initExplorer(root);

  const first = root.querySelector('[data-dsh-node="cordis"]');
  first.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  assert.equal(root.dataset.dshActiveNode, 'session');
  assert.equal(dom.window.document.activeElement.dataset.dshNode, 'session');
});

test('initialisation is idempotent', () => {
  const { root } = makeExplorer();
  Explorer.initExplorer(root);
  Explorer.initExplorer(root);

  assert.equal(root.dataset.dshBound, 'true');
  assert.equal(root.querySelectorAll('[data-dsh-node][aria-selected="true"]').length, 1);
});
