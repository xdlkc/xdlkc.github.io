/* global NexT, CONFIG */

NexT.utils.autoGenerateTOC = function() {
    const container = document.querySelector('.post-content'); // Target the article content
    const tocContainer = document.querySelector('.post-toc'); // Target the TOC sidebar container

    if (!container || !tocContainer) return;

    const headers = container.querySelectorAll('h2, h3');
    if (headers.length === 0) {
        tocContainer.style.display = 'none'; // Hide if no headers
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'toc-list';

    let currentH2Item = null; // Keep track of the most recent H2 list item for nesting H3s

    headers.forEach((header) => {
        if (!header.id) {
            const textContent = header.textContent.trim();
            const baseSlug = textContent.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-]/g, '') // Remove special chars
                                      .replace(/\s+/g, '-') // Replace spaces with hyphens
                                      .toLowerCase();
            // Ensure unique ID, if already exists, append a number.
            let id = baseSlug;
            let counter = 0;
            while (document.getElementById(id)) {
                id = `${baseSlug}-${++counter}`;
            }
            header.id = id;
        }
        const listItem = document.createElement('li');
        listItem.className = `toc-item toc-${header.tagName.toLowerCase()} toc-level-${header.tagName.slice(1)}`;
        
        const link = document.createElement('a');
        link.href = '#' + header.id;
        link.textContent = header.textContent.trim(); // Ensure textContent is trimmed for display
        
        listItem.appendChild(link);

        if (header.tagName === 'H2') {
            ul.appendChild(listItem);
            currentH2Item = listItem; // This H2 is now the parent for subsequent H3s
        } else if (header.tagName === 'H3') {
            if (currentH2Item) {
                let subUl = currentH2Item.querySelector('ul.toc-sublist');
                if (!subUl) {
                    subUl = document.createElement('ul');
                    subUl.className = 'toc-sublist';
                    currentH2Item.appendChild(subUl);
                }
                subUl.appendChild(listItem);
            } else {
                // If an H3 appears before any H2, append to main list (or handle as error/flat)
                // For now, append to main list if no H2 parent found.
                ul.appendChild(listItem);
            }
        }
    });

    // Only append the TOC list if it has items
    if (ul.children.length > 0) {
        tocContainer.appendChild(ul);
    } else {
        tocContainer.style.display = 'none'; // Ensure container is hidden if no TOC items generated
    }
};
