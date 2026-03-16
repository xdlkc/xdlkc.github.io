function generateTOC(containerSelector, tocContainerSelector) {
    const container = document.querySelector(containerSelector);
    const tocContainer = document.querySelector(tocContainerSelector);
    if (!container || !tocContainer) return;

    const headers = container.querySelectorAll('h2, h3');
    if (headers.length === 0) {
        tocContainer.style.display = 'none';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'toc-list';

    headers.forEach((header, index) => {
        if (!header.id) {
            header.id = 'heading-' + index;
        }
        const li = document.createElement('li');
        li.className = 'toc-item toc-' + header.tagName.toLowerCase();
        
        const a = document.createElement('a');
        a.href = '#' + header.id;
        a.textContent = header.textContent;
        
        li.appendChild(a);
        ul.appendChild(li);
    });

    tocContainer.appendChild(ul);
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateTOC };
}
