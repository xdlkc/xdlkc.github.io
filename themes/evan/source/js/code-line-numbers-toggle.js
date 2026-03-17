/**
 * Code Line Numbers Toggle
 * Adds a button to toggle code line numbers on/off with persistence and keyboard shortcut.
 *
 * Usage:
 *   - Add a button with [data-code-line-numbers-toggle]
 *   - Include /js/code-line-numbers-toggle.js (defer)
 *   - Include /js/code-line-numbers.js (defer)
 */

(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['./code-line-numbers'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./code-line-numbers'));
  } else {
    root.CodeLineNumbersToggle = factory(root.CodeLineNumbers);
  }
})(typeof window !== 'undefined' ? window : global, function (CodeLineNumbers) {
  'use strict';

  const STORAGE_KEY = CodeLineNumbers.STORAGE_KEY_LINE_NUMBERS;
  const DATA_ATTR_PROCESSED = 'data-code-line-numbers-toggle-processed';

  function getEnabledState(storage = globalThis.localStorage) {
    try {
      const value = storage.getItem(STORAGE_KEY);
      // Default to true if not set
      return value === null ? true : value !== 'false';
    } catch {
      return true;
    }
  }

  function setEnabledState(enabled, storage = globalThis.localStorage) {
    try {
      storage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // ignore (private mode / disabled storage)
    }
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const el = target;

    try {
      if (el.matches?.('input, textarea, select')) return true;
    } catch {
      // ignore
    }

    try {
      if (el.isContentEditable) return true;
    } catch {
      // ignore
    }

    try {
      if (el.closest?.('[contenteditable="true"]')) return true;
    } catch {
      // ignore
    }

    const tag = String(el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;

    return false;
  }

  function toggleLineNumbers({ document, storage } = {}) {
    const currentState = getEnabledState(storage);
    const newState = !currentState;
    setEnabledState(newState, storage);

    // Refresh code line numbers in the document
    CodeLineNumbers.refreshCodeLineNumbers({ document });

    // Update button text and state
    const toggleButton = document.querySelector('[data-code-line-numbers-toggle]');
    if (toggleButton) {
      updateToggleButton(toggleButton, newState);
    }

    const toast = ensureLineNumbersToast({ document });
    const message = newState ? '行号已开启' : '行号已关闭';
    showLineNumbersToast(toast, message);
  }

  function updateToggleButton(button, enabled) {
    if (button) {
      button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      button.textContent = enabled ? '行号：开' : '行号：关';
      button.setAttribute('title', enabled ? '关闭行号 (l)' : '开启行号 (l)');
    }
  }

  function ensureLineNumbersToast({ document } = {}) {
    if (!document?.querySelector || !document?.createElement) return null;
    const existing = document.querySelector('.code-line-numbers-toast');
    if (existing) return existing;

    const toast = document.createElement('div');
    toast.className = 'code-line-numbers-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body?.appendChild?.(toast);
    return toast;
  }

  function showLineNumbersToast(toast, message, { window } = {}) {
    if (!toast) return;
    toast.textContent = String(message || '').trim();
    toast.classList.add('is-visible');

    const w = window || globalThis.window;
    try {
      w?.clearTimeout?.(showLineNumbersToast.timer);
      showLineNumbersToast.timer = w?.setTimeout?.(() => {
        toast.classList.remove('is-visible');
      }, 1400);
    } catch {
      // ignore
    }
  }

  function initCodeLineNumbersToggle({
    window = globalThis.window,
    document = globalThis.document,
    storage = globalThis.localStorage,
  } = {}) {
    if (!document?.querySelector) return;

    const toggleButton = document.querySelector('[data-code-line-numbers-toggle]');
    if (!toggleButton) return;
    if (toggleButton.dataset?.lineNumbersBound === '1') return;
    if (toggleButton.dataset) toggleButton.dataset.lineNumbersBound = '1';

    // Set initial state of the button
    const initialState = getEnabledState(storage);
    updateToggleButton(toggleButton, initialState);

    // Event listener for button click
    toggleButton.addEventListener('click', () => {
      toggleLineNumbers({ document, storage });
    });

    // Keyboard shortcut: press `l` to cycle line numbers mode
    if (window?.addEventListener && document?.documentElement?.dataset) {
      if (document.documentElement.dataset.lineNumbersShortcutBound !== '1') {
        document.documentElement.dataset.lineNumbersShortcutBound = '1';

        window.addEventListener('keydown', (event) => {
          if (!event) return;
          if (event.defaultPrevented) return;
          if (event.repeat) return;

          // Ignore modified key combos.
          if (event.metaKey || event.ctrlKey || event.altKey) return;

          const key = String(event.key || '').toLowerCase();
          if (key !== 'l') return;

          // Do not hijack typing.
          if (isTypingTarget(event.target) || isTypingTarget(document?.activeElement)) return;

          // Trigger the same behavior as click.
          try {
            toggleButton.click();
          } catch {
            // ignore
          }
        });
      }
    }

    // Initial application of line numbers based on saved state
    // This ensures line numbers are applied correctly on page load
    CodeLineNumbers.refreshCodeLineNumbers({ document });
  }

  // Auto-init in browsers.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.CodeLineNumbersToggle = window.CodeLineNumbersToggle || {};
    window.CodeLineNumbersToggle.init = initCodeLineNumbersToggle;
    window.addEventListener('DOMContentLoaded', () => initCodeLineNumbersToggle());
  }

  return {
    initCodeLineNumbersToggle,
  };
});