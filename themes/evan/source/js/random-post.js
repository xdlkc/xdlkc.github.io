/* Random post button - jump to a random article.
 *
 * Features:
 * - Randomly selects a post from all available posts
 * - Excludes the current post
 * - Works on desktop and mobile
 * - Supports keyboard navigation
 */

function isCurrentPost(post, currentPath) {
  if (!post) return false;
  if (!currentPath) return false;

  const postPath = typeof post === 'string' ? post : post.path;
  const current = typeof currentPath === 'string' ? currentPath : currentPath.path;

  if (!postPath || !current) return false;

  // Normalize paths (remove trailing slashes, query strings, hashes)
  const normalize = (p) => {
    return String(p)
      .replace(/\/+$/, '')
      .replace(/[?#].*$/, '')
      .toLowerCase();
  };

  return normalize(postPath) === normalize(current);
}

function filterAvailablePosts(posts, currentPost) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return [];
  }

  // Filter out the current post
  return posts.filter(post => !isCurrentPost(post, currentPost));
}

function selectRandomPost(posts, currentPost) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return null;
  }

  // If currentPost is not provided, select from all posts
  const availablePosts = currentPost
    ? filterAvailablePosts(posts, currentPost)
    : posts;

  if (availablePosts.length === 0) {
    return null;
  }

  // Randomly select a post
  const randomIndex = Math.floor(Math.random() * availablePosts.length);
  return availablePosts[randomIndex];
}

function initRandomPostButton({ window = globalThis.window, document = globalThis.document } = {}) {
  if (!document?.querySelector) return;

  const button = document.querySelector('[data-random-post]');
  if (!button) return;

  // Idempotent
  if (button.dataset.randomPostBound === '1') return;
  button.dataset.randomPostBound = '1';

  button.addEventListener('click', (event) => {
    event.preventDefault();

    // Get current page path
    const currentPath = window.location.pathname;

    // Get posts from data attribute (populated by Hexo)
    const postsData = button.dataset.posts;
    let posts = [];

    try {
      if (postsData) {
        posts = JSON.parse(postsData);
      }
    } catch (error) {
      console.error('Failed to parse posts data:', error);
      return;
    }

    // If no posts data, try to get from window object
    if (posts.length === 0 && window.sitePosts) {
      posts = window.sitePosts;
    }

    // Select a random post
    const selectedPost = selectRandomPost(posts, currentPath);

    if (!selectedPost || !selectedPost.path) {
      // If no random post available, go to home page
      window.location.href = window.location.origin + '/';
      return;
    }

    // Navigate to the selected post
    const targetUrl = selectedPost.path.startsWith('/')
      ? window.location.origin + selectedPost.path
      : selectedPost.path;

    window.location.href = targetUrl;
  });

  // Keyboard support: Enter/Space to trigger
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      button.click();
    }
  });
}

// Auto-init in browsers
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.RandomPost = window.RandomPost || {};
  window.RandomPost.init = initRandomPostButton;
  window.addEventListener('DOMContentLoaded', () => initRandomPostButton());
}

// Exports for tests (CommonJS)
if (typeof module !== 'undefined') {
  module.exports = {
    isCurrentPost,
    filterAvailablePosts,
    selectRandomPost,
    initRandomPostButton,
  };
}
