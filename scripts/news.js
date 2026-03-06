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

hexo.extend.helper.register('news_sorted', function () {
  return getSortedNews(this.site);
});

hexo.extend.helper.register('latest_news', function (limit) {
  const homeLimit = normalizeLimit(
    limit ?? (this.config && this.config.news && this.config.news.home_limit),
    5
  );

  return getSortedNews(this.site).slice(0, homeLimit);
});
