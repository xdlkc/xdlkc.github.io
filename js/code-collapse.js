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

    /**
     * Create collapse button
     */
    function createCollapseButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = BUTTON_CLASS;
        button.setAttribute('aria-label', '折叠代码');
        button.textContent = '▼';
        button.setAttribute('title', '折叠代码');
        return button;
    }

    /**
     * Toggle code block collapsed state
     */
    function toggleCodeBlock(codeBlock, options) {
        if (!codeBlock) return;

        const isCollapsed = codeBlock.classList.contains(COLLAPSED_CLASS);

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
            if (isCollapsed) {
                button.textContent = '▼';
                button.setAttribute('aria-label', '折叠代码');
                button.setAttribute('title', '折叠代码');
            } else {
                button.textContent = '▲';
                button.setAttribute('aria-label', '展开代码');
                button.setAttribute('title', '展开代码');
            }
        }

        // Persist state to localStorage
        const storage = getStorage(options);
        if (storage) {
            storage.setItem(STORAGE_KEY, JSON.stringify({ collapsed: !isCollapsed }));
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

        const codeBlocks = document.querySelectorAll('figure.highlight, pre.highlight');

        codeBlocks.forEach(codeBlock => {
            // Skip if already has collapse button
            if (codeBlock.querySelector(`.${BUTTON_CLASS}`)) return;

            // Only show collapse button for long code blocks
            if (!shouldShowCollapseButton(codeBlock)) return;

            const button = createCollapseButton();
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCodeBlock(codeBlock, options);
            });

            // Insert button at the beginning of code block
            const firstChild = codeBlock.firstChild;
            codeBlock.insertBefore(button, firstChild);

            // Restore saved state
            if (savedState.collapsed) {
                codeBlock.classList.add(COLLAPSED_CLASS);
                button.textContent = '▲';
                button.setAttribute('aria-label', '展开代码');
                button.setAttribute('title', '展开代码');
            }
        });
    }

    return {
        STORAGE_KEY,
        initCodeCollapse,
        toggleCodeBlock,
        shouldShowCollapseButton
    };
}));
