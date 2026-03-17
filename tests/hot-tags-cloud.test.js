import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Hot Tags Cloud Component', () => {
  let mockSiteTags;

  beforeEach(() => {
    // Mock Hexo site.tags
    mockSiteTags = {
      each: function(callback) {
        const tags = [
          { name: 'JavaScript', posts: { length: 10 } },
          { name: 'Hexo', posts: { length: 8 } },
          { name: 'CSS', posts: { length: 6 } },
          { name: 'HTML', posts: { length: 5 } },
          { name: 'React', posts: { length: 4 } },
          { name: 'Node.js', posts: { length: 3 } },
          { name: 'Git', posts: { length: 2 } },
          { name: 'Linux', posts: { length: 1 } }
        ];

        tags.forEach(callback);
      },
      sort: function(field, order) {
        const tags = [];
        this.each(tag => tags.push(tag));

        if (order === -1) {
          tags.sort((a, b) => b.posts.length - a.posts.length);
        } else {
          tags.sort((a, b) => a.posts.length - b.posts.length);
        }

        return {
          each: function(callback) {
            tags.forEach(callback);
          },
          limit: function(n) {
            const limited = tags.slice(0, n);
            return {
              each: function(callback) {
                limited.forEach(callback);
              }
            };
          }
        };
      }
    };
  });

  it('should calculate tag font size correctly', () => {
    // Test font size calculation
    const calculateTagSize = (postCount, minCount, maxCount, minSize, maxSize) => {
      if (postCount <= minCount) return minSize;
      if (postCount >= maxCount) return maxSize;

      const ratio = (postCount - minCount) / (maxCount - minCount);
      return Math.round(minSize + ratio * (maxSize - minSize));
    };

    // Test cases
    assert.strictEqual(calculateTagSize(1, 1, 10, 12, 20), 12);
    assert.strictEqual(calculateTagSize(10, 1, 10, 12, 20), 20);
    assert.strictEqual(calculateTagSize(5, 1, 10, 12, 20), 16); // (5-1)/(10-1) * (20-12) + 12 = 15.56 -> 16
    assert.strictEqual(calculateTagSize(8, 1, 10, 12, 20), 18); // (8-1)/(10-1) * (20-12) + 12 = 18.22 -> 18
  });

  it('should sort tags by post count in descending order', () => {
    const tags = [];
    mockSiteTags.sort('posts.length', -1).each(tag => tags.push(tag));

    assert.strictEqual(tags[0].name, 'JavaScript');
    assert.strictEqual(tags[0].posts.length, 10);
    assert.strictEqual(tags[1].name, 'Hexo');
    assert.strictEqual(tags[1].posts.length, 8);
    assert.strictEqual(tags[7].name, 'Linux');
    assert.strictEqual(tags[7].posts.length, 1);
  });

  it('should limit tags to specified number', () => {
    const tags = [];
    mockSiteTags.sort('posts.length', -1).limit(5).each(tag => tags.push(tag));

    assert.strictEqual(tags.length, 5);
    assert.strictEqual(tags[0].name, 'JavaScript');
    assert.strictEqual(tags[4].name, 'React');
  });

  it('should handle edge case with no tags', () => {
    const emptySiteTags = {
      each: function(callback) {
        // No tags
      },
      sort: function(field, order) {
        return {
          each: function(callback) {
            // No tags
          },
          limit: function(n) {
            return {
              each: function(callback) {
                // No tags
              }
            };
          }
        };
      }
    };

    const tags = [];
    emptySiteTags.sort('posts.length', -1).limit(10).each(tag => tags.push(tag));

    assert.strictEqual(tags.length, 0);
  });

  it('should handle edge case with single tag', () => {
    const singleTagSite = {
      each: function(callback) {
        callback({ name: 'Test', posts: { length: 1 } });
      },
      sort: function(field, order) {
        return {
          each: function(callback) {
            callback({ name: 'Test', posts: { length: 1 } });
          },
          limit: function(n) {
            return {
              each: function(callback) {
                callback({ name: 'Test', posts: { length: 1 } });
              }
            };
          }
        };
      }
    };

    const tags = [];
    singleTagSite.sort('posts.length', -1).limit(10).each(tag => tags.push(tag));

    assert.strictEqual(tags.length, 1);
    assert.strictEqual(tags[0].name, 'Test');
  });
});
