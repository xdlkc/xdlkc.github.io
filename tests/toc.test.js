/**
 * @jest-environment jsdom
 */

// Mock IntersectionObserver for scroll highlighting
class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observedElements = new Map();
  }

  observe(target) {
    this.observedElements.set(target, true);
  }

  unobserve(target) {
    this.observedElements.delete(target);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Helper to manually trigger intersection
  trigger(entryMap) {
    const entries = Array.from(this.observedElements.keys()).map(target => {
      const isIntersecting = entryMap[target.id] || false;
      return {
        target,
        isIntersecting: isIntersecting,
        intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRect: target.getBoundingClientRect(),
        rootBounds: document.documentElement.getBoundingClientRect(),
        time: Date.now(),
      };
    }).filter(Boolean);
    this.callback(entries, this);
  }
}

global.IntersectionObserver = IntersectionObserver;

// Mock window.scrollTo for smooth scroll testing
const mockScrollTo = jest.fn();
Object.defineProperty(window, 'scrollTo', { value: mockScrollTo, writable: true });

// Mock other global objects/properties needed for JSDOM and scrolling behavior
Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  writable: true,
  value: jest.fn(() => ({
    x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, // Default values
  })),
});
Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
  writable: true,
  value: 0, // Default value
});
Object.defineProperty(window, 'scrollY', {
  writable: true,
  value: 0
});
Object.defineProperty(window, 'pageYOffset', {
  writable: true,
  value: 0
});

