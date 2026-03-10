# Spec: OG Image 自动补全 alt 文本（fallback 到标题）

- 时间：2026-03-10 22:14 (Asia/Shanghai)
- 功能 slug：og-image-alt-fallback
- 目标：当页面存在 `og:image` 但缺少 `og:image:alt`/`twitter:image:alt` 时，自动生成合理的 alt，提升分享卡片可读性与无障碍体验。

## 需求 / User Story

作为读者/分享者，当我把文章链接分享到社交平台时，希望预览卡片的图片有可读的替代文本（alt），即使作者没有手动填写，也能自动给出合理的默认值（通常是文章标题），避免出现空 alt 或缺失 meta。

## 验收标准（Acceptance Criteria）

1. 对于文章页（`type=article`）：
   - 若 `social_meta()` 解析得到的 `imageAlt` 为空，但 `image` 非空：
   - `imageAlt` 自动回退为文章标题（`page.title` 清洗后的文本）。
2. 对于非文章页（`type=website`）：
   - 若 `imageAlt` 为空但 `image` 非空：
   - `imageAlt` 自动回退为站点标题（`site.title` 清洗后的文本）。
3. 若用户在 front-matter 中显式提供 `og_image_alt`/`ogImageAlt`/`image_alt`/`imageAlt`：
   - 必须保持原逻辑，优先使用该值（且会做 HTML/空白清洗）。
4. 若最终 `imageAlt` 仍为空（例如标题也为空）：
   - 不输出 `og:image:alt` / `twitter:image:alt`（保持模板现有行为：仅在有值时输出）。

## 边界 / 非目标（Out of Scope）

- 不生成图片本身（不做 OG 图片自动生成/渲染）。
- 不引入外部依赖与构建流程变更。
- 不改变现有 `og:image` 选择优先级与 `twitter:card` 逻辑。

## 测试计划（TDD）

- 新增单测覆盖：
  - 文章页：有 cover、无显式 alt -> `imageAlt === page.title`。
  - 首页：默认 avatar、无显式 alt -> `imageAlt === site.title`。
  - 显式 alt -> 保持显式值不被覆盖。
