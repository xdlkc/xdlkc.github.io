/* Quote copy button for selected text.
 *
 * - When user selects text in .article-content, show a small button.
 * - Clicking button copies formatted quote with attribution.
 * - Supports i18n (zh/en) for button text and toast.
 *
 * Exposes window.QuoteCopy in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QuoteCopy = factory();
    root.QuoteCopy?.initQuoteCopy?.();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const MIN_SELECTION_LENGTH = 5;

  function formatQuote({ text, title, url }) {
    const cleanedText = String(text || '')
      .split(/\r?\n/)
      .map(line => `> ${line.trim()}`)
      .join('\n');
    const cleanedTitle = String(title || '').trim();
    const cleanedUrl = String(url || '').trim();

    if (!cleanedText && !cleanedTitle && !cleanedUrl) return '';

    if (cleanedText && cleanedTitle && cleanedUrl) {
      return `${cleanedText}\n\n— [${cleanedTitle}](${cleanedUrl})`;
    }
    if (cleanedText && cleanedTitle) {
      return `${cleanedText}\n\n— ${cleanedTitle}`;
    }
    if (cleanedText && cleanedUrl) {
      return `${cleanedText}\n\n— ${cleanedUrl}`;
    }
    return cleanedText;
  }

  function shouldShowButton(selectedText) {
    return String(selectedText || '').trim().length >= MIN_SELECTION_LENGTH;
  }

  function calculateButtonPosition(selectionRect, { windowWidth, windowHeight } = {}) {
    const btnWidth = 80; // Approximate button width
    const btnHeight = 30; // Approximate button height
    const margin = 10; // Space between selection and button

    let x = selectionRect.left + (selectionRect.width / 2) - (btnWidth / 2);
    let y = selectionRect.top - btnHeight - margin; // Position above selection

    // Keep button within window bounds (simple heuristic)
    if (x < 0) x = margin;
    if (x + btnWidth > windowWidth) x = windowWidth - btnWidth - margin;
    if (y < 0) y = selectionRect.bottom + margin; // If no space above, position below

    return { x, y };
  }

  function resolveLang(document) {
    const mode = document?.documentElement?.dataset?.langMode
      || document?.documentElement?.getAttribute?.('data-lang-mode');
    return mode === 'en' ? 'en' : 'zh';
  }

  function buttonText({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Quote' : '引用';
  }

  function toastSuccessText({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Quote copied' : '引用已复制';
  }

  function toastFailureText({ lang = 'zh' } = {}) {
    return lang === 'en' ? 'Copy failed, please copy manually' : '复制失败，请手动复制';
  }

  function ensureQuoteCopyButton({ document } = {}) {
    let btn = document.querySelector('[data-quote-copy-button]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quote-copy-button';
      btn.setAttribute('data-quote-copy-button', '');
      btn.setAttribute('hidden', 'hidden');
      document.body.appendChild(btn);
    }
    return btn;
  }

  function ensureToast({ document } = {}) {
    let toast = document.querySelector('.quote-copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'quote-copy-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showToast(toast, message, { window } = {}) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    (window || globalThis).clearTimeout(showToast.timer);
    showToast.timer = (window || globalThis).setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1400);
  }

  function fallbackCopy(text, { document } = {}) {
    const area = document.createElement('textarea');
    area.value = String(text || '');
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const success = document.execCommand('copy');
    document.body.removeChild(area);
    if (!success) throw new Error('copy failed');
  }

  async function copyText(text, { navigator, document } = {}) {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    fallbackCopy(text, { document });
  }

  function initQuoteCopy({
    window = globalThis.window,
    document = globalThis.document,
    navigator = globalThis.navigator,
    location = globalThis.location
  } = {}) {
    if (!document?.querySelector) return;

    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    const quoteButton = ensureQuoteCopyButton({ document });
    const quoteToast = ensureToast({ document });

    // Get article metadata from <p data-article-title data-article-url> helper
    const articleMeta = document.querySelector('[data-article-title][data-article-url]');
    const articleTitle = articleMeta?.getAttribute('data-article-title') || document.title;
    const articleUrl = articleMeta?.getAttribute('data-article-url') || location.href;

    let currentSelection = '';
    let selectionRect = null;

    const hideButton = () => {
      quoteButton.setAttribute('hidden', 'hidden');
    };

    const showButton = () => {
      quoteButton.removeAttribute('hidden');
    };

    const updateButtonPosition = () => {
      if (!selectionRect) return;
      const { x, y } = calculateButtonPosition(selectionRect, {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });
      quoteButton.style.left = `${x}px`;
      quoteButton.style.top = `${y}px`;
    };

    quoteButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!currentSelection) return;

      const formattedQuote = formatQuote({
        text: currentSelection,
        title: articleTitle,
        url: articleUrl
      });

      try {
        await copyText(formattedQuote, { navigator, document });
        showToast(quoteToast, toastSuccessText({ lang: resolveLang(document) }), { window });
      } catch (err) {
        console.error('Failed to copy quote:', err);
        showToast(quoteToast, toastFailureText({ lang: resolveLang(document) }), { window });
      }
      hideButton();
    });

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      // Only show button for selections within the article content
      if (!articleContent.contains(selection.anchorNode) && !articleContent.contains(selection.focusNode)) {
        hideButton();
        return;
      }

      if (shouldShowButton(selectedText)) {
        currentSelection = selectedText;
        const range = selection.getRangeAt(0);
        selectionRect = range.getBoundingClientRect();
        showButton();
        updateButtonPosition();
        quoteButton.textContent = buttonText({ lang: resolveLang(document) });
      } else {
        hideButton();
      }
    });

    document.addEventListener('mousedown', (event) => {
      if (!quoteButton.hidden && !quoteButton.contains(event.target) && !articleContent.contains(event.target)) {
        hideButton();
      }
    });

    // Update button position on scroll or resize
    window.addEventListener('scroll', () => {
      if (!quoteButton.hidden && selectionRect) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          selectionRect = range.getBoundingClientRect();
          updateButtonPosition();
        }
      }
    });
    window.addEventListener('resize', () => {
      if (!quoteButton.hidden && selectionRect) {
        updateButtonPosition();
      }
    });

    // Update button label on language change
    window.addEventListener('xdlkc:lang-change', () => {
      quoteButton.textContent = buttonText({ lang: resolveLang(document) });
    });
  }

  return {
    formatQuote,
    shouldShowButton,
    calculateButtonPosition,
    resolveLang,
    buttonText,
    toastSuccessText,
    toastFailureText,
    initQuoteCopy,
  };
});
