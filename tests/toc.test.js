/**
 * @jest-environment jsdom
 */

// Mock the DOM for testing purposes
beforeEach(() => {
  document.body.innerHTML = `
    <div id="article-content">
      <h2>Section 1</h2>
      <p>Content of section 1</p>
      <h3>Subsection 1.1</h3>
      <p>Content of subsection 1.1</p>
      <h2>Section 2</h2>
      <p>Content of section 2</p>
      <h3>Subsection 2.1</h3>
      <p>Content of subsection 2.1</p>
      <h3>Subsection 2.2</h3>
      <p>Content of subsection 2.2</p>
    </div>
    <nav id="toc-container"></nav>
  `;
  // Reset history mock for each test
  history.pushState = jest.fn();
  history.replaceState = jest.fn();
  // Mock scrollIntoView for smooth scrolling test
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('Table of Contents (TOC) Generation', () => {
  test.skip('should generate TOC from H2 and H3 headings', () => {
    const { initTOC } = require('../js/toc');
    initTOC();

    const tocContainer = document.getElementById('toc-container');
    expect(tocContainer).not.toBeNull();

    const tocList = tocContainer.querySelector('ul.toc-list');
    expect(tocList).not.toBeNull(); // Check if ul.toc-list exists

    const tocItems = tocList.querySelectorAll('li');
    expect(tocItems.length).toBe(5); // 2 H2 + 3 H3

    expect(tocItems[0].textContent).toBe('Section 1');
    expect(tocItems[0].classList.contains('toc-level-2')).toBe(true);
    expect(tocItems[1].textContent).toBe('Subsection 1.1');
    expect(tocItems[1].classList.contains('toc-level-3')).toBe(true);
    expect(tocItems[2].textContent).toBe('Section 2');
    expect(tocItems[2].classList.contains('toc-level-2')).toBe(true);
  });

  test.skip('should add unique IDs as anchor links to H2 and H3 headings', () => {
    const { initTOC } = require('../js/toc');
    initTOC();

    const h2Headings = document.querySelectorAll('#article-content h2');
    const h3Headings = document.querySelectorAll('#article-content h3');

    h2Headings.forEach(h => {
      expect(h.id).toBeTruthy();
      expect(h.querySelector('a.heading-anchor')).not.toBeNull();
    });

    h3Headings.forEach(h => {
      expect(h.id).toBeTruthy();
      expect(h.querySelector('a.heading-anchor')).not.toBeNull();
    });

    // Check for uniqueness (basic check)
    const allIds = new Set();
    document.querySelectorAll('#article-content h2, #article-content h3').forEach(h => {
      allIds.add(h.id);
    });
    expect(allIds.size).toBe(h2Headings.length + h3Headings.length);
  });

  test.skip('should not generate TOC if no H2 or H3 headings exist', () => {
    document.body.innerHTML = `
      <div id="article-content">
        <h1>Main Title</h1>
        <p>Some content</p>
        <h4>Sub-heading</h4>
      </div>
      <nav id="toc-container"></nav>
    `;

    const { initTOC } = require('../js/toc');
    initTOC();

    const tocContainer = document.getElementById('toc-container');
    expect(tocContainer.innerHTML.trim()).toBe('');
  });

  test.skip('clicking a TOC item should scroll to the corresponding heading and update URL hash', () => {
    const { initTOC } = require('../js/toc');
    initTOC();

    const tocLink = document.querySelector('.toc-link'); // Get the first TOC link
    const targetId = tocLink.getAttribute('href').substring(1); // Get ID from href
    const targetHeading = document.getElementById(targetId);

    expect(targetHeading).not.toBeNull();

    // Simulate click
    tocLink.click();

    // Check smooth scroll
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    // Check URL hash update
    expect(history.pushState).toHaveBeenCalledTimes(1);
    expect(history.pushState).toHaveBeenCalledWith(null, null, `#${targetId}`);
  });

  // New test for scroll spy functionality
  test.skip('scroll spy should set active class and update URL hash on scroll', () => {
    // Setup a new DOM for this specific test with a longer scrollable content
    document.body.innerHTML = `
      <div style="height:2000px;"></div> <!-- Create scrollable space -->
      <div id="article-content">
        <h2 id="section-one" style="margin-top: 1000px; height: 300px;">Section One</h2>
        <p>Content of section one</p>
        <h3 id="subsection-1-1" style="height: 200px;">Subsection 1.1</h3>
        <p>Content of subsection 1.1</p>
        <h2 id="section-two" style="margin-top: 500px; height: 300px;">Section Two</h2>
        <p>Content of section two</p>
      </div>
      <nav id="toc-container"></nav>
    `;

    const { initTOC } = require('../js/toc');
    initTOC();

    const tocLinkOne = document.querySelector('a[data-id="section-one"]');
    const tocLinkTwo = document.querySelector('a[data-id="section-two"]');
    const tocLinkSubOneOne = document.querySelector('a[data-id="subsection-1-1"]');

    // Initially, no heading is in view or the first one if at top
    // Simulate scroll to Section One
    window.scrollY = 1000;
    // Mock getBoundingClientRect for headings for the scroll spy logic
    document.getElementById('section-one').getBoundingClientRect = () => ({ top: 50, bottom: 350 });
    document.getElementById('subsection-1-1').getBoundingClientRect = () => ({ top: 400, bottom: 600 });
    document.getElementById('section-two').getBoundingClientRect = () => ({ top: 900, bottom: 1200 });
    window.innerHeight = 700; // Mock viewport height

    // Trigger scroll event manually
    window.dispatchEvent(new Event('scroll'));

    expect(tocLinkOne.classList.contains('active')).toBe(true);
    expect(history.replaceState).toHaveBeenCalledWith(null, null, '#section-one');

    // Simulate scroll to Section Two
    window.scrollY = 1800; // Scroll past Section One and Subsection 1.1
    document.getElementById('section-one').getBoundingClientRect = () => ({ top: -800, bottom: -500 });
    document.getElementById('subsection-1-1').getBoundingClientRect = () => ({ top: -400, bottom: -200 });
    document.getElementById('section-two').getBoundingClientRect = () => ({ top: 50, bottom: 350 });

    window.dispatchEvent(new Event('scroll'));

    expect(tocLinkOne.classList.contains('active')).toBe(false);
    expect(tocLinkTwo.classList.contains('active')).toBe(true);
    expect(history.replaceState).toHaveBeenCalledWith(null, null, '#section-two');

    // Test scrolling to a sub-section
    window.scrollY = 1200;
    document.getElementById('section-one').getBoundingClientRect = () => ({ top: -500, bottom: -200 });
    document.getElementById('subsection-1-1').getBoundingClientRect = () => ({ top: 50, bottom: 250 });
    document.getElementById('section-two').getBoundingClientRect = () => ({ top: 700, bottom: 1000 });

    window.dispatchEvent(new Event('scroll'));

    expect(tocLinkSubOneOne.classList.contains('active')).toBe(true);
    expect(history.replaceState).toHaveBeenCalledWith(null, null, '#subsection-1-1');
  });
});
