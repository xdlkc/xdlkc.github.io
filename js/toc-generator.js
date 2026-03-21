// js/toc-generator.js

document.addEventListener('DOMContentLoaded', () => {
    const articleContent = document.getElementById('article-content');
    const tocContainer = document.getElementById('toc-container');

    if (!articleContent || !tocContainer) {
        return; // Exit if article or toc container not found
    }

    const headings = articleContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocList = document.createElement('ul');
    tocList.classList.add('toc-list'); // Add a class for styling

    headings.forEach((heading, index) => {
        // Ensure heading has an ID for anchoring
        if (!heading.id) {
            // Create a slug from the heading text for a unique ID
            heading.id = 'toc-' + heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') + '-' + index;
        }

        // Create a list item for the TOC
        const listItem = document.createElement('li');
        listItem.classList.add(`toc-level-${heading.tagName.toLowerCase()}`); // Add level class

        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent;

        // Implement smooth scroll
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById(this.hash.substring(1)).scrollIntoView({
                behavior: 'smooth'
            });
            // Update URL hash without jumping
            history.pushState(null, '', this.hash);
        });

        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });

    tocContainer.appendChild(tocList);

    // --- Active State Highlighting (Basic implementation) ---
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.5 // Trigger when 50% of the heading is visible
    };

    const intersectionCallback = (entries, observer) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            const tocLink = tocContainer.querySelector(`a[href="#${id}"]`);

            if (tocLink) {
                if (entry.isIntersecting) {
                    tocLink.classList.add('active-toc-link');
                } else {
                    tocLink.classList.remove('active-toc-link');
                }
            }
        });
    };

    const observer = new IntersectionObserver(intersectionCallback, observerOptions);

    headings.forEach(heading => {
        observer.observe(heading);
    });
});
