// Normalize post image field for RSS generation.
//
// Hexo generator-feed only emits <enclosure> when `post.image` exists.
// In this repo, cover images may live in front-matter as ogImage/og_image/etc.
// This filter backfills `post.image` so RSS can expose cover image consistently.

function pickFirstString(value) {
  if (typeof value === 'string') {
    const s = value.trim();
    return s ? s : null;
  }

  if (Array.isArray(value)) {
    for (const v of value) {
      const s = pickFirstString(v);
      if (s) return s;
    }
  }

  return null;
}

function resolveFeedImage(post) {
  const p = post || {};

  // Prefer existing `image` to preserve explicit config.
  const direct = pickFirstString(p.image);
  if (direct) return direct;

  // Align with existing social meta helpers.
  const candidates = [
    p.ogImage,
    p.og_image,
    p.ogimage,
    p.featured_image,
    p.featuredImage,
    p.cover,
    p.banner,
    p.thumbnail,
    // Common Hexo fields: `photos` can be an array of URLs.
    p.photos
  ];

  for (const c of candidates) {
    const s = pickFirstString(c);
    if (s) return s;
  }

  return null;
}

function applyFeedImageToPost(post) {
  if (!post || typeof post !== 'object') return post;
  if (pickFirstString(post.image)) return post;

  const resolved = resolveFeedImage(post);
  if (resolved) post.image = resolved;
  return post;
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.filter) {
  // Run after markdown/render pipeline, before generators (feed) consume post models.
  hexo.extend.filter.register('after_post_render', (data) => {
    applyFeedImageToPost(data);
    return data;
  });
}

module.exports = {
  resolveFeedImage,
  applyFeedImageToPost
};
