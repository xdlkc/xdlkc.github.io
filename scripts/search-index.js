function toDateString(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.toISOString === 'function') return value.toISOString();
  if (typeof value.format === 'function') return value.format('YYYY-MM-DD');
  return String(value);
}

function normalizeTags(tags) {
  if (!tags) return [];

  const list = Array.isArray(tags) ? tags : (Array.isArray(tags.data) ? tags.data : []);
  const names = [];

  list.forEach((tag) => {
    if (typeof tag === 'string') {
      names.push(tag);
      return;
    }
    if (tag && typeof tag.name === 'string') names.push(tag.name);
  });

  return names;
}

function normalizePost(post) {
  if (!post) return null;
  const title = typeof post.title === 'string' ? post.title : '';
  const path = typeof post.path === 'string' ? post.path : '';
  if (!title || !path) return null;

  return {
    title,
    path,
    tags: normalizeTags(post.tags),
    date: toDateString(post.date || post.updated),
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : '',
    content: typeof post.content === 'string' ? post.content : ''
  };
}

hexo.extend.generator.register('search-index', function (locals) {
  const posts = locals && locals.posts ? locals.posts.toArray() : [];
  const data = posts
    .map(normalizePost)
    .filter(Boolean);

  return {
    path: 'search.json',
    data: JSON.stringify(data)
  };
});
