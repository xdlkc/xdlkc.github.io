function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (!tag) return '';
      if (typeof tag === 'string') return tag.trim();
      if (typeof tag.name === 'string') return tag.name.trim();
      return '';
    })
    .filter(Boolean);
}

function computeRelatedPosts({ currentPost, posts, limit = 6 }) {
  const currentPath = currentPost && currentPost.path ? String(currentPost.path) : '';
  const currentTags = new Set(normalizeTags(currentPost && currentPost.tags));
  if (currentTags.size === 0) return [];

  const candidates = Array.isArray(posts) ? posts : Array.from(posts || []);

  const scored = candidates
    .filter((post) => post && post.path && String(post.path) !== currentPath)
    .map((post) => {
      const postTags = normalizeTags(post.tags);
      let score = 0;
      postTags.forEach((tag) => {
        if (currentTags.has(tag)) score += 1;
      });
      return { post, score };
    })
    .filter(({ score }) => score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const aTime = a.post.date ? new Date(a.post.date).getTime() : 0;
    const bTime = b.post.date ? new Date(b.post.date).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;

    const aPath = String(a.post.path || '');
    const bPath = String(b.post.path || '');
    return aPath.localeCompare(bPath);
  });

  return scored.slice(0, limit).map(({ post }) => post);
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('related_posts', function relatedPosts(page, site, options) {
    const limit = options && typeof options.limit === 'number' ? options.limit : 6;
    const posts = site && site.posts ? site.posts : [];
    return computeRelatedPosts({ currentPost: page, posts, limit });
  });
}

module.exports = {
  computeRelatedPosts
};
