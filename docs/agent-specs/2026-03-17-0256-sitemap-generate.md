# 网站地图 (Sitemap) 生成

## 需求描述

为博客生成 XML 格式的网站地图（sitemap.xml），帮助搜索引擎（如 Google、Bing）更好地索引网站内容。

## 功能范围

### 核心功能

1. **自动生成 sitemap.xml**
   - 收集所有已发布的文章页面
   - 包含首页、分类页、标签页、归档页等
   - 生成符合 Sitemap 协议的 XML 格式
   - 放置在网站根目录 `/sitemap.xml`

2. **优先级设置**
   - 首页：优先级 1.0
   - 文章页：优先级 0.8
   - 分类页：优先级 0.6
   - 标签页：优先级 0.5
   - 归档页：优先级 0.4

3. **更新频率**
   - 首页：daily
   - 文章页：monthly
   - 分类页：weekly
   - 标签页：weekly
   - 归档页：monthly

4. **最后更新时间**
   - 使用页面的最后修改时间
   - 如果没有更新时间，使用发布时间

### 边界条件

1. **排除项**
   - 不包含草稿文章
   - 不包含隐藏页面（about 等可选择性包含）

2. **URL 规范化**
   - 确保所有 URL 都是绝对路径
   - 使用 HTTPS 协议
   - URL 结尾不带斜杠（除非是根目录）

3. **性能考虑**
   - 静态生成，不影响页面加载性能
   - 支持文章数量较多时的生成（1000+ 篇文章）

## 验收标准

1. `sitemap.xml` 正确生成在网站根目录
2. XML 格式符合 Sitemap 协议标准
3. 包含所有已发布的文章页面
4. 包含首页、分类页、标签页、归档页
5. 优先级和更新频率设置合理
6. 最后更新时间正确
7. 可以通过 `https://你的域名/sitemap.xml` 访问

## 实现细节

### Hexo 插件

使用 Hexo 的生成器 API 创建自定义生成器：

```javascript
hexo.extend.generator.register('sitemap', function(locals) {
  const posts = locals.posts.filter(post => post.published);
  const config = this.config;
  const url = config.url;

  // 生成 sitemap XML
  const urls = [];

  // 添加首页
  urls.push({
    url: url,
    lastmod: new Date(),
    changefreq: 'daily',
    priority: 1.0
  });

  // 添加文章页
  posts.forEach(post => {
    urls.push({
      url: url + post.path,
      lastmod: post.updated || post.date,
      changefreq: 'monthly',
      priority: 0.8
    });
  });

  // 添加分类页、标签页、归档页...

  return {
    path: 'sitemap.xml',
    data: generateSitemapXml(urls)
  };
});
```

### Sitemap XML 格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-17T02:00:00Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- 更多 URL -->
</urlset>
```

### 配置项

在 `_config.yml` 中添加配置：

```yaml
# Sitemap
sitemap:
  path: sitemap.xml
  rel: true
  tags: true
  categories: true
```

### 测试要点

1. 验证 XML 格式是否正确
2. 验证 URL 数量是否正确
3. 验证优先级和更新频率
4. 验证最后更新时间格式
5. 验证草稿文章被排除

## 不包含的功能

- 图片 sitemap（image sitemap）
- 视频 sitemap（video sitemap）
- 多语言 sitemap（hreflang）
- sitemap 索引文件（sitemap index，用于分拆大 sitemap）

## 参考资料

- [Sitemap 协议](https://www.sitemaps.org/protocol.html)
- [Google sitemap 文档](https://developers.google.com/search/docs/advanced/sitemaps/overview)
