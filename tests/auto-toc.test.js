/**
 * @jest-environment jsdom
 */
const { generateTOC } = require('../js/auto-toc.js');

describe('Auto TOC', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="toc-container"></div>
            <div class="post-content">
                <h2>Title 1</h2>
                <h3>Subtitle 1</h3>
                <h2>Title 2</h2>
            </div>
        `;
    });

    test('generates toc items for h2 and h3', () => {
        generateTOC('.post-content', '.toc-container');
        const tocItems = document.querySelectorAll('.toc-container .toc-item');
        expect(tocItems.length).toBe(3);
        expect(tocItems[0].textContent).toBe('Title 1');
        expect(tocItems[1].textContent).toBe('Subtitle 1');
    });

    test('hides toc container if no headers', () => {
        document.body.innerHTML = '<div class="toc-container"></div><div class="post-content"><p>No headers here</p></div>';
        generateTOC('.post-content', '.toc-container');
        const tocContainer = document.querySelector('.toc-container');
        expect(tocContainer.style.display).toBe('none');
    });
});