describe('TOC and Anchor Navigation', () => {
  let TocScrollSpy;
  let intersectionObserverInstance;

  beforeEach(() => {
    // Reset JSDOM
    document.body.innerHTML = `
      <div id="article-content">
        <h2 id="heading-1">Heading 1</h2>
        <p>Some content...</p>
        <h3 id="subheading-1-1">Subheading 1.1</h3>
        <p>More content...</p>
        <h2 id="heading-2">Heading 2</h2>
        <p>Even more content...</p>
      </div>
      <aside id="toc-container">
        <nav>
          <ul class="toc-nav">
            <li><a href="#heading-1">Heading 1</a></li>
            <li><a href="#subheading-1-1">Subheading 1.1</a></li>
            <li><a href="#heading-2">Heading 2</a></li>
          </ul>
        </nav>
      </aside>
    `;

    // Ensure getBoundingClientRect returns meaningful values for headings
    // And offsetTop also has values
    document.getElementById('heading-1').getBoundingClientRect.mockReturnValue({ top: 100, height: 50 });
    Object.defineProperty(document.getElementById('heading-1'), 'offsetTop', { value: 100 });

    document.getElementById('subheading-1-1').getBoundingClientRect.mockReturnValue({ top: 300, height: 40 });
    Object.defineProperty(document.getElementById('subheading-1-1'), 'offsetTop', { value: 300 });

    document.getElementById('heading-2').getBoundingClientRect.mockReturnValue({ top: 600, height: 60 });
    Object.defineProperty(document.getElementById('heading-2'), 'offsetTop', { value: 600 });

    // Reset mocks
    mockScrollTo.mockClear();
    (Element.prototype.getBoundingClientRect).mockClear();
    window.scrollY = 0; // Reset scrollY
    window.pageYOffset = 0; // Reset pageYOffset

    // Mock IntersectionObserver to capture its instance
    jest.spyOn(global, 'IntersectionObserver').mockImplementation((callback, options) => {
      intersectionObserverInstance = new IntersectionObserver(callback, options);
      return intersectionObserverInstance;
    });

    // Dynamically import the module AFTER mocks are set up
    // Use `require` for CommonJS in Jest
    TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy.js')(document, window);

    // Initialize the module
    TocScrollSpy.initTocScrollSpy({
      tocSelector: '#toc-container .toc-nav',
      contentSelector: '#article-content',
      headingSelector: 'h2, h3',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockScrollTo.mockClear();
  });

  test('TOC links should trigger smooth scroll to the target heading', async () => {
    const tocLink = document.querySelector('a[href="#heading-1"]');
    const heading1 = document.getElementById('heading-1');

    tocLink.click();

    // Wait for the next tick for potential async scroll behavior from event listener
    await Promise.resolve();

    // Expect window.scrollTo to have been called for smooth scroll
    expect(mockScrollTo).toHaveBeenCalledWith(expect.objectContaining({
      top: heading1.offsetTop - (document.querySelector('.article-nav')?.getBoundingClientRect().height || 0) - 12,
      behavior: 'smooth',
    }));
  });

  test('TOC items should be highlighted based on scroll position (is-active class)', () => {
    const heading1 = document.getElementById('heading-1');
    const subheading1_1 = document.getElementById('subheading-1-1');
    const heading2 = document.getElementById('heading-2');

    const tocLink1 = document.querySelector('a[href="#heading-1"]').closest('li');
    const tocLink2 = document.querySelector('a[href="#subheading-1-1"]').closest('li');
    const tocLink3 = document.querySelector('a[href="#heading-2"]').closest('li');

    // Simulate heading-1 entering viewport
    // Trigger the IntersectionObserver callback manually
    intersectionObserverInstance.trigger({ 'heading-1': true });

    // Expect heading-1's TOC item to be active, others not
    expect(tocLink1.classList.contains('is-active')).toBe(true);
    expect(tocLink2.classList.contains('is-active')).toBe(false);
    expect(tocLink3.classList.contains('is-active')).toBe(false);

    // Simulate heading-2 entering viewport (heading-1 leaves)
    intersectionObserverInstance.trigger({ 'heading-1': false, 'heading-2': true });

    // Expect heading-2's TOC item to be active, others not
    expect(tocLink1.classList.contains('is-active')).toBe(false);
    expect(tocLink2.classList.contains('is-active')).toBe(false);
    expect(tocLink3.classList.contains('is-active')).toBe(true);
  });

  test('If TOC container is missing, initTocScrollSpy should do nothing', () => {
    document.body.innerHTML = '<div id="article-content"><h2>Test</h2></div>';
    const initSpy = jest.spyOn(TocScrollSpy, 'initTocScrollSpy');
    TocScrollSpy.initTocScrollSpy({ tocSelector: '#non-existent-toc .toc-nav' });
    expect(initSpy).toHaveBeenCalled(); // initTocScrollSpy itself is called
    // But no observer should be created, no error thrown, etc.
    expect(global.IntersectionObserver).not.toHaveBeenCalled();
    initSpy.mockRestore();
  });

  test('If no headings are found, TOC container should be hidden (desktop only)', () => {
    document.body.innerHTML = `
      <div id="article-content"><p>No headings</p></div>
      <aside class="toc-card toc-sidebar" data-toc-sidebar>
        <nav>
          <ul class="toc-nav"></ul>
        </nav>
      </aside>
    `;
    TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy.js')(document, window);
    TocScrollSpy.initTocScrollSpy({
      tocSelector: '#toc-container .toc-nav',
      contentSelector: '#article-content',
      headingSelector: 'h2, h3',
    });
    const desktopToc = document.querySelector('.toc-card');
    // It should be hidden if no headings are found OR the toc-nav has no links
    expect(desktopToc.hasAttribute('hidden')).toBe(true);
  });

  test('Heading IDs are correctly assigned if not already present', () => {
    document.body.innerHTML = `
      <div id="article-content">
        <h2>First Heading</h2>
        <h3 id="existing-id">Second Heading</h3>
        <h2>Another Heading</h2>
      </div>
      <aside id="toc-container">
        <nav><ul class="toc-nav"></ul></nav>
      </aside>
    `;

    TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy.js')(document, window);
    TocScrollSpy.initTocScrollSpy({
      tocSelector: '#toc-container .toc-nav',
      contentSelector: '#article-content',
      headingSelector: 'h2, h3',
    });

    const h1 = document.querySelector('h2');
    const h2 = document.querySelector('h3');
    const h3 = document.querySelectorAll('h2')[1];

    expect(h1.id).toBeDefined();
    expect(h1.id).not.toBe('');
    expect(h1.id).not.toBe('first-heading'); // Hexo's toc helper might slugify, but we are testing syncHeadingIdsWithToc

    expect(h2.id).toBe('existing-id'); // Existing ID should be preserved

    expect(h3.id).toBeDefined();
    expect(h3.id).not.toBe('');
    expect(h3.id).not.toBe('another-heading');

    // Verify that the TOC links are built correctly based on new IDs
    const tocLinks = document.querySelectorAll('#toc-container .toc-nav a');
    expect(tocLinks.length).toBe(3);
    expect(tocLinks[0].getAttribute('href')).toBe(`#${h1.id}`);
    expect(tocLinks[1].getAttribute('href')).toBe(`#${h2.id}`);
    expect(tocLinks[2].getAttribute('href')).toBe(`#${h3.id}`);
  });

  test('TOC should not be built if page.content contains no H2/H3 headings', () => {
    document.body.innerHTML = `
      <div id="article-content"><p>No headings</p></div>
      <aside id="toc-container">
        <nav>
          <ul class="toc-nav"></ul>
        </nav>
      </aside>
    `;

    TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy.js')(document, window);
    TocScrollSpy.initTocScrollSpy({
      tocSelector: '#toc-container .toc-nav',
      contentSelector: '#article-content',
      headingSelector: 'h2, h3',
    });

    const tocNav = document.querySelector('.toc-nav');
    expect(tocNav.children.length).toBe(0);
    const desktopToc = document.querySelector('.toc-card');
    expect(desktopToc.hasAttribute('hidden')).toBe(true); // Should be hidden if no TOC links generated
  });
});