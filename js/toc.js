// Auto TOC Generator
document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.post-content');
    if (!content) return;
    const headers = content.querySelectorAll('h1, h2, h3, h4');
    const toc = document.createElement('div');
    toc.className = 'article-toc';
    headers.forEach((h, i) => {
        if (!h.id) h.id = `heading-${i}`;
        const link = document.createElement('a');
        link.href = `#${h.id}`;
        link.textContent = h.textContent;
        toc.appendChild(link);
    });
    document.body.appendChild(toc);
});
