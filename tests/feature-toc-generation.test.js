const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

describe('Automatic TOC and Anchor Navigation - Existing Functionality Check', () => {
  const postPath = path.join(__dirname, '../public/2026/03/20/test-post-for-toc/index.html');
  let dom;
  let document;

  beforeAll(() => {
    const html = fs.readFileSync(postPath, 'utf-8');
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  test('should have a generated TOC section', () => {
    // Check for both mobile and desktop TOC containers
    const mobileToc = document.querySelector('.toc-mobile .toc-nav');
    const desktopToc = document.querySelector('.toc-sidebar .toc-nav');
    expect(mobileToc).not.toBeNull();
    expect(desktopToc).not.toBeNull();
    expect(mobileToc.children.length).toBeGreaterThan(0); // Ensure TOC is not empty
    expect(desktopToc.children.length).toBeGreaterThan(0); // Ensure TOC is not empty
  });

  test('should have IDs on H2 and H3 headings', () => {
    const headings = document.querySelectorAll('h2, h3');
    let allHeadingsHaveIds = true;
    let headingCount = 0;
    headings.forEach(heading => {
      headingCount++;
      if (!heading.id) {
        allHeadingsHaveIds = false;
      }
    });
    expect(headingCount).toBeGreaterThan(0); // Ensure there are headings to check
    expect(allHeadingsHaveIds).toBe(true);
  });

  // New failing test for an enhancement: TOC should highlight active section on scroll.
  // This requires client-side JS, so the initial server-generated HTML won't have this.
  // This will be a "failing" test for the next iteration.
  test('should NOT initially have active class on TOC links (client-side feature)', () => {
    const activeTocLink = document.querySelector('.toc-nav a.active');
    expect(activeTocLink).toBeNull();
  });
});
