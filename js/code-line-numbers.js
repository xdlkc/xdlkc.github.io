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
    const preBlocks = container.querySelectorAll('article .article-content pre:not([data-code-line-numbers-processed])');
    const highlightBlocks = container.querySelectorAll('article .article-content figure.highlight:not([data-code-line-numbers-processed])');

    return Array.from(preBlocks).concat(Array.from(highlightBlocks));
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

      codeBlock.setAttribute(DATA_ATTR_PROCESSED, 'true');
    });
  }

  return {
    initCodeLineNumbers,
    STORAGE_KEY_LINE_NUMBERS
  };
});
