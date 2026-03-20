/* Code block language label
 * Extracts language class from `<figure class="highlight {lang}">`
 * and injects a visual label `<span class="code-lang-label">{lang}</span>`
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CodeLangLabel = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function getLanguageName(figure) {
    const classes = Array.from(figure.classList || []);
    const lang = classes.find(c => c !== 'highlight' && c !== 'is-collapsed');
    return lang ? String(lang).toLowerCase() : '';
  }

  function initCodeLangLabel({ document = globalThis.document } = {}) {
    if (!document?.querySelectorAll) return;

    const codeBlocks = Array.from(document.querySelectorAll('.article-content figure.highlight'));
    if (codeBlocks.length === 0) return;

    codeBlocks.forEach(figure => {
      // Idempotent binding
      if (figure.getAttribute('data-code-lang-label') === '1') return;
      figure.setAttribute('data-code-lang-label', '1');

      const lang = getLanguageName(figure);
      if (!lang || lang === 'plain' || lang === 'text') return; // Skip meaningless or unknown languages

      const label = document.createElement('span');
      label.className = 'code-lang-label';
      label.textContent = lang;
      
      // Inject to the beginning of the figure
      figure.prepend(label);
    });
  }

  // Auto-init in browsers.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => initCodeLangLabel());
  }

  return {
    getLanguageName,
    initCodeLangLabel
  };
});
