/* Archive year collapsible sections with persistence.
 *
 * Browser usage:
 *   - Include /js/archive-year-collapsible.js (defer) on archive pages.
 *   - The HTML structure should be:
 *     <div class="archive-year" data-year="YYYY">
 *       <h2>YYYY</h2>
 *       <div class="archive-items-list">... articles ...</div>
 *     </div>
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArchiveYearCollapsible = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const STORAGE_KEY = 'xdlkc:archive:collapsed';

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function readCollapsedYears(storage) {
    if (!storage?.getItem) return new Set();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      const arr = safeJsonParse(raw, []);
      return new Set(Array.isArray(arr) ? arr.map(String).filter(Boolean) : []);
    } catch {
      return new Set();
    }
  }

  function writeCollapsedYears(storage, collapsedYears) {
    if (!storage?.setItem) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(Array.from(collapsedYears)));
    } catch {
      // ignore (private mode / disabled storage)
    }
  }

  function toggleYearCollapsed(yearDiv, year, collapsedSet, storage) {
    const isCollapsed = yearDiv.classList.toggle('is-collapsed');
    const btn = yearDiv.querySelector('.archive-year-collapse-btn');
    if (btn) {
      btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      btn.textContent = isCollapsed ? '+' : '-'; // Update button text
    }

    if (isCollapsed) {
      collapsedSet.add(year);
    } else {
      collapsedSet.delete(year);
    }
    writeCollapsedYears(storage, collapsedSet);
  }

  function initArchiveYearCollapsible({
    root = document,
    storage = globalThis.localStorage,
  } = {}) {
    if (!root?.querySelector) return;

    const archiveCard = root.querySelector('.archive-card');
    if (!archiveCard) return;

    // Idempotent: avoid binding multiple times.
    if (archiveCard.dataset?.archiveCollapsibleBound === '1') return;
    archiveCard.dataset.archiveCollapsibleBound = '1';

    const collapsedYears = readCollapsedYears(storage);

    const yearDivs = Array.from(archiveCard.querySelectorAll('.archive-year'));
    yearDivs.forEach(yearDiv => {
      const yearHeader = yearDiv.querySelector('h2');
      if (!yearHeader) return;

      const year = yearHeader.textContent.trim();
      if (!year) return;

      // Create button
      const btn = root.createElement('button');
      btn.className = 'archive-year-collapse-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Toggle visibility for year ${year}`);

      // Initially expanded
      let isCollapsed = false;
      if (collapsedYears.has(year)) {
        isCollapsed = true;
        yearDiv.classList.add('is-collapsed');
      }
      btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      btn.textContent = isCollapsed ? '+' : '-';

      // Inject button
      yearHeader.prepend(btn);

      // Add click listener
      btn.addEventListener('click', () => {
        toggleYearCollapsed(yearDiv, year, collapsedYears, storage);
      });
    });
  }

  // Auto-init in browsers.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.ArchiveYearCollapsible = window.ArchiveYearCollapsible || {};
    window.ArchiveYearCollapsible.initArchiveYearCollapsible = initArchiveYearCollapsible;
    window.addEventListener('DOMContentLoaded', () => {
      if (document.querySelector('.archive-card')) {
        initArchiveYearCollapsible();
      }
    });
  }

  // Exports for tests (CommonJS).
  return {
    STORAGE_KEY,
    readCollapsedYears,
    writeCollapsedYears,
    toggleYearCollapsed,
    initArchiveYearCollapsible,
  };
});
