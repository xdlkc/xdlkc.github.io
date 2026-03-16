const test = require('node:test');
const assert = require('node:assert/strict');

test('lang-toggle DICT includes post navigation keys', () => {
  const LangToggle = require('../public/js/lang-toggle.js');

  const enPrev = LangToggle.t('post.previous', 'en');
  const zhPrev = LangToggle.t('post.previous', 'zh');
  const enNext = LangToggle.t('post.next', 'en');
  const zhNext = LangToggle.t('post.next', 'zh');

  assert.equal(enPrev, '← Previous');
  assert.equal(zhPrev, '← 上一篇');
  assert.equal(enNext, 'Next →');
  assert.equal(zhNext, '下一篇 →');
});
