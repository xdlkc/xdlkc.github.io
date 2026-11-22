function toTime(publishedAt) {
  const t = new Date(publishedAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

function normalizeLimit(limit, fallback = 5) {
  const n = typeof limit === 'string' ? Number(limit) : limit;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function getSortedNews(site) {
  const news = (site && site.data && site.data.news) || [];
  const arr = Array.isArray(news) ? news.slice() : [];
  arr.sort((a, b) => toTime(b.publishedAt) - toTime(a.publishedAt));
  return arr;
}

function slugifyNewsId(item, index) {
  const raw = String((item && item.id) || `item-${index + 1}`).trim();
  const safe = raw.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || `item-${index + 1}`;
}

hexo.extend.helper.register('news_sorted', function () {
  return getSortedNews(this.site);
});

hexo.extend.helper.register('news_detail_path', function (item, index = 0) {
  return `/news/${slugifyNewsId(item, index)}/`;
});

hexo.extend.helper.register('latest_news', function (limit) {
  const homeLimit = normalizeLimit(
    limit ?? (this.config && this.config.news && this.config.news.home_limit),
    5
  );

  return getSortedNews(this.site).slice(0, homeLimit);
});

hexo.extend.generator.register('news-detail', function (locals) {
  const items = getSortedNews(locals);
  const used = new Set();

  return items.map((item, idx) => {
    let slug = slugifyNewsId(item, idx);
    while (used.has(slug)) {
      slug = `${slug}-${idx + 1}`;
    }
    used.add(slug);

    const prevItem = idx > 0 ? items[idx - 1] : null;
    const nextItem = idx + 1 < items.length ? items[idx + 1] : null;

    return {
      path: `news/${slug}/index.html`,
      layout: ['news-detail'],
      data: {
        title: item.title || 'News',
        newsItem: item,
        newsSlug: slug,
        prevNews: prevItem ? { title: prevItem.title, path: `/news/${slugifyNewsId(prevItem, idx - 1)}/` } : null,
        nextNews: nextItem ? { title: nextItem.title, path: `/news/${slugifyNewsId(nextItem, idx + 1)}/` } : null,
      },
    };
  });
});
