# Spec: OG Image secure_url meta

- Date: 2026-03-12 13:31 (Asia/Shanghai)
- Slug: og-image-secure-url

## 需求 / Motivation
当文章/页面被分享到部分平台时，会优先读取 `og:image:secure_url`（HTTPS 版本）以避免因非 HTTPS 图片导致的抓取/展示问题。

目前站点已输出 `og:image`，但未显式输出 `og:image:secure_url`。

## 用户可感知价值
- 分享到支持该字段的平台时，卡片配图更稳定（尤其是对图片 URL 需要 HTTPS 的场景）。

## 验收标准 / Acceptance Criteria
1. 当 `social_meta().image` 是 HTTPS URL 时，页面 `<head>` 中应额外包含：
   - `<meta property="og:image:secure_url" content="..." />`
2. 当 `social_meta().image` 为空或不是 HTTPS URL 时：
   - 不应渲染 `og:image:secure_url`。
3. 不影响现有 meta 标签渲染（`og:image`、`og:image:type`、`og:image:width/height`、`og:image:alt`、twitter meta 等）。
4. 具备单元测试覆盖：
   - `buildSocialMeta()` 产出 `imageSecureUrl` 的逻辑
   - `layout.ejs` 有条件渲染 `og:image:secure_url`

## 边界 / Non-goals
- 不新增外部请求/抓取。
- 不改变 OG 图片选择优先级（仍以现有 `pickImage()` 为准）。
- 不尝试把非 HTTPS 图片“自动升级”为 HTTPS（仅在确实为 HTTPS 时输出 secure_url）。
