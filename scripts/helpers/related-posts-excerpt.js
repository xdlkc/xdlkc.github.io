function cleanText(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(input, maxLength = 120) {
  const max = Number.isFinite(maxLength) ? maxLength : 120;
  if (max <= 0) return '';
  if (input.length <= max) return input;
  return input.slice(0, max).trim();
}

function buildRelatedPostsExcerpt({ excerpt, content, maxLength = 120 } = {}) {
  const primary = cleanText(excerpt);
  const fallback = cleanText(content);
  const text = primary || fallback;
  if (!text) return '';
  return truncate(text, maxLength);
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('related_posts_excerpt', function relatedPostsExcerpt(post, options) {
    const maxLength = options && typeof options.maxLength === 'number' ? options.maxLength : 120;
    return buildRelatedPostsExcerpt({
      excerpt: post && post.excerpt,
      content: post && post.content,
      maxLength
    });
  });
}

module.exports = {
  buildRelatedPostsExcerpt
};
