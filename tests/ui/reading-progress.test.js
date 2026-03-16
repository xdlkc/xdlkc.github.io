const { describe, it, mock } = require('node:test');
const assert = require('node:assert');

// Mock the ReadingProgress module to test its logic
describe('Reading Progress Script', () => {
  it('should detect post page correctly', () => {
    const isPostPage = (path) => /^\/\d{4}\/\d{2}\/\d{2}\//.test(path);

    assert.strictEqual(isPostPage('/2026/03/17/test-post.html'), true);
    assert.strictEqual(isPostPage('/'), false);
    assert.strictEqual(isPostPage('/categories/test/'), false);
    assert.strictEqual(isPostPage('/tags/test/'), false);
  });

  it('should calculate progress correctly at different scroll positions', () => {
    const calculateProgress = (scrollTop, scrollHeight, clientHeight) => {
      if (scrollHeight <= clientHeight) {
        return 0;
      }
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      return Math.min(100, Math.max(0, progress));
    };

    // Top of page
    assert.strictEqual(calculateProgress(0, 2000, 1000), 0);

    // Middle of page
    assert.strictEqual(calculateProgress(500, 2000, 1000), 50);

    // Bottom of page
    assert.strictEqual(calculateProgress(1000, 2000, 1000), 100);

    // Short article (no scroll)
    assert.strictEqual(calculateProgress(0, 800, 1000), 0);

    // Edge cases
    assert.strictEqual(calculateProgress(-10, 2000, 1000), 0);
    assert.strictEqual(calculateProgress(1100, 2000, 1000), 100);
  });

  it('should update progress bar transform style', () => {
    const progressBarElement = {
      style: {
        transform: ''
      }
    };

    const setProgress = (value, element) => {
      element.style.transform = `scaleX(${value / 100})`;
    };

    setProgress(0, progressBarElement);
    assert.strictEqual(progressBarElement.style.transform, 'scaleX(0)');

    setProgress(50, progressBarElement);
    assert.strictEqual(progressBarElement.style.transform, 'scaleX(0.5)');

    setProgress(100, progressBarElement);
    assert.strictEqual(progressBarElement.style.transform, 'scaleX(1)');
  });

  it('should update ARIA attributes for accessibility', () => {
    const progressElement = {
      setAttribute: function(key, value) {
        this.attributes = this.attributes || {};
        this.attributes[key] = value;
      }
    };

    const setProgress = (value, element) => {
      element.setAttribute('aria-valuenow', Math.round(value));
    };

    setProgress(33.33, progressElement);
    assert.strictEqual(progressElement.attributes['aria-valuenow'], 33);

    setProgress(66.67, progressElement);
    assert.strictEqual(progressElement.attributes['aria-valuenow'], 67);
  });
});
