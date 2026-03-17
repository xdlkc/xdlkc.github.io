/**
 * Code Copy Button Module
 * Adds copy buttons to code blocks and handles copy functionality
 */

(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.CodeCopy = factory();
    }
}(typeof window !== 'undefined' ? window : global, function() {
    const SELECTOR = 'figure.highlight, pre.highlight';
    const BUTTON_CLASS = 'code-copy-button';
    const SUCCESS_DURATION = 2000;

    function getCodeText(codeBlock) {
        const gutter = codeBlock.querySelector('.gutter');
        const code = codeBlock.querySelector('.code pre') || codeBlock.querySelector('pre');

        if (!code) return '';

        if (gutter) {
            const lines = Array.from(code.querySelectorAll('.line'))
                .map(line => line.textContent)
                .join('\n');
            return lines;
        }

        return code.textContent || '';
    }

    function createCopyButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = BUTTON_CLASS;
        button.setAttribute('aria-label', '复制代码');
        button.textContent = '📋';
        button.setAttribute('title', '复制代码');
        return button;
    }

    function showFeedback(button, success) {
        button.classList.remove('copied', 'error');
        void button.offsetWidth;

        if (success) {
            button.classList.add('copied');
            button.textContent = '✓';
            button.setAttribute('aria-label', '已复制');
        } else {
            button.classList.add('error');
            button.textContent = '✗';
            button.setAttribute('aria-label', '复制失败');
        }

        setTimeout(() => {
            button.classList.remove('copied', 'error');
            button.textContent = '📋';
            button.setAttribute('aria-label', '复制代码');
        }, SUCCESS_DURATION);
    }

    async function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('Clipboard API failed:', err);
            }
        }

        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        } catch (err) {
            console.error('Copy failed:', err);
            return false;
        }
    }

    async function handleCopyClick(event) {
        const button = event.currentTarget;
        const codeBlock = button.closest(SELECTOR);

        if (!codeBlock) return;

        const codeText = getCodeText(codeBlock);
        const success = await copyToClipboard(codeText);

        showFeedback(button, success);
    }

    function initCodeCopy() {
        const codeBlocks = document.querySelectorAll(SELECTOR);

        codeBlocks.forEach(codeBlock => {
            if (codeBlock.querySelector(`.${BUTTON_CLASS}`)) return;

            const button = createCopyButton();
            button.addEventListener('click', handleCopyClick);
            codeBlock.appendChild(button);
        });
    }

    return {
        initCodeCopy
    };
}));
