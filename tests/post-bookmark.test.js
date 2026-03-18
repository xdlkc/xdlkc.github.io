/* Tests for post bookmark functionality.
 *
 * Run with: npm test -- tests/post-bookmark.test.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// Simulate a browser environment using JSDOM
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { url: "http://localhost" });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.HTMLElement = dom.window.HTMLElement;
global.CustomEvent = dom.window.CustomEvent;


// Mock localStorage for testing
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Import the module after setting up mock localStorage
global.localStorage = new LocalStorageMock();

const PostBookmark = require('../themes/evan/source/js/post-bookmark.js');

test('STORAGE_KEY should have a defined storage key', () => {
  assert.strictEqual(typeof PostBookmark.STORAGE_KEY, 'string');
  assert.ok(PostBookmark.STORAGE_KEY.length > 0);
});

test('MAX_BOOKMARKS should have a defined max bookmarks limit', () => {
  assert.strictEqual(typeof PostBookmark.MAX_BOOKMARKS, 'number');
  assert.ok(PostBookmark.MAX_BOOKMARKS > 0);
});

test('loadBookmarks should return empty array when no bookmarks exist', () => {
  global.localStorage.clear();
  const bookmarks = PostBookmark.loadBookmarks();
  assert.deepStrictEqual(bookmarks, []);
});

test('loadBookmarks should parse and return saved bookmarks', () => {
  global.localStorage.clear();
  const testData = [
    { path: '/post-1', title: 'Post 1', savedAt: 1234567890 },
    { path: '/post-2', title: 'Post 2', savedAt: 1234567891 }
  ];
  global.localStorage.setItem(PostBookmark.STORAGE_KEY, JSON.stringify(testData));

  const bookmarks = PostBookmark.loadBookmarks();
  assert.deepStrictEqual(bookmarks, testData);
});

test('loadBookmarks should handle corrupted JSON gracefully', () => {
  global.localStorage.clear();
  global.localStorage.setItem(PostBookmark.STORAGE_KEY, 'invalid json');

  const bookmarks = PostBookmark.loadBookmarks();
  assert.deepStrictEqual(bookmarks, []);
});

test('saveBookmarks should save bookmarks to localStorage', () => {
  global.localStorage.clear();
  const testData = [
    { path: '/post-1', title: 'Post 1', savedAt: 1234567890 }
  ];

  PostBookmark.saveBookmarks(testData);

  const saved = JSON.parse(global.localStorage.getItem(PostBookmark.STORAGE_KEY));
  assert.deepStrictEqual(saved, testData);
});

test('isBookmarked should return false for non-existent bookmark', () => {
  global.localStorage.clear();
  const result = PostBookmark.isBookmarked('/post-1');
  assert.strictEqual(result, false);
});

test('isBookmarked should return true for existing bookmark', () => {
  global.localStorage.clear();
  const testData = [
    { path: '/post-1', title: 'Post 1', savedAt: 1234567890 }
  ];
  global.localStorage.setItem(PostBookmark.STORAGE_KEY, JSON.stringify(testData));

  const result = PostBookmark.isBookmarked('/post-1');
  assert.strictEqual(result, true);
});

test('addBookmark should add a new bookmark', () => {
  global.localStorage.clear();
  const post = { path: '/post-1', title: 'Post 1' };
  PostBookmark.addBookmark(post);

  const bookmarks = PostBookmark.loadBookmarks();
  assert.strictEqual(bookmarks.length, 1);
  assert.strictEqual(bookmarks[0].path, '/post-1');
  assert.strictEqual(bookmarks[0].title, 'Post 1');
  assert.strictEqual(typeof bookmarks[0].savedAt, 'number');
});

test('addBookmark should not add duplicate bookmarks', () => {
  global.localStorage.clear();
  const post = { path: '/post-1', title: 'Post 1' };
  PostBookmark.addBookmark(post);
  PostBookmark.addBookmark(post);

  const bookmarks = PostBookmark.loadBookmarks();
  assert.strictEqual(bookmarks.length, 1);
});

test('addBookmark should update savedAt for existing bookmark', async () => {
  global.localStorage.clear();
  const post = { path: '/post-1', title: 'Post 1' };
  PostBookmark.addBookmark(post);

  const firstSavedAt = PostBookmark.loadBookmarks()[0].savedAt;

  // Wait a bit to ensure timestamp changes
  await new Promise(resolve => setTimeout(resolve, 10));
  PostBookmark.addBookmark({ path: '/post-1', title: 'Post 1 Updated' });

  const bookmarks = PostBookmark.loadBookmarks();
  assert.strictEqual(bookmarks.length, 1);
  assert.ok(bookmarks[0].savedAt > firstSavedAt);
  assert.strictEqual(bookmarks[0].title, 'Post 1 Updated');
});

test('addBookmark should enforce MAX_BOOKMARKS limit', () => {
  global.localStorage.clear();
  const max = PostBookmark.MAX_BOOKMARKS;

  for (let i = 0; i < max + 10; i++) {
    PostBookmark.addBookmark({ path: `/post-${i}`, title: `Post ${i}` });
  }

  const bookmarks = PostBookmark.loadBookmarks();
  assert.strictEqual(bookmarks.length, max);
});

test('removeBookmark should remove existing bookmark', () => {
  global.localStorage.clear();
  const post = { path: '/post-1', title: 'Post 1' };
  PostBookmark.addBookmark(post);

  let bookmarks = PostBookmark.loadBookmarks();
  assert.strictEqual(bookmarks.length, 1);

  PostBookmark.removeBookmark('/post-1');

  bookmarks = PostBookmark.loadBookmarks();
  assert.strictEqual(bookmarks.length, 0);
});

test('removeBookmark should not error when removing non-existent bookmark', () => {
  global.localStorage.clear();
  assert.doesNotThrow(() => {
    PostBookmark.removeBookmark('/non-existent');
  });
});

test('getBookmarks should return bookmarks sorted by savedAt descending', () => {
  global.localStorage.clear();
  const now = Date.now();
  const testData = [
    { path: '/post-1', title: 'Post 1', savedAt: now - 3000 },
    { path: '/post-2', title: 'Post 2', savedAt: now - 1000 },
    { path: '/post-3', title: 'Post 3', savedAt: now - 2000 }
  ];
  global.localStorage.setItem(PostBookmark.STORAGE_KEY, JSON.stringify(testData));

  const bookmarks = PostBookmark.getBookmarks();
  assert.strictEqual(bookmarks[0].path, '/post-2');
  assert.strictEqual(bookmarks[1].path, '/post-3');
  assert.strictEqual(bookmarks[2].path, '/post-1');
});

test('getBookmarks should return empty array when no bookmarks', () => {
  global.localStorage.clear();
  const bookmarks = PostBookmark.getBookmarks();
  assert.deepStrictEqual(bookmarks, []);
});
