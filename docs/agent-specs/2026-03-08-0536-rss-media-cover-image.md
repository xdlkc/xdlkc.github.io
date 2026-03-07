# Spec: RSS 增强：封面图（Media RSS + ogImage 兼容）

## 背景 / 目标
目前站点 RSS（`/rss.xml`）对文章封面图的支持不稳定：Hexo 默认模板仅在 `post.image` 存在时输出 `<enclosure>`，而本项目文章封面更多以 `ogImage`（或 `og_image`）等 front-matter 字段存在（用于 OG/Twitter Card）。

希望 RSS 阅读器（Reeder / Inoreader 等）能稳定显示每篇文章的封面图。

## 用户故事（SDD）
- 作为 RSS 订阅者，我希望在阅读器里看到文章列表/详情页的封面图，方便快速识别与回顾。

## 验收标准
1. 当文章 front-matter 包含以下任一字段时，RSS item 能输出封面图信息：
   - `image`（原生兼容）
   - `ogImage` / `og_image`
   - `cover` / `banner` / `thumbnail`
   - `photos[0]`（若存在）
2. RSS 输出需包含 Media RSS 命名空间，并在有封面图时输出：
   - `<media:content .../>`
   - `<media:thumbnail .../>`
3. 不应影响没有封面图的文章（不输出相关节点）。
4. Node 单元测试覆盖：
   - `resolveFeedImage(post)` 的字段优先级与返回值。
   - `applyFeedImageToPost(post)` 会在 `post.image` 为空时填充解析结果。

## 边界 / 非目标
- 不在本次改动中生成/压缩图片，也不自动从正文抓取第一张图片。
- 不改动 Atom feed（若未来开启）。
- 若封面为外链（http/https），直接透传，不做下载。

## 实现草案
- 新增 Hexo filter：在生成 feed 前，将 `post.image` 补齐为 `resolveFeedImage(post)` 的结果。
- 配置 `feed.template` 指向自定义 `rss2` 模板，加入 `xmlns:media`，并用 `formatUrl` 生成绝对 URL。
