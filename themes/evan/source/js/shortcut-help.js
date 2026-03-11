/* Shortcut help overlay.
 *
 * UX:
 * - Press ? (Shift+/) to open/close when not typing.
 * - Press Escape or click mask to close.
 * - Optional trigger button: [data-shortcut-help-trigger]
 *
 * Exposes window.ShortcutHelp in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ShortcutHelp = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  function resolveLang(doc = document) {
    return doc?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
  }

  function isTypingTarget(target) {
    const el = target && target.nodeType === 1 ? target : null;
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = String(el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    const editableAncestor = el.closest?.('[contenteditable=""],[contenteditable="true"]');
    return !!editableAncestor;
  }

  function ensureDialog({ root = document } = {}) {
    const existing = root.querySelector?.('[data-shortcut-help-dialog]');
    if (existing) return existing;

    const dialog = root.createElement('div');
    dialog.className = 'shortcut-help';
    dialog.setAttribute('data-shortcut-help-dialog', '');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-hidden', 'true');

    const mask = root.createElement('div');
    mask.className = 'shortcut-help-mask';
    mask.setAttribute('data-shortcut-help-close', '');

    const panel = root.createElement('div');
    panel.className = 'shortcut-help-panel';
    panel.setAttribute('tabindex', '-1');

    const lang = resolveLang(root);

    const title = lang === 'zh' ? '快捷键' : 'Shortcuts';
    const closeText = lang === 'zh' ? '关闭' : 'Close';

    panel.innerHTML = `
      <div class="shortcut-help-head">
        <h2 class="shortcut-help-title">${title}</h2>
        <button class="shortcut-help-close" type="button" data-shortcut-help-close aria-label="${closeText}">×</button>
      </div>
      <div class="shortcut-help-body">
        <ul class="shortcut-help-list">
          <li><kbd>?</kbd> — ${lang === 'zh' ? '打开/关闭快捷键帮助' : 'Toggle this help'}</li>
          <li><kbd>/</kbd> — ${lang === 'zh' ? '打开站内搜索' : 'Open site search'}</li>
          <li><kbd>t</kbd> — ${lang === 'zh' ? '切换目录（TOC）显示' : 'Toggle TOC'}</li>
          <li><kbd>p</kbd> — ${lang === 'zh' ? '折叠/展开阅读进度条' : 'Collapse/expand reading progress'}</li>
          <li><kbd>Esc</kbd> — ${lang === 'zh' ? '关闭弹窗' : 'Close dialog'}</li>
        </ul>
      </div>
    `.trim();

    dialog.appendChild(mask);
    dialog.appendChild(panel);

    root.body?.appendChild?.(dialog);

    return dialog;
  }

  function openDialog(dialog, { trigger } = {}) {
    if (!dialog) return;
    if (dialog.getAttribute('aria-hidden') === 'false') return;

    // Save focus.
    try {
      dialog._xdlkcPrevFocus = trigger || (dialog.ownerDocument?.activeElement || null);
    } catch {
      dialog._xdlkcPrevFocus = null;
    }

    dialog.setAttribute('aria-hidden', 'false');
    dialog.classList.add('is-open');

    // Focus panel.
    try {
      const panel = dialog.querySelector('.shortcut-help-panel');
      panel?.focus?.();
    } catch {
      // ignore
    }
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (dialog.getAttribute('aria-hidden') === 'true') return;

    dialog.setAttribute('aria-hidden', 'true');
    dialog.classList.remove('is-open');

    // Restore focus.
    try {
      const prev = dialog._xdlkcPrevFocus;
      dialog._xdlkcPrevFocus = null;

      const doc = dialog.ownerDocument;
      const connected = prev && (prev.isConnected ? prev.isConnected : (doc?.contains ? doc.contains(prev) : true));
      if (prev && connected && typeof prev.focus === 'function') prev.focus();
    } catch {
      // ignore
    }
  }

  function toggleDialog(dialog, { trigger } = {}) {
    if (!dialog) return;
    const isOpen = dialog.getAttribute('aria-hidden') === 'false' || dialog.classList.contains('is-open');
    if (isOpen) closeDialog(dialog);
    else openDialog(dialog, { trigger });
  }

  function syncI18n(dialog, { lang } = {}) {
    if (!dialog) return;
    const panel = dialog.querySelector('.shortcut-help-panel');
    if (!panel) return;

    const nextLang = lang === 'zh' ? 'zh' : 'en';
    const title = nextLang === 'zh' ? '快捷键' : 'Shortcuts';
    const closeText = nextLang === 'zh' ? '关闭' : 'Close';

    const titleEl = dialog.querySelector('.shortcut-help-title');
    if (titleEl) titleEl.textContent = title;

    const closeBtn = dialog.querySelector('.shortcut-help-close');
    if (closeBtn) closeBtn.setAttribute('aria-label', closeText);

    const list = dialog.querySelector('.shortcut-help-list');
    if (!list) return;

    // Replace list items in a stable way (small DOM).
    list.innerHTML = `
      <li><kbd>?</kbd> — ${nextLang === 'zh' ? '打开/关闭快捷键帮助' : 'Toggle this help'}</li>
      <li><kbd>/</kbd> — ${nextLang === 'zh' ? '打开站内搜索' : 'Open site search'}</li>
      <li><kbd>t</kbd> — ${nextLang === 'zh' ? '切换目录（TOC）显示' : 'Toggle TOC'}</li>
      <li><kbd>p</kbd> — ${nextLang === 'zh' ? '折叠/展开阅读进度条' : 'Collapse/expand reading progress'}</li>
      <li><kbd>Esc</kbd> — ${nextLang === 'zh' ? '关闭弹窗' : 'Close dialog'}</li>
    `.trim();
  }

  function initShortcutHelp({ root = document } = {}) {
    if (!root?.querySelector) return;

    const dialog = ensureDialog({ root });

    // Close button / mask click.
    if (dialog.getAttribute('data-shortcut-help-bound') !== '1') {
      dialog.setAttribute('data-shortcut-help-bound', '1');

      dialog.addEventListener('click', (event) => {
        const target = event.target;
        if (!target) return;
        if (target.matches?.('[data-shortcut-help-close]')) {
          event.preventDefault?.();
          closeDialog(dialog);
          return;
        }

        // Click mask closes.
        if (target.classList?.contains('shortcut-help-mask')) {
          closeDialog(dialog);
        }
      });
    }

    // Trigger button.
    const trigger = root.querySelector('[data-shortcut-help-trigger]');
    if (trigger && trigger.getAttribute('data-shortcut-help-trigger-bound') !== '1') {
      trigger.setAttribute('data-shortcut-help-trigger-bound', '1');
      trigger.addEventListener('click', () => toggleDialog(dialog, { trigger }));
    }

    // Keyboard shortcut.
    if (root.documentElement?.getAttribute('data-shortcut-help-key-bound') !== '1') {
      root.documentElement?.setAttribute('data-shortcut-help-key-bound', '1');

      root.addEventListener('keydown', (event) => {
        if (!event || event.isComposing) return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        const key = String(event.key || '');

        // Escape closes.
        if (key === 'Escape') {
          if (dialog.getAttribute('aria-hidden') === 'false') {
            event.preventDefault?.();
            closeDialog(dialog);
          }
          return;
        }

        if (isTypingTarget(event.target)) return;

        // '?' can arrive as '?' (key) in jsdom; in some browsers Shift+/ => key='?'.
        // Also accept Shift+/'/' just in case.
        const isQuestionMark = key === '?' || (key === '/' && event.shiftKey);
        if (!isQuestionMark) return;

        event.preventDefault?.();
        toggleDialog(dialog, { trigger: root.activeElement });
      });
    }

    // React to language changes.
    const win = root.defaultView || globalThis.window;
    if (win?.addEventListener && root.documentElement?.getAttribute('data-shortcut-help-lang-bound') !== '1') {
      root.documentElement?.setAttribute('data-shortcut-help-lang-bound', '1');
      win.addEventListener('xdlkc:lang-change', () => {
        syncI18n(dialog, { lang: resolveLang(root) });
      });
    }

    // Initial i18n.
    syncI18n(dialog, { lang: resolveLang(root) });
  }

  // Auto-init.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.ShortcutHelp = window.ShortcutHelp || {};
    window.ShortcutHelp.initShortcutHelp = initShortcutHelp;
    window.addEventListener('DOMContentLoaded', () => initShortcutHelp({ root: document }));
  }

  return {
    initShortcutHelp,
    ensureDialog,
    openDialog,
    closeDialog,
    resolveLang,
  };
});
