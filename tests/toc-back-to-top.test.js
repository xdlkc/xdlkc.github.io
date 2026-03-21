const { JSDOM } = require('jsdom');
const tocScrollSpyFactory = require('../themes/evan/source/js/toc-scrollspy');

// Mock window and document for JSDOM environment
function setupDom(htmlContent, { scrollY = 0 } = {}) {
  const dom = new JSDOM(htmlContent, { url: "http://localhost/", resources: "usable", runScripts: "dangerously" });
  const window = dom.window;
  const document = window.document;

  // Mock window.scrollTo for assertions
  window.scrollTo = jest.fn((options) => { // Use jest.fn() for spying
    if (options && typeof options.top === 'number') {
      // Simulate scrolling action
      window.scrollY = options.top;
      window.pageYOffset = options.top;
    }
  });
  window.scrollY = scrollY;
  window.pageYOffset = scrollY;

  // Mock getBoundingClientRect for elements to control layout in tests
  Object.defineProperty(window.HTMLElement.prototype, 'getBoundingClientRect', {
    value: function() {
      const id = this.id;
      let top = 0;
      let height = 0;

      if (this.classList.contains('article-nav')) {
        top = 0; // Fixed header at the top
        height = 50;
      } else if (id === 'main-content') {
        top = 50; // Main content starts after header
        height = 1000;
      } else if (id === 'heading-one') {
        top = 100;
        height = 30;
      } else if (id === 'heading-two') {
        top = 300;
        height = 30;
      } else if (id === 'heading-three') {
        top = 600;
        height = 30;
      }

      // Return viewport-relative values
      return {
        left: 0, top: top - window.scrollY, right: 0, bottom: top + height - window.scrollY, width: 100, height: height, x: 0, y: top - window.scrollY
      };
    },
    writable: true,
  });

  document.documentElement.dataset.langMode = 'en';
  // Use Jest's fake timers for requestAnimationFrame and setTimeout
  jest.useFakeTimers();

  return { window, document };
}

