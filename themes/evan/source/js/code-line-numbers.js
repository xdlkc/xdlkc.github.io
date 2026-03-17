/**
 * Code Line Numbers
 * Adds line numbers to code blocks (<pre> and <figure.highlight>)
 *
 * Usage:
 *   - Include /js/code-line-numbers.js (defer)
 *   - Initialize: CodeLineNumbers.initCodeLineNumbers()
 */

(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CodeLineNumbers = factory();
  }

})(typeof window !== 'undefined' ? window : global, function () {
  'use strict';

  const STORAGE_KEY_LINE_NUMBERS = 'xdlkc:code-line-numbers-enabled';
  const DATA_ATTR_PROCESSED = 'data-code-line-numbers-processed';

  function countLines(codeContent) {
    if (!codeContent) return 0;
    const lines = codeContent.split(/\r?\n/);
    // Remove trailing empty line if present
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      return lines.length - 1;
    }
    return lines.length;
  }

  function createLineNumbers(count) {
    if (count <= 1) return null;

    const container = document.createElement('div');
    container.className = 'code-line-numbers';
    container.setAttribute('aria-hidden', 'true');
    container.setAttribute('data-code-line-numbers-processed', 'true');

    for (let i = 1; i <= count; i++) {
      const line = document.createElement('span');
      line.className = 'code-line-number';
      line.textContent = i;
      container.appendChild(line);
    }

    return container;
  }

  function findCodeBlocks(container) {
    const articleContent = container.querySelector('.article-content') || container;

    const blocksToProcess = [];

    // Find top-level <pre> blocks not inside <figure.highlight>
    const topLevelPreBlocks = Array.from(articleContent.querySelectorAll('pre')).filter(pre => {
      // If it has been processed, skip
      if (pre.hasAttribute(DATA_ATTR_PROCESSED)) return false;
      // If its direct parent is figure.highlight, it will be handled by figure.highlight
      if (pre.parentElement && pre.parentElement.tagName === 'FIGURE' && pre.parentElement.classList.contains('highlight')) {
        return false;
      }
      // If it is already inside a wrapper, skip (idempotency check)
      if (pre.closest('.code-line-numbers-wrapper')) return false;
      return true;
    });
    blocksToProcess.push(...topLevelPreBlocks);

    // Find top-level <figure.highlight> blocks
    const topLevelHighlightBlocks = Array.from(articleContent.querySelectorAll('figure.highlight')).filter(figure => {
      // If it has been processed, skip
      if (figure.hasAttribute(DATA_ATTR_PROCESSED)) return false;
      // If it is already inside a wrapper, skip (idempotency check)
      if (figure.closest('.code-line-numbers-wrapper')) return false;
      return true;
    });
    blocksToProcess.push(...topLevelHighlightBlocks);

    return blocksToProcess;
  }

  function shouldAddLineNumbers(codeBlock) {
    // Check if line numbers are enabled (via localStorage)
    const storage = typeof localStorage !== 'undefined' ? localStorage : null;
    const enabled = storage ? storage.getItem(STORAGE_KEY_LINE_NUMBERS) !== 'false' : true;

    if (!enabled) return false;

    // Check if code block has content
    const codeElement = codeBlock.tagName === 'FIGURE' ? codeBlock.querySelector('pre code, pre') : codeBlock.querySelector('code');
    if (!codeElement) return false;

    const codeContent = codeElement.textContent || codeElement.innerText;
    const lineCount = countLines(codeContent);

    // Only add line numbers if there are multiple lines
    return lineCount > 1;
  }

  function initCodeLineNumbers(options = {}) {
    const { containerSelector = 'body', document = typeof window !== 'undefined' ? window.document : null } = options;

    if (!document) return;

    const container = containerSelector ? document.querySelector(containerSelector) : document.body;
    if (!container) return;

    const codeBlocks = findCodeBlocks(container);

    codeBlocks.forEach(codeBlock => {
      if (!shouldAddLineNumbers(codeBlock)) {
        // Mark as processed even if no line numbers added
        codeBlock.setAttribute(DATA_ATTR_PROCESSED, 'true');
        return;
      }

      const codeElement = codeBlock.tagName === 'FIGURE' ? codeBlock.querySelector('pre') : codeBlock;
      if (!codeElement) return;

      const codeContent = codeElement.textContent || codeElement.innerText;
      const lineCount = countLines(codeContent);

      const lineNumbers = createLineNumbers(lineCount);
      if (!lineNumbers) return;

      // Wrap code element in a container if needed
      const wrapper = document.createElement('div');
      wrapper.className = 'code-line-numbers-wrapper';

      // Insert wrapper before the code element
      codeElement.parentNode.insertBefore(wrapper, codeElement);

      // Move code element into wrapper
      wrapper.appendChild(codeElement);

      // Insert line numbers before code element
      wrapper.insertBefore(lineNumbers, codeElement);

      // Mark both the original code block and the wrapper as processed
      codeBlock.setAttribute(DATA_ATTR_PROCESSED, 'true');
      wrapper.setAttribute(DATA_ATTR_PROCESSED, 'true');
    });
  }

  return {
    initCodeLineNumbers,
    STORAGE_KEY_LINE_NUMBERS
  };
});
