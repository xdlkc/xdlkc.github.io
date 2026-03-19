// js/toc-toggle.js
// TOC Sidebar Toggle Functionality
// Handles expanding/collapsing the table of contents

(function initTocToggle() {
  const toggleButton = document.querySelector('[data-toc-toggle]');
  if (!toggleButton) return;

  const tocContentId = toggleButton.getAttribute('aria-controls');
  if (!tocContentId) return;

  const tocContent = document.getElementById(tocContentId);
  if (!tocContent) return;

  // Initialize state from localStorage or default to expanded
  const STORAGE_KEY = 'toc-expanded';
  const isExpanded = localStorage.getItem(STORAGE_KEY) !== 'false';

  // Apply initial state
  tocContent.style.display = isExpanded ? 'block' : 'none';
  toggleButton.setAttribute('aria-expanded', isExpanded.toString());
  toggleButton.textContent = isExpanded ? '折叠目录' : '展开目录';

  // Toggle function
  function toggleTOC() {
    const currentState = toggleButton.getAttribute('aria-expanded') === 'true';
    const newState = !currentState;

    // Update UI
    tocContent.style.display = newState ? 'block' : 'none';
    toggleButton.setAttribute('aria-expanded', newState.toString());
    toggleButton.textContent = newState ? '折叠目录' : '展开目录';

    // Save state to localStorage
    localStorage.setItem(STORAGE_KEY, newState.toString());
  }

  // Add click event listener
  toggleButton.addEventListener('click', toggleTOC);

  // Expose toggle function for external use (e.g., in tests)
  window.TocToggle = {
    toggle: toggleTOC,
    isExpanded: () => toggleButton.getAttribute('aria-expanded') === 'true'
  };
})();

// Run this file with `node js/toc-toggle.js` in a test environment.
if (typeof module !== 'undefined' && module.exports) {
  // For testing purposes, export the core logic
  const STORAGE_KEY = 'toc-expanded';

  function readState(mockStorage = null) {
    const storage = mockStorage || localStorage;
    return storage.getItem(STORAGE_KEY) !== 'false';
  }

  function saveState(expanded, mockStorage = null) {
    const storage = mockStorage || localStorage;
    storage.setItem(STORAGE_KEY, expanded.toString());
  }

  module.exports = { readState, saveState, STORAGE_KEY };
}
