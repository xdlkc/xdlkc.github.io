/* Code Block Double-Click to Select
 *
 * Usage (post.ejs):
 *   - Include /js/code-block-double-click-select.js (defer)
 *   - Call window.CodeBlockDoubleClickSelect?.initCodeBlockDoubleClickSelect()
 *
 * Behavior:
 *   - Double-click on any code block selects all code text
 *   - Excludes line numbers, buttons, and other non-code elements
 */

function makeCodeBlockDoubleClickSelect({ document, window }) {
  function selectCodeContent(codeElement) {
    if (!codeElement) {
      return null;
    }

    const range = document.createRange();
    range.selectNodeContents(codeElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }

  function findCodeElementInBlock(block) {
    const codeEl = block.querySelector('code');
    return codeEl;
  }

  function handleDoubleClick(event) {
    const block = event.currentTarget;
    const codeElement = findCodeElementInBlock(block);

    if (codeElement) {
      selectCodeContent(codeElement);
    }
  }

  function isTargetGutter(target) {
    return target.closest('.gutter');
  }

  function isTargetButton(target) {
    return target.closest('button');
  }

  function shouldTriggerSelection(target) {
    if (isTargetGutter(target)) {
      return false;
    }
    if (isTargetButton(target)) {
      return false;
    }
    return true;
  }

  function initCodeBlockDoubleClickSelect() {
    if (!document?.querySelector) {
      return;
    }

    const codeBlocks = document.querySelectorAll('.article-content figure.highlight, .article-content pre');

    codeBlocks.forEach((block) => {
      if (block.dataset?.codeBlockDblClickBound === '1') {
        return;
      }
      if (block.dataset) {
        block.dataset.codeBlockDblClickBound = '1';
      }

      block.addEventListener('dblclick', (event) => {
        if (shouldTriggerSelection(event.target)) {
          handleDoubleClick(event);
        }
      });
    });
  }

  return {
    selectCodeContent,
    findCodeElementInBlock,
    handleDoubleClick,
    shouldTriggerSelection,
    initCodeBlockDoubleClickSelect,
  };
}

// Auto-expose for browsers
if (typeof window !== 'undefined') {
  window.CodeBlockDoubleClickSelect = makeCodeBlockDoubleClickSelect({
    document: globalThis.document,
    window: globalThis.window,
  });
}

// Exports for tests
if (typeof module !== 'undefined') {
  module.exports = makeCodeBlockDoubleClickSelect;
}
