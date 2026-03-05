function stripHtml(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countPostWords(content) {
  const plainText = stripHtml(content);
  if (!plainText) return 0;

  const chineseMatches = plainText.match(/[\u4E00-\u9FFF]/g) || [];
  const chineseChars = chineseMatches.length;

  const nonChineseText = plainText.replace(/[\u4E00-\u9FFF]/g, ' ');
  const tokenCount = nonChineseText
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean).length;

  return chineseChars + tokenCount;
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('post_word_count', function postWordCount(content) {
    return countPostWords(content);
  });
}

module.exports = {
  countPostWords
};
