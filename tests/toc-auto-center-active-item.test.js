
/**
 * @jest-environment jsdom
 */

// Mock IntersectionObserver as it's not available in jsdom by default
class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  observe(target) {
    // For testing purposes, we can immediately "intersect" if needed.
    // Or, we can manually trigger intersection later.
  }
  unobserve(target) {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserver;

describe('TOC active item auto-centering on scroll', () => {
  let tocContainer;
  let tocItems;
  let articleHeadings;

  beforeEach(() => {
    // Clear the document body before each test
    document.body.innerHTML = '';

    // Simulate a long article with headings
    document.body.innerHTML = `
      <div id="article-content">
        <h2 id="heading-1">Heading 1</h2>
        <div style="height: 1000px;"></div>
        <h2 id="heading-2">Heading 2</h2>
        <div style="height: 1000px;"></div>
        <h2 id="heading-3">Heading 3</h2>
        <div style="height: 1000px;"></div>
        <h2 id="heading-4">Heading 4</h2>
        <div style="height: 1000px;"></div>
        <h2 id="heading-5">Heading 5</h2>
        <div style="height: 1000px;"></div>
      </div>
      <div id="toc-container" style="height: 100px; overflow-y: scroll;">
        <a href="#heading-1" class="toc-item" data-target="heading-1">Heading 1</a>
        <a href="#heading-2" class="toc-item" data-target="heading-2">Heading 2</a>
        <a href="#heading-3" class="toc-item" data-target="heading-3">Heading 3</a>
        <a href="#heading-4" class="toc-item" data-target="heading-4">Heading 4</a>
        <a href="#heading-5" class="toc-item" data-target="heading-5">Heading 5</a>
      </div>
    `;

    tocContainer = document.getElementById('toc-container');
    // Mock clientHeight, scrollHeight, and scrollTop for tocContainer
    Object.defineProperty(tocContainer, 'clientHeight', { writable: true, value: 100 }); // Visible height of TOC
    Object.defineProperty(tocContainer, 'scrollHeight', { writable: true, value: 200 }); // Total scrollable height (more than clientHeight means scrollable)
    Object.defineProperty(tocContainer, 'scrollTop', { writable: true, value: 0 }); // Initial scroll position

    tocItems = Array.from(document.querySelectorAll('.toc-item'));
    articleHeadings = Array.from(document.querySelectorAll('#article-content h2'));

    // Mock scrollIntoView and layout properties for tocItems
    tocItems.forEach((item, index) => {
      item.scrollIntoView = jest.fn();
      item.offsetTop = index * 30; // 0, 30, 60, 90, 120 (each item starts 30px below the previous)
      item.offsetHeight = 20; // Each item is 20px high
    });

    // Mock getBoundingClientRect for article headings to simulate their position
    // This is crucial for scrollspy logic to determine which heading is active.
    articleHeadings.forEach((heading, index) => {
      heading.getBoundingClientRect = jest.fn(() => ({
        top: 100 - (window.scrollY + (index * 1000)), // Simulate heading positions relative to viewport
        bottom: 200 - (window.scrollY + (index * 1000)),
        left: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
      }));
    });

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    Object.defineProperty(document.documentElement, 'clientHeight', { writable: true, value: 800 }); // viewport height
  });

  // Helper to simulate scroll and trigger intersection callback
  const simulateScroll = (scrollYValue, intersectingHeadingIndex) => {
    window.scrollY = scrollYValue;

    // Simulate the IntersectionObserver callback
    // For this test, we'll manually set the active class for the target TOC item
    tocItems.forEach((item, index) => {
      if (index === intersectingHeadingIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Dispatch a scroll event to trigger any scroll listeners
    window.dispatchEvent(new Event('scroll'));
  };

  it('should auto-center the active TOC item when it goes out of view (downward scroll)', () => {
    // Simulate initial state where heading-1 is active and toc-item-1 is in view
    // Start with tocContainer scrolled down so that toc-item-3 (index 2, offsetTop 60) is initially out of view (above current scroll).
    // tocContainer.clientHeight = 100. If scrollTop = 80, visible area is 80-180. Item 2 (60-80) is above.
    Object.defineProperty(tocContainer, 'scrollTop', { writable: true, value: 80 });

    // Simulate scrolling down to activate heading 3.
    simulateScroll(2100, 2); // Heading 3 active

    expect(tocItems[2].scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('should auto-center the active TOC item when it goes out of view (upward scroll)', () => {
    // Simulate initial state where heading-5 is active and off-screen bottom
    simulateScroll(4100, 4); // Heading 5 active

    // For 'upward scroll' test, we want to scroll from item 4 to item 2, with item 2 initially off-screen.
    // Let's set tocContainer.scrollTop such that item 2 (offsetTop 60) is below the view (e.g. scrollTop 0, view 0-100).
    Object.defineProperty(tocContainer, 'scrollTop', { writable: true, value: 0 });

    // Simulate scrolling up to make heading-3 active
    simulateScroll(2100, 2); // Scroll to Heading 3 (index 2)

    // Expect scrollIntoView to be called for the active item (toc-item-3)
    expect(tocItems[2].scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('should not call scrollIntoView if the active TOC item is already fully in view', () => {
    // Simulate initial state where heading-1 is active and in view
    simulateScroll(0, 0);

    // Assume toc-item-1 is in view
    // For this test, ensure the active item (heading 2, toc-item-2 with offsetTop 30) is initially in view.
    // With clientHeight 100, scrollTop 0, items at offset 0, 30, 60 are in view.
    Object.defineProperty(tocContainer, 'scrollTop', { writable: true, value: 0 });

    // Simulate scrolling to a new heading, but one that is still in view in the TOC
    simulateScroll(1100, 1); // Heading 2 active

    // Expect scrollIntoView not to be called for the active item (toc-item-2)
    expect(tocItems[1].scrollIntoView).not.toHaveBeenCalled();
  });
});
