/**
 * @jest-environment jsdom
 */

const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

// Mock window and document for JSDOM
let dom;
let document;
let window;

// Function to set up a mock HTML environment
const setupHtml = (htmlContent) => {
  dom = new JSDOM(htmlContent, { url: "http://localhost/test-article" });
  document = dom.window.document;
  window = dom.window;

  // Add event listeners that would normally be present
  window.addEventListener = jest.fn((event, callback) => {
    window[`on${event}`] = callback;
  });
  window.removeEventListener = jest.fn();

  // Mock getBoundingClientRect for elements to simulate their position and size
  const mockGetBoundingClientRect = () => ({
    top: 0,
    bottom: document.body.scrollHeight, // Simulate article content filling the height
    height: document.body.scrollHeight,
  });

  Object.defineProperty(window.HTMLElement.prototype, 'getBoundingClientRect', {
    value: mockGetBoundingClientRect,
    writable: true,
  });

  // Mock scrollY and innerHeight
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });

  // Mock documentElement.scrollHeight and clientHeight
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    get: () => document.body.scrollHeight,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    get: () => window.innerHeight,
    configurable: true,
  });
};

// Assuming the reading progress bar JS is loaded here and attached to the window
// For this failing test, we'll mock the module to ensure it's not actually working yet
jest.mock('../themes/evan/source/js/reading-progress', () => ({
  computeReadingProgressPercent: jest.fn(() => 0), // Always return 0 for now
}));


describe('Reading Progress Bar UI', () => {
  // Mock article content
  const articleHtml = `
    <html>
      <head>
        <title>Test Article</title>
        <style>
          body { margin: 0; height: 3000px; } /* Make body scrollable */
          #reading-progress-bar {
            position: fixed;
            top: 0;
            left: 0;
            height: 4px;
            background-color: blue;
            width: 0%; /* Initial width for CSS, but JS might not set it */
          }
        </style>
      </head>
      <body>
        <div id="reading-progress-bar"></div>
        <article class="post-content">
          <h1>Article Title</h1>
          <p>This is some content.</p>
          <div style="height: 2500px;">Long content to ensure scrolling</div>
          <p>End of content.</p>
        </article>
      </body>
    </html>
  `;

  beforeEach(() => {
    setupHtml(articleHtml);
    // Dynamically load the script that initializes the progress bar
    // This will simulate the script running in the browser
    // For the test to fail initially, this script needs to be empty or not correctly update the bar
    // So for now, we'll just assert against its initial state.
  });

  test('should initially have 0% width style for the progress bar', () => {
    const progressBar = document.getElementById('reading-progress-bar');
    expect(progressBar).toBeInTheDocument(); // Jest-dom matcher
    expect(progressBar.style.width).toBe('0%'); // Corrected: Expect '0%' from inline CSS
  });

  test('should not update progress bar width on scroll before implementation (failing test)', async () => {
    const progressBar = document.getElementById('reading-progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar.style.width).toBe('0%'); // Initial state as observed

    // Simulate scrolling down
    window.scrollY = 1000;
    // Manually trigger scroll event if the script relies on it
    if (window.onscroll) {
      window.onscroll();
    }
    
    // At this point, the `computeReadingProgressPercent` mock still returns 0,
    // and the script for updating the UI is not yet integrated.
    // So the width should *still* be 0%.
    // We expect it to *not* be 0% (i.e., updated) once the feature is implemented.
    expect(progressBar.style.width).not.toBe('0%'); // This is the intended failure
  });
});
