/**
 * @jest-environment jsdom
 */

require('../src/reading-progress-bar-v9.js');

describe('Reading Progress Bar v9', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="content" style="height: 2000px;">Content</div>
    `;
    // Mock dimensions
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    
    // Dispatch DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should inject a progress bar element into the DOM', () => {
    const bar = document.querySelector('.progress-bar-v9');
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('0%');
  });

  it('should update width when scrolling', () => {
    // Scroll halfway
    Object.defineProperty(window, 'scrollY', { value: 750, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    
    const bar = document.querySelector('.progress-bar-v9');
    expect(bar.style.width).toBe('50%');
  });

  it('should be 100% when at bottom', () => {
    Object.defineProperty(window, 'scrollY', { value: 1500, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    
    const bar = document.querySelector('.progress-bar-v9');
    expect(bar.style.width).toBe('100%');
  });
});
