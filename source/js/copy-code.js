document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre').forEach((block) => {
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerText = 'Copy';
        block.style.position = 'relative';
        button.style.position = 'absolute';
        button.style.top = '5px';
        button.style.right = '5px';
        
        button.addEventListener('click', () => {
            const code = block.querySelector('code');
            if(code) {
                navigator.clipboard.writeText(code.innerText).then(() => {
                    button.innerText = 'Copied!';
                    setTimeout(() => button.innerText = 'Copy', 2000);
                });
            }
        });
        
        block.appendChild(button);
    });
});
