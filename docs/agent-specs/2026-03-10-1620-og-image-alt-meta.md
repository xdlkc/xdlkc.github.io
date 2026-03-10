# Spec: OG 图片 Alt 文案增强（分享卡片可读性）

- **时间**: 2026-03-10 16:20 (Asia/Shanghai)
- **作者**: 博客项目编码子代理
- **类型**: P1 / OG Image 自动化增强

## 1) 需求背景
当前布局模板输出了 `og:image` 与 `twitter:image`，但没有输出图片替代文案（alt）。
在部分社交平台、读屏场景与预览系统中，缺失 alt 会降低可访问性与语义完整性。

目标：让文章可以在 front-matter 中显式配置分享图的 alt 文案，并自动注入到页面 head 中。

## 2) 用户可感知价值
- 分享到社交平台时，预览卡片语义更完整。
- 对无障碍/读屏用户更友好。
- 作者可以精确控制分享图描述，而不只是依赖标题。

## 3) 功能范围
### In Scope
1. `social_meta` helper 支持从 front-matter 读取 OG 图片 alt 文案。
2. 模板输出：
   - `<meta property="og:image:alt" ...>`
   - `<meta name="twitter:image:alt" ...>`
3. 仅当有有效 alt 文案时输出上述标签（避免空标签）。

### Out of Scope
- 不做图片自动识别/AI 生成 alt。
- 不改动 OG 图片选取优先级逻辑（本轮只增强 alt）。
- 不改动 RSS、JSON-LD 结构化数据字段。

## 4) 数据约定
优先读取以下 front-matter 字段（从高到低）：
1. `og_image_alt`
2. `ogImageAlt`
3. `image_alt`
4. `imageAlt`

文案将进行：trim、去标签、空值过滤。

## 5) 验收标准
1. 当 `page.og_image_alt` 有值时，`buildSocialMeta()` 返回 `imageAlt` 字段且内容为清洗后的文本。
2. 当 alt 字段为空白时，`imageAlt` 为空字符串，不输出模板 meta 标签。
3. `layout.ejs` 含有条件输出 `og:image:alt` 与 `twitter:image:alt` 的逻辑。
4. 相关测试先失败后通过。

## 6) 边界与风险
- 若作者未配置 alt，本功能应保持静默，不影响现有 meta 输出。
- 防止 alt 中包含 HTML，需清洗为纯文本。
- 不应影响已有 `social_meta` 的 image / twitterCard / articleTags 逻辑。