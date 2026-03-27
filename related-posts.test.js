const test = require('node:test');
const assert = require('node:assert');
const { getRelatedPosts } = require('./related-posts.js');

test('Related Posts', async (t) => {
  await t.test('should return empty if no tags', () => {
    assert.deepStrictEqual(getRelatedPosts({id: 1, tags: []}, [{id: 2, tags: ['a']}]), []);
  });
  await t.test('should return matching posts sorted by match count', () => {
    const current = { id: 1, tags: ['js', 'web', 'react'] };
    const all = [
      { id: 2, tags: ['js'] },
      { id: 3, tags: ['js', 'web'] },
      { id: 4, tags: ['python'] }
    ];
    const related = getRelatedPosts(current, all);
    assert.strictEqual(related.length, 2);
    assert.strictEqual(related[0].id, 3);
    assert.strictEqual(related[1].id, 2);
  });
});
