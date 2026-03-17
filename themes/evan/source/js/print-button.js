/* Print button for articles.
 *
 * Adds a print button to article hero that calls window.print().
 * Supports i18n (zh/en).
 *
 * Exposes window.PrintButton in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PrintButton = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function resolveLang(document) {
    // Default to zh if langMode is not set (blog's default language is zh-CN)
    const mode = document?.documentElement?.dataset?.langMode;
    return mode === 'en' ? 'en' : 'zh';
  }

  function buttonText({ lang = 'en' } = {}) {
    return lang === 'zh' ? '打印' : 'Print';
  }

  function buttonAriaLabel({ lang = 'en' } = {}) {
    return lang === 'zh' ? '打印此文章' : 'Print this article';
  }

  function updateButtonText({ button, lang } = {}) {
    if (!button) return;
    button.textContent = buttonText({ lang });
    button.setAttribute('aria-label', buttonAriaLabel({ lang }));
  }

  function injectButton({ root = document } = {}) {
    if (!root?.querySelector) return;

    // Check if button already exists
    const existing = root.querySelector('.article-hero [data-print-button]');
    if (existing) return existing;

    // Find the article hero
    const hero = root.querySelector('.article-hero');
    if (!hero) return null;

    // Create button
    const button = root.createElement('button');
    button.type = 'button';
    button.className = 'print-button';
    button.setAttribute('data-print-button', '');
    const lang = resolveLang(root);
    updateButtonText({ button, lang });

    // Find where to insert (after other buttons like code-line-numbers-toggle)
    const afterButton = hero.querySelector('.code-line-numbers-toggle, .article-link-copy');
    if (afterButton && afterButton.parentNode) {
      afterButton.parentNode.insertBefore(button, afterButton.nextSibling);
    } else {
      hero.appendChild(button);
    }

    // Add click handler
    button.addEventListener('click', () => {
      if (typeof window !== 'undefined' && window.print) {
        window.print();
      }
    });

    return button;
  }

  function initPrintButton({ root = document, window = globalThis.window } = {}) {
    if (!root?.querySelector) return;

    const button = injectButton({ root });
    if (!button) return;

    // Idempotent: prevent multiple bindings
    if (root.documentElement?.getAttribute?.('data-print-button-bound') === '1') return;
    root.documentElement?.setAttribute?.('data-print-button-bound', '1');

    // Listen for language change events
    if (window?.addEventListener && root.documentElement) {
      window.addEventListener('xdlkc:lang-change', () => {
        const lang = resolveLang(root);
        updateButtonText({ button, lang });
      });
    }
  }

  return {
    initPrintButton,
    buttonText,
    buttonAriaLabel,
    resolveLang,
    updateButtonText
  };
});
