/**
 * Code Block Collapse Module
 * Adds collapse/expand functionality to code blocks
 */

(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.CodeCollapse = factory();
    }
}(typeof window !== 'undefined' ? window : global, function() {
    const STORAGE_KEY = 'xdlkc:code-collapse';
    const MIN_LINES = 10;
    const BUTTON_CLASS = 'code-collapse-button';
    const COLLAPSED_CLASS = 'is-collapsed';

    /**
     * Get storage (window.localStorage by default)
     */
    function getStorage(options) {
        return options && options.storage ? options.storage : (typeof window !== 'undefined' ? window.localStorage : null);
    }

    /**
     * Check if code block has enough lines to show collapse button
     */
    function shouldShowCollapseButton(codeBlock) {
        if (!codeBlock) return false;

        const lines = codeBlock.querySelectorAll('.line');
        return lines.length >= MIN_LINES;
    }

    function resolveLang(doc) {
        const d = doc || (typeof document !== 'undefined' ? document : null);
        const mode = d && d.documentElement && d.documentElement.dataset && d.documentElement.dataset.langMode;
        return mode === 'en' ? 'en' : 'zh';
    }

    function updateButtonState(button, isCollapsed, doc) {
        const lang = resolveLang(doc);
        if (isCollapsed) {
            button.textContent = lang === 'en' ? '▲ Expand' : '▲ 展开';
            button.setAttribute('aria-label', '展开代码');
            button.setAttribute('title', lang === 'en' ? 'Expand code' : '展开代码');
            button.setAttribute('aria-expanded', 'false');
        } else {
            button.textContent = lang === 'en' ? '▼ Collapse' : '▼ 折叠';
            button.setAttribute('aria-label', '折叠代码');
            button.setAttribute('title', lang === 'en' ? 'Collapse code' : '折叠代码');
            button.setAttribute('aria-expanded', 'true');
        }
    }

    /**
     * Ensure shared top toolbar exists for code block action buttons
     */
    function ensureCodeToolbar(codeBlock) {
        const doc = (codeBlock && codeBlock.ownerDocument) || document;
        let toolbar = codeBlock.querySelector('.code-block-toolbar');
        if (!toolbar) {
            toolbar = doc.createElement('div');
            toolbar.className = 'code-block-toolbar';
            codeBlock.insertBefore(toolbar, codeBlock.firstChild);
        }

        let actions = toolbar.querySelector('.code-block-actions');
        if (!actions) {
            actions = doc.createElement('div');
            actions.className = 'code-block-actions';
            toolbar.appendChild(actions);
        }

        return actions;
    }

    /**
     * Create collapse button
     */
    function createCollapseButton(doc) {
        const d = doc || document;
        const button = d.createElement('button');
        button.type = 'button';
        button.className = BUTTON_CLASS;
        updateButtonState(button, false, d);
        return button;
    }

    /**
     * Toggle code block collapsed state
     */
    function toggleCodeBlock(codeBlock, options) {
        if (!codeBlock) return;

        const isCollapsed = codeBlock.classList.contains(COLLAPSED_CLASS);
        const nextCollapsed = !isCollapsed;

        if (isCollapsed) {
            codeBlock.classList.remove(COLLAPSED_CLASS);
            codeBlock.classList.add('is-expanded');
        } else {
            codeBlock.classList.remove('is-expanded');
            codeBlock.classList.add(COLLAPSED_CLASS);
        }

        // Update button
        const button = codeBlock.querySelector(`.${BUTTON_CLASS}`);
        if (button) {
            updateButtonState(button, nextCollapsed, codeBlock.ownerDocument);
        }

        // Persist state to localStorage
        const storage = getStorage(options);
        if (storage) {
            storage.setItem(STORAGE_KEY, JSON.stringify({ collapsed: nextCollapsed }));
        }
    }

    /**
     * Initialize code collapse functionality
     */
    function initCodeCollapse(options) {
        const storage = getStorage(options);
        let savedState = { collapsed: false };

        // Restore state from localStorage
        if (storage) {
            try {
                const saved = storage.getItem(STORAGE_KEY);
                if (saved) {
                    savedState = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Failed to parse saved collapse state:', e);
            }
        }

        const doc = (options && options.document) || document;
        const codeBlocks = doc.querySelectorAll('figure.highlight, pre.highlight');

        codeBlocks.forEach(codeBlock => {
            // Skip if already has collapse button
            if (codeBlock.querySelector(`.${BUTTON_CLASS}`)) return;

            // Only show collapse button for long code blocks
            if (!shouldShowCollapseButton(codeBlock)) return;

            const button = createCollapseButton(doc);
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCodeBlock(codeBlock, options);
            });

            // Place collapse button in the shared toolbar before copy button (side-by-side)
            const actions = ensureCodeToolbar(codeBlock);
            const copyButton = actions.querySelector('.code-copy-button');
            if (copyButton) {
                actions.insertBefore(button, copyButton);
            } else {
                actions.appendChild(button);
            }

            // Restore saved state
            if (savedState.collapsed) {
                codeBlock.classList.add(COLLAPSED_CLASS);
                updateButtonState(button, true, doc);
            }
        });

        // Update button labels when site language toggles
        const win = (doc && doc.defaultView) || (typeof window !== 'undefined' ? window : null);
        if (doc && doc.documentElement && win && win.addEventListener) {
            if (doc.documentElement.getAttribute('data-code-collapse-lang-bound') !== '1') {
                doc.documentElement.setAttribute('data-code-collapse-lang-bound', '1');
                win.addEventListener('xdlkc:lang-change', () => {
                    doc.querySelectorAll('figure.highlight, pre.highlight').forEach((block) => {
                        const btn = block.querySelector(`.${BUTTON_CLASS}`);
                        if (btn) {
                            updateButtonState(btn, block.classList.contains(COLLAPSED_CLASS), doc);
                        }
                    });
                });
            }
        }
    }

    return {
        STORAGE_KEY,
        initCodeCollapse,
        toggleCodeBlock,
        shouldShowCollapseButton
    };
}));
