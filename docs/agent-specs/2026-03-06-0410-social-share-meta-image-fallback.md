# Spec: 社交分享图片元信息（OG/Twitter）自动补全

## 需求背景
当前页面仅输出 `description` 与 `canonical`，在微信、X/Twitter、Telegram 等平台分享时，卡片缺少统一图片，展示不稳定。

## 目标
新增一个小而完整的 SEO/分享增强功能：
- 自动输出 Open Graph 与 Twitter 关键 meta 标签；
- 自动为页面选择分享图片（优先文章图片，回退站点默认图）；
- 所有 URL 输出为绝对地址，便于第三方抓取。

## 验收标准
1. 页面 `<head>` 新增以下标签：
   - `og:title`
   - `og:description`
   - `og:url`
   - `og:type`（文章页为 `article`，其他为 `website`）
   - `og:image`
   - `twitter:card`
   - `twitter:title`
   - `twitter:description`
   - `twitter:image`
2. 分享图选择规则：
   - 优先 `page.cover`
   - 其次 `page.thumbnail`
   - 其次正文中第一张 `<img src>`
   - 最后回退 `/images/avatar.jpg`
3. `og:image` / `twitter:image` 必须是绝对 URL。
4. 当命中文章图片时，`twitter:card=summary_large_image`；仅命中默认图时可为 `summary`。

## 边界与约束
- 不改动已有页面结构，仅增加 head meta；
- 不引入第三方依赖；
- 仅处理 `http(s)` 与站内相对路径；
- 对 query/hash 做保留（图片资源可能依赖 query 版本号）。

## 非目标
- 不实现多尺寸图片裁剪；
- 不实现图片可达性探测；
- 不新增后台配置面板。