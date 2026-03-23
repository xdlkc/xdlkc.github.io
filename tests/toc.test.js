
/**
 * @jest-environment jsdom
 */

// Mock the DOM for testing purposes
document.body.innerHTML = `
  <article class="article-container">
    <h2 id="heading-1">Section 1</h2>
    <p>Some content here.</p>
    <h3 id="sub-heading-1-1">Subsection 1.1</h3>
    <p>More content.</p>
    <h2 id="heading-2">Section 2</h2>
    <p>Even more content.</p>
    <h3 id="sub-heading-2-1">Subsection 2.1</h3>
    <h3 id="sub-heading-2-2">Subsection 2.2</h3>
  </article>
  <article class="article-no-headings">
    <p>This article has no headings.</p>
  </article>
`;

// In a real scenario, you might import your actual TOC generation script here.
// For now, we'll assume it will be globally available or imported.
// We expect these tests to fail initially because the functionality is not yet implemented.

describe('TOC and Anchor Navigation', () => {

  import { generateTocAndAnchors } from '../js/toc-generator';

  beforeEach(() => {
    // Reset DOM before each test to ensure isolation
    document.body.innerHTML = `
      <article class="article-container">
        <h2 id="heading-1">Section 1</h2>
        <p>Some content here.</p>
        <h3 id="sub-heading-1-1">Subsection 1.1</h3>
        <p>More content.</p>
        <h2 id="heading-2">Section 2</h2>
        <p>Even more content.</p>
        <h3 id="sub-heading-2-1">Subsection 2.1</h3>
        <h3 id="sub-heading-2-2">Subsection 2.2</h3>
      </article>
      <article class="article-no-headings">
        <p>This article has no headings.</p>
      </article>
    `;
    generateTocAndAnchors();
  });

  test('should generate TOC for articles with H2/H3 headings', () => {
    const articleWithHeadings = document.querySelector('.article-container');
    const toc = articleWithHeadings.querySelector('#article-toc');
    expect(toc).not.toBeNull();
  });

  test('should generate correct anchor IDs for H2/H3 headings', () => {
    const heading1 = document.querySelector('h2#heading-1');
    const subHeading1_1 = document.querySelector('h3#sub-heading-1-1');
    const heading2 = document.querySelector('h2#heading-2');

    expect(heading1.id).toBe('heading-1');
    expect(subHeading1_1.id).toBe('sub-heading-1-1');
    expect(heading2.id).toBe('heading-2');
  });

  test('should create TOC links pointing to correct anchor IDs', () => {
    const tocLinks = document.querySelectorAll('#article-toc a');
    expect(tocLinks.length).toBe(5); // 2 H2 + 3 H3

    expect(tocLinks[0].getAttribute('href')).toBe('#heading-1');
    expect(tocLinks[1].getAttribute('href')).toBe('#sub-heading-1-1');
    expect(tocLinks[2].getAttribute('href')).toBe('#heading-2');
    expect(tocLinks[3].getAttribute('href')).toBe('#sub-heading-2-1');
    expect(tocLinks[4].getAttribute('href')).toBe('#sub-heading-2-2');
  });

  test('should not generate TOC for articles without H2/H3 headings', () => {
    const articleNoHeadings = document.querySelector('.article-no-headings');
    const toc = articleNoHeadings.querySelector('#article-toc');
    expect(toc).toBeNull();
  });

});
