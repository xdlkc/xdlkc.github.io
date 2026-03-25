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

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'in',
  'into', 'of', 'on', 'or', 'the', 'to', 'vs', 'with', 'without', 'your', 'you'
]);

function tokenizeTitle(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function collectSharedKeywords(currentPost, post, limit = 3) {
  const currentTokens = tokenizeTitle(currentPost && currentPost.title);
  const candidateTokens = tokenizeTitle(post && post.title);
  if (!currentTokens.length || !candidateTokens.length) return [];

  const candidateSet = new Set(candidateTokens);
  const shared = [];
  const seen = new Set();

  currentTokens.forEach((token) => {
    if (!candidateSet.has(token) || seen.has(token)) return;
    seen.add(token);
    shared.push(token);
  });

  shared.sort((a, b) => a.localeCompare(b));
  return shared.slice(0, Math.max(0, limit | 0));
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

function computeRelatedPostsDetailed({
  currentPost,
  posts,
  limit = 6,
  sharedTagsLimit = 3,
  sharedKeywordsLimit = 3,
  // When enabled, if no related matches are found, fall back to showing recent posts.
  fallbackRecent = false
}) {
  const currentPath = currentPost && currentPost.path ? String(currentPost.path) : '';
  const currentTags = normalizeTags(currentPost && currentPost.tags);
  const currentTagsLower = currentTags.map(t => t.toLowerCase());
  const currentSet = new Set(currentTagsLower);
  const candidates = Array.isArray(posts) ? posts : Array.from(posts || []);

  const scored = candidates
    .filter((post) => post && post.path && String(post.path) !== currentPath)
    .map((post) => {
      const postTags = normalizeTags(post.tags);
      const shared = [];
      const seen = new Set();

      postTags.forEach((tag) => {
        const key = tag.toLowerCase();
        if (!currentSet.has(key)) return;
        if (seen.has(key)) return;
        seen.add(key);
        shared.push(tag);
      });

      shared.sort((a, b) => String(a).localeCompare(String(b)));
      const sharedKeywords = shared.length > 0
        ? []
        : collectSharedKeywords(currentPost, post, sharedKeywordsLimit);

      const reason = shared.length > 0
        ? 'tags'
        : (sharedKeywords.length > 0 ? 'keywords' : null);

      return {
        post,
        score: shared.length > 0 ? shared.length * 100 : sharedKeywords.length,
        reason,
        sharedTags: shared.slice(0, Math.max(0, sharedTagsLimit | 0)),
        sharedKeywords
      };
    })
    .filter((row) => row.score > 0);

  // Optional: if no matches at all, fall back to recent posts (still excluding current).
  if (scored.length === 0 && fallbackRecent) {
    return candidates
      .filter((post) => post && post.path && String(post.path) !== currentPath)
      .map((post) => ({ post, time: post.date ? new Date(post.date).getTime() : 0 }))
      .sort((a, b) => {
        if (b.time !== a.time) return b.time - a.time;
        const aPath = String(a.post.path || '');
        const bPath = String(b.post.path || '');
        return aPath.localeCompare(bPath);
      })
      .slice(0, Math.max(0, limit | 0))
      .map(({ post }) => ({ post, reason: 'recent', sharedTags: [], sharedKeywords: [] }));
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const aTime = a.post.date ? new Date(a.post.date).getTime() : 0;
    const bTime = b.post.date ? new Date(b.post.date).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;

    const aPath = String(a.post.path || '');
    const bPath = String(b.post.path || '');
    return aPath.localeCompare(bPath);
  });

  return scored.slice(0, limit).map(({ post, reason, sharedTags, sharedKeywords }) => ({ post, reason, sharedTags, sharedKeywords }));
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('related_posts', function relatedPosts(page, site, options) {
    const limit = options && typeof options.limit === 'number' ? options.limit : 6;
    const posts = site && site.posts ? site.posts : [];
    return computeRelatedPosts({ currentPost: page, posts, limit });
  });

  // New: include shared tag chips for better user-perceivable relevance.
  hexo.extend.helper.register('related_posts_detailed', function relatedPostsDetailed(page, site, options) {
    const limit = options && typeof options.limit === 'number' ? options.limit : 6;
    const sharedTagsLimit = options && typeof options.sharedTagsLimit === 'number'
      ? options.sharedTagsLimit
      : 3;
    const posts = site && site.posts ? site.posts : [];

    const sharedKeywordsLimit = options && typeof options.sharedKeywordsLimit === 'number'
      ? options.sharedKeywordsLimit
      : 3;
    const fallbackRecent = options && typeof options.fallbackRecent === 'boolean'
      ? options.fallbackRecent
      : false;

    return computeRelatedPostsDetailed({
      currentPost: page,
      posts,
      limit,
      sharedTagsLimit,
      sharedKeywordsLimit,
      fallbackRecent
    });
  });
}

module.exports = {
  computeRelatedPosts,
  computeRelatedPostsDetailed
};
