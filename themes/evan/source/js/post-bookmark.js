(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PostBookmark = factory();
  }
})(typeof window !== 'undefined' ? window : global, function () {
  'use strict';

  const STORAGE_KEY = 'xdlkc:bookmarks';
  const MAX_BOOKMARKS = 100;

  return {
    STORAGE_KEY: STORAGE_KEY,
    MAX_BOOKMARKS: MAX_BOOKMARKS,

    loadBookmarks: function() {
      try {
        const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem(this.STORAGE_KEY) : null;
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('Error loading bookmarks from localStorage:', e);
        return [];
      }
    },

    saveBookmarks: function(bookmarks) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
        }
      } catch (e) {
        console.error('Error saving bookmarks to localStorage:', e);
      }
    },

    isBookmarked: function(path) {
      const bookmarks = this.loadBookmarks();
      return bookmarks.some(b => b.path === path);
    },

    addBookmark: function(post) {
      let bookmarks = this.loadBookmarks();
      const existingIndex = bookmarks.findIndex(b => b.path === post.path);

      if (existingIndex > -1) {
        // Update existing bookmark (e.g., update title or savedAt)
        bookmarks[existingIndex] = { ...post, savedAt: Date.now() };
      } else {
        // Add new bookmark
        bookmarks.unshift({ ...post, savedAt: Date.now() });
      }

      // Enforce max limit, keeping the newest ones
      bookmarks = bookmarks.slice(0, this.MAX_BOOKMARKS);

      this.saveBookmarks(bookmarks);
    },

    removeBookmark: function(path) {
      let bookmarks = this.loadBookmarks();
      const filteredBookmarks = bookmarks.filter(b => b.path !== path);
      this.saveBookmarks(filteredBookmarks);
    },

    getBookmarks: function() {
      const bookmarks = this.loadBookmarks();
      return bookmarks.sort((a, b) => b.savedAt - a.savedAt);
    }
  };
});