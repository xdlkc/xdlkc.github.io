const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const CodeCopy = require('../js/code-copy');

function setupDom(codeContent = 'console.log("Hello");', langMode = 'zh') {
  const dom = new JSDOM(`<!doctype html><html data-lang-mode="${langMode}"><body>
    <article class="article-content">
      <figure class="highlight">
        <table>
          <tbody>
            <tr>
              <td class="gutter">
                <pre><span class="line">1</span></pre>
              </td>
              <td class="code">
                <pre><span class="line">${codeContent}</span></pre>
              </td>
            </tr>
          </tbody>
        </table>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = {
    clipboard: {
      writeText: async (text) => { /* mock successful copy */ }
    }
  };

  return { dom, window, document, navigator: global.navigator };
}

test('Code Copy Button: shows "Copied" feedback on button and container, then reverts', async () => {
  const { dom, window, document, navigator } = setupDom();

  // Mock setTimeout to control time
  const originalSetTimeout = window.setTimeout;
  const originalClearTimeout = window.clearTimeout;
  const timeouts = {};
  let timeoutIdCounter = 0;

  window.setTimeout = (fn, delay) => {
    const id = ++timeoutIdCounter;
    timeouts[id] = { fn, delay, called: false };
    return id;
  };
  window.clearTimeout = (id) => {
    delete timeouts[id];
  };

  // Function to run pending timeouts
  function advanceTimersByTime(ms) {
    for (const id in timeouts) {
      if (timeouts[id].delay <= ms && !timeouts[id].called) {
        timeouts[id].fn();
        timeouts[id].called = true;
      }
    }
  }

  CodeCopy.initCodeCopy({ root: document });
  const codeBlockContainer = document.querySelector('.highlight');
  const copyButton = document.querySelector('.highlight .code-copy-button');

  assert.ok(copyButton, 'copy button should be added');
  assert.strictEqual(copyButton.textContent, '复制代码', 'Initial button text should be "复制代码"');
  assert.ok(!codeBlockContainer.classList.contains('is-copied'), 'Container should not have is-copied class initially');

  // Simulate click
  copyButton.click();

  // Allow microtasks to resolve (for async copyText mock to complete)
  await Promise.resolve();
  await Promise.resolve(); // Double resolve to be sure

  // Expect feedback immediately after click (after async handler settles)
  assert.match(copyButton.textContent, /^已复制（\d+ 行）$/, 'Button text should change to "已复制（X 行）"');
  assert.ok(codeBlockContainer.classList.contains('is-copied'), 'Container should have is-copied class after copy');

  // Advance timers to trigger the timeout that reverts the text and removes the class
  advanceTimersByTime(1200);

  // Expect text and class to revert after timeout
  assert.strictEqual(copyButton.textContent, '复制代码', 'Button text should revert to "复制代码" after timeout');
  assert.ok(!codeBlockContainer.classList.contains('is-copied'), 'Container should not have is-copied class after timeout');

  // Restore original setTimeout and clearTimeout
  window.setTimeout = originalSetTimeout;
  window.clearTimeout = originalClearTimeout;
});
