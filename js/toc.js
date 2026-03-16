// 简单的 TOC 生成脚本
function generateTOC(containerId, tocContainerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const headers = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc = document.getElementById(tocContainerId);
    if (!toc) return;
    
    let html = '<ul>';
    headers.forEach((h, i) => {
        const id = h.id || `toc-header-${i}`;
        h.id = id;
        html += `<li><a href="#${id}">${h.innerText}</a></li>`;
    });
    html += '</ul>';
    toc.innerHTML = html;
}