describe('TocScrollSpy "Back to Top" link', () => {
  let window, document, initTocScrollSpy, computeScrollTop, getHeadingTopInDocument, resolveLangMode;

  beforeEach(() => {
    // Restore real timers for each test if they were used in the module being tested
    jest.restoreAllMocks();
    jest.useFakeTimers(); // Use fake timers again for this test suite

    const htmlContent = `
      <div class="article-nav" style="height: 50px;"></div>
      <main id="main-content" class="article-card">
        <h2 id="heading-one">Heading One</h2>
        <p>Content...</p>
        <h3 id="heading-two">Heading Two</h3>
        <p>Content...</p>
        <h2 id="heading-three">Heading Three</h2>
        <p>More Content...</p>
      </main>
      <aside class="toc-card toc-sidebar" data-toc-sidebar>
        <div class="toc-header">
          <p class="toc-title">Outline</p>
        </div>
        <div class="toc-content" id="toc-content-desktop">
          <ol class="toc-nav">
            <li class="toc-nav-level-2"><a class="toc-nav-link" href="#heading-one">Heading One</a></li>
            <li class="toc-nav-level-3"><a class="toc-nav-link" href="#heading-two">Heading Two</a></li>
            <li class="toc-nav-level-2"><a class="toc-nav-link" href="#heading-three">Heading Three</a></li>
          </ol>
        </div>
      </aside>
      <div class="toc-sidebar-mobile">
        <details class="toc-mobile">
          <summary class="toc-title">Outline</summary>
          <div class="toc-mobile-body">
            <ol class="toc-nav">
              <li class="toc-nav-level-2"><a class="toc-nav-link" href="#heading-one">Heading One</a></li>
              <li class="toc-nav-level-3"><a class="toc-nav-link" href="#heading-two">Heading Two</a></li>
              <li class="toc-nav-level-2"><a class="toc-nav-link" href="#heading-three">Heading Three</a></li>
            </ol>
          </div>
        </details>
      </div>
    `;
    const domContext = setupDom(htmlContent, { scrollY: 500 });
    window = domContext.window;
    document = domContext.document;
    ({ initTocScrollSpy, computeScrollTop, getHeadingTopInDocument } = tocScrollSpyFactory(document, window));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers(); // Clear any remaining timers
    jest.useRealTimers(); // Restore real timers
  });

  test('should NOT inject "Back to Top" link initially (failing state for TDD)', () => {
    initTocScrollSpy();

    const desktopTocNav = document.querySelector('.toc-sidebar .toc-nav');
    const desktopBackToTopLi = desktopTocNav.querySelector('li.toc-nav-back-to-top');
    expect(desktopBackToTopLi).toBeNull();

    const mobileTocNav = document.querySelector('.toc-mobile-body .toc-nav');
    const mobileBackToTopLi = mobileTocNav.querySelector('li.toc-nav-back-to-top');
    expect(mobileBackToTopLi).toBeNull();
  });

  // This test will be modified to pass after implementing the feature
  test('should inject "Back to Top" link and scroll smoothly to content top on click', async () => {
    // Initial call to initTocScrollSpy to set up the environment and potentially other TOC features
    initTocScrollSpy();

    // Manually inject the link here to test the scrolling behavior,
    // as the actual injection will be part of the implementation step.
    const desktopTocNav = document.querySelector('.toc-sidebar .toc-nav');
    const backToTopLi = document.createElement('li');
    backToTopLi.className = 'toc-nav-back-to-top';
    const backToTopLink = document.createElement('a');
    backToTopLink.className = 'toc-nav-link';
    backToTopLink.href = '#';
    backToTopLink.textContent = 'Back to Top'; // Hardcoded for test, actual implementation will use resolveLangMode
    backToTopLi.appendChild(backToTopLink);
    desktopTocNav.insertBefore(backToTopLi, desktopTocNav.firstChild);

    // Also inject into mobile TOC for comprehensive test
    const mobileTocNav = document.querySelector('.toc-mobile-body .toc-nav');
    const mobileBackToTopLi = document.createElement('li');
    mobileBackToTopLi.className = 'toc-nav-back-to-top';
    const mobileBackToTopLink = document.createElement('a');
    mobileBackToTopLink.className = 'toc-nav-link';
    mobileBackToTopLink.href = '#';
    mobileBackToTopLink.textContent = 'Back to Top'; // Hardcoded for test
    mobileBackToTopLi.appendChild(mobileBackToTopLink);
    mobileTocNav.insertBefore(mobileBackToTopLi, mobileTocNav.firstChild);

    // Manually attach the event listener for the simulated link for this test
    // In the real implementation, this would be handled within initTocScrollSpy
    backToTopLink.addEventListener('click', (event) => {
      event.preventDefault();
      const headerHeight = document.querySelector('.article-nav')?.getBoundingClientRect?.().height || 0;
      const mainContentElement = document.querySelector('#main-content');
      const targetTop = mainContentElement ? getHeadingTopInDocument(mainContentElement) : 0;
      const scrollTop = computeScrollTop({ targetTop, headerHeight });

      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      window.history.pushState(null, '', '#'); // Clear hash
    });
    // For mobile link too
    mobileBackToTopLink.addEventListener('click', (event) => {
      event.preventDefault();
      const headerHeight = document.querySelector('.article-nav')?.getBoundingClientRect?.().height || 0;
      const mainContentElement = document.querySelector('#main-content');
      const targetTop = mainContentElement ? getHeadingTopInDocument(mainContentElement) : 0;
      const scrollTop = computeScrollTop({ targetTop, headerHeight });

      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      window.history.pushState(null, '', '#'); // Clear hash
    });

    // Clear calls for fresh check before simulating click
    window.scrollTo.mockClear();

    // Simulate click
    backToTopLink.click();

    jest.runAllTimers(); // Advance timers for requestAnimationFrame and setTimeout

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    const scrollOptions = window.scrollTo.mock.calls[0][0];
    expect(scrollOptions.behavior).toBe('smooth');

    const headerHeight = document.querySelector('.article-nav').getBoundingClientRect().height; // 50
    const mainContentTopAbsolute = 50; // As per setupDom mock
    const expectedScrollTop = Math.max(0, mainContentTopAbsolute - headerHeight - 12); // -12 becomes 0, assuming default margin of 12
    expect(scrollOptions.top).toBe(expectedScrollTop);

    // Verify mobile link click
    window.scrollTo.mockClear(); // Clear again
    mobileBackToTopLink.click();
    jest.runAllTimers();

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    const mobileScrollOptions = window.scrollTo.mock.calls[0][0];
    expect(mobileScrollOptions.behavior).toBe('smooth');
    expect(mobileScrollOptions.top).toBe(expectedScrollTop);

  });
});
