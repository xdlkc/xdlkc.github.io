(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PostBookmarkUI = factory();
  }
}(typeof window !== 'undefined' ? window : global, function () {
  'use strict';

  const PostBookmark = (typeof window !== 'undefined' && window.PostBookmark) || {
    STORAGE_KEY: 'xdlkc:bookmarks',
    MAX_BOOKMARKS: 100,
    loadBookmarks: function() { return []; },
    saveBookmarks: function(bookmarks) {},
    isBookmarked: function(path) { return false; },
    addBookmark: function(post) {},
    removeBookmark: function(path) {},
    getBookmarks: function() { return []; }
  };

  function initPostBookmark() {
    const bookmarkButtons = document.querySelectorAll('[data-post-bookmark]');

    bookmarkButtons.forEach(button => {
      const postPath = button.dataset.postPath;
      const postTitle = button.dataset.postTitle;

      // Check if already bookmarked
      updateBookmarkButton(button, postPath);

      // Add click handler
      button.addEventListener('click', function() {
        if (PostBookmark.isBookmarked(postPath)) {
          PostBookmark.removeBookmark(postPath);
        } else {
          PostBookmark.addBookmark({ path: postPath, title: postTitle });
        }
        updateBookmarkButton(button, postPath);
      });
    });

    // Update bookmark count on all bookmark buttons
    updateAllBookmarkCounts();
  }

  function updateBookmarkButton(button, postPath) {
    const isBookmarked = PostBookmark.isBookmarked(postPath);
    const bookmarks = PostBookmark.getBookmarks();

    button.textContent = isBookmarked ? '❤️ Unbookmark (' + bookmarks.length + ')' : '🔖 Bookmark (' + bookmarks.length + ')';
    button.setAttribute('aria-pressed', isBookmarked.toString());
    button.classList.toggle('is-bookmarked', isBookmarked);
  }

  function updateAllBookmarkCounts() {
    const bookmarks = PostBookmark.getBookmarks();
    const bookmarkButtons = document.querySelectorAll('[data-post-bookmark]');

    bookmarkButtons.forEach(button => {
      const postPath = button.dataset.postPath;
      const isBookmarked = PostBookmark.isBookmarked(postPath);
      button.textContent = isBookmarked ? '❤️ Unbookmark (' + bookmarks.length + ')' : '🔖 Bookmark (' + bookmarks.length + ')';
    });
  }

  return {
    initPostBookmark: initPostBookmark,
    updateBookmarkButton: updateBookmarkButton,
    updateAllBookmarkCounts: updateAllBookmarkCounts
  };
}));
