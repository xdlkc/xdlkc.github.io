/**
 * Sitemap generator for Hexo
 *
 * Generates sitemap.xml with all published posts and important pages.
 */

const { generateSitemapXml } = require('./helpers/sitemap');

hexo.extend.generator.register('sitemap', function(locals) {
  const config = this.config;
  const url = config.url;

  if (!url) {
    console.warn('Warning: config.url is not set. Sitemap generation skipped.');
    return;
  }

  const urls = [];

  // 1. Add homepage
  const now = new Date();
  urls.push({
    url: url + '/',
    lastmod: now,
    changefreq: 'daily',
    priority: 1.0
  });

  // 2. Add all published posts
  const posts = locals.posts.filter(post => post.published);
  posts.forEach(post => {
    urls.push({
      url: url + '/' + post.path,
      lastmod: post.updated || post.date,
      changefreq: 'monthly',
      priority: 0.8
    });
  });

  // 3. Add category pages
  const categories = locals.categories;
  if (categories && categories.length > 0) {
    categories.forEach(category => {
      urls.push({
        url: url + '/' + category.path,
        lastmod: new Date(), // Categories are dynamic, use current date
        changefreq: 'weekly',
        priority: 0.6
      });
    });
  }

  // 4. Add tag pages
  const tags = locals.tags;
  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      urls.push({
        url: url + '/' + tag.path,
        lastmod: new Date(), // Tags are dynamic, use current date
        changefreq: 'weekly',
        priority: 0.5
      });
    });
  }

  // 5. Add archive pages
  const archives = locals.archives;
  if (archives && archives.length > 0) {
    archives.forEach(archive => {
      urls.push({
        url: url + '/' + archive.path,
        lastmod: new Date(), // Archives are dynamic, use current date
        changefreq: 'monthly',
        priority: 0.4
      });
    });
  }

  // Generate XML and return as a file
  const xml = generateSitemapXml(urls);

  return {
    path: 'sitemap.xml',
    data: xml
  };
});
