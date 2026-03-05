function stripHtml(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateReadingMinutes(content) {
  const plainText = stripHtml(content);
  if (!plainText) return 1;

  const chineseMatches = plainText.match(/[\u4E00-\u9FFF]/g) || [];
  const chineseChars = chineseMatches.length;

  const noChineseText = plainText.replace(/[\u4E00-\u9FFF]/g, ' ');
  const englishWords = noChineseText
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean).length;

  const estimated = Math.ceil(chineseChars / 300 + englishWords / 200);
  return Math.max(1, estimated);
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('reading_time', function readingTime(content) {
    return estimateReadingMinutes(content);
  });
}

module.exports = {
  estimateReadingMinutes
};
