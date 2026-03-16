document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('figure.highlight').forEach(block => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Copy';
        btn.style.position = 'absolute';
        btn.style.top = '5px';
        btn.style.right = '5px';
        
        block.style.position = 'relative';
        block.appendChild(btn);
        
        btn.addEventListener('click', () => {
            const code = block.querySelector('.code');
            if (code) {
                navigator.clipboard.writeText(code.innerText).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                });
            }
        });
    });
});
