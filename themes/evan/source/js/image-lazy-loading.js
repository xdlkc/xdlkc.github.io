/**
 * Image Lazy Loading Module
 * Adds lazy loading to images in article content
 */

function initImageLazyLoading({ root = document } = {}) {
  // Find all images within article content
  const articleContent = root.querySelector('.article-content');

  if (!articleContent) return;

  const images = articleContent.querySelectorAll('img');

  images.forEach(img => {
    // Skip if already has loading attribute
    if (img.hasAttribute('loading')) return;

    // Add loading="lazy" attribute
    img.setAttribute('loading', 'lazy');
  });
}

// Browser environment
if (typeof window !== 'undefined') {
  window.ImageLazyLoading = {
    initImageLazyLoading
  };
}

// Node.js environment (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initImageLazyLoading
  };
}
