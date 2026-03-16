document.addEventListener('DOMContentLoaded', () => {
    const codeBlocks = document.querySelectorAll('figure.highlight, pre');
    codeBlocks.forEach(block => {
        if (block.style) block.style.position = 'relative';
        
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerText = 'Copy';
        btn.style.cssText = 'position: absolute; top: 8px; right: 8px; font-size: 12px; cursor: pointer; border-radius: 4px; border: none; padding: 4px 8px; background: rgba(255,255,255,0.8); z-index: 10;';
        
        btn.addEventListener('click', async () => {
            let code = '';
            const codeContent = block.querySelector('.code');
            if (codeContent) {
                code = codeContent.innerText;
            } else {
                code = block.innerText;
                // remove 'Copy' text itself
                code = code.replace(/^Copy\n?/, '');
            }
            try {
                await navigator.clipboard.writeText(code);
                btn.innerText = 'Copied!';
                setTimeout(() => btn.innerText = 'Copy', 2000);
            } catch (err) {
                btn.innerText = 'Failed';
            }
        });
        block.appendChild(btn);
    });
});
