# Spec: OG Image 优先读取 front-matter (sdd)

- 时间：2026-03-07 08:38 (Asia/Shanghai)
- Slug: og-image-frontmatter

## 需求 / 背景
当前站点的 `social_meta()` 会为页面生成 OG/Twitter 分享图（`og:image` / `twitter:image`）。

在实际写作中，作者可能希望“指定一张用于分享卡片的图”，但不一定想把它作为文章的 `cover`（或文章内第一张图）。因此需要支持在文章 front-matter 里显式指定 OG 图。

## 用户故事
作为读者/分享者，当我把文章链接分享到微信/Telegram/Twitter 等平台时，希望分享卡片展示作者指定的 OG 图片，而不是误选文章正文第一张图或默认头像。

## 验收标准
1. 当文章 front-matter 存在以下任意字段时，`social_meta().image` 优先使用该字段指定的图片：
   - `og_image`
   - `ogImage`
   - `open_graph_image`
   - `openGraphImage`
2. 上述字段的优先级高于 `cover`、`thumbnail` 以及正文首图提取。
3. 当指定字段为空字符串或不是合法 URL/路径（无法被 `new URL(value, site.url)` 解析）时，忽略它并按原逻辑回退。
4. 若最终图片不是默认头像，则 `twitterCard` 仍为 `summary_large_image`；若回退到默认头像则为 `summary`（保持现有行为）。

## 边界 / 非目标
- 不引入外部图片尺寸探测（不做 `og:image:width/height`）。
- 不改变页面模板输出的 meta 标签结构，仅改变 `social-meta` 选图逻辑。
- 不新增网络请求。

## 测试策略（TDD）
- 单元测试：`buildSocialMeta`
  - 新增用例：当 `page.og_image` 存在时，应优先选用该图并输出 `summary_large_image`。
  - 新增用例：当 `page.og_image` 非法/空时，应回退到 `cover` 或默认逻辑。
