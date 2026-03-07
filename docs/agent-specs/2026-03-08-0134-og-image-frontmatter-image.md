# Spec: OG Image 自动化增强（支持 front-matter `image`/`featured_image`）

- Date: 2026-03-08 01:34 (Asia/Shanghai)
- Slug: og-image-frontmatter-image

## 背景 / 问题
当前站点的 Open Graph 图片（`og:image`/`twitter:image`）由 `social_meta()` 生成，优先级包含 `og_image/cover/thumbnail/banner/photos/正文首图/默认头像`。

但一些文章更常用 front-matter 字段 `image` / `featured_image`（或驼峰 `featuredImage`）来声明分享图；在这种情况下，如果没写 `cover`，目前会退化到正文首图或默认头像，导致分享卡片不准确。

## 需求
在 `scripts/helpers/social-meta.js` 的 OG 图片候选列表中加入以下字段：
- `page.image`
- `page.featured_image`
- `page.featuredImage`

并且仅作为「当没有显式 OG 字段且没有 cover」时的可选候选（不改变现有 `og_image` 与 `cover` 的优先级）。

## 验收标准
1. 当页面没有 `og_image`/`cover`，但有 `image`（或 `featured_image`/`featuredImage`）时：
   - `buildSocialMeta(...).image` 应输出基于 `site.url` 的绝对 URL
   - `twitterCard` 应为 `summary_large_image`
2. 当页面有 `cover` 时，即使也存在 `image`：
   - 仍优先使用 `cover`（回归不变）
3. 现有测试全部通过，并新增至少 1 个测试覆盖上述行为。

## 边界 / 非目标
- 不引入动态 OG 图片生成服务
- 不新增图片尺寸探测（`og:image:width/height`）
- 不改变 `og_image`（显式字段）的最高优先级
