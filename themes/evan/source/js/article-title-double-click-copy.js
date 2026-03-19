(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArticleTitleDoubleClickCopy = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function initArticleTitleDoubleClickCopy() {
    const title = document.querySelector('.article-hero h1');
    if (!title) return;

    let clickCount = 0;
    let clickTimer = null;

    title.addEventListener('click', function() {
      clickCount++;

      if (clickCount === 1) {
        // First click - wait for potential second click
        clickTimer = setTimeout(function() {
          clickCount = 0; // Reset after timeout
        }, 300);
      } else if (clickCount === 2) {
        // Double click detected
        clearTimeout(clickTimer);
        clickCount = 0;

        const titleText = title.textContent.trim();
        if (!titleText) return;

        // Copy to clipboard
        navigator.clipboard.writeText(titleText).then(function() {
          showToast('标题已复制: ' + titleText);
        }).catch(function(err) {
          console.error('Copy failed:', err);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = titleText;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            showToast('标题已复制: ' + titleText);
          } catch (err) {
            console.error('Fallback copy failed:', err);
            showToast('复制失败');
          }
          document.body.removeChild(textArea);
        });
      }
    });

    // Add visual cue that title is double-clickable
    title.style.cursor = 'pointer';
    title.title = '双击复制标题';
  }

  function showToast(message) {
    // Check if there's already a toast
    let toast = document.querySelector('[data-article-title-copy-toast]');
    if (toast) {
      toast.remove();
    }

    // Create toast element
    toast = document.createElement('div');
    toast.className = 'article-title-copy-toast';
    toast.setAttribute('data-article-title-copy-toast', '');
    toast.textContent = message;

    // Add styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      animation: slideInDown 0.3s ease-out;
    `;

    // Add keyframe animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease-out';
      setTimeout(function() {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArticleTitleDoubleClickCopy);
  } else {
    initArticleTitleDoubleClickCopy();
  }

  return {
    init: initArticleTitleDoubleClickCopy
  };
});