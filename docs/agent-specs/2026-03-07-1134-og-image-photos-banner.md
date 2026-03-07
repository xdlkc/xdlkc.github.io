# Spec: OG Image 自动拾取 photos/banner（OG Image automation enhancement）

## 背景 / 动机
目前站点的 Open Graph / Twitter Card 图片选择逻辑主要依赖：front-matter 显式字段（og_image 等）→ cover/thumbnail → 正文首图 → 默认头像。

但 Hexo/主题生态里常见的图片字段还有：
- `banner`: 文章头图/横幅
- `photos`: Hexo 官方常用的文章图集字段（数组）

当作者使用 `photos` 或 `banner` 时，分享卡片会错误回退到正文首图或默认头像，导致分享体验不稳定。

## 需求
在 `social_meta` helper 的图片选择逻辑中，新增对 `banner` 与 `photos`（数组）的支持，让分享卡片更符合作者意图。

## 验收标准
1. 当页面未设置显式 OG 字段（`og_image/ogImage/open_graph_image/openGraphImage`）时：
   - 若存在 `cover/thumbnail` 等现有字段，仍保持原优先级。
   - 若存在 `banner`，应可被选为 OG 图片候选。
   - 若存在 `photos`（数组）且第一个元素可解析为 URL，应可被选为 OG 图片候选。
2. `photos/banner` 解析出的 URL 必须与现有逻辑一致：
   - 支持相对路径（相对 `site.url` 转绝对）。
   - 无效/空白 URL 必须被忽略并继续回退。
3. 行为保持向后兼容：现有测试全部通过，并新增覆盖 `banner/photos` 的测试。

## 边界 / 不做
- 不生成动态 OG 图片（不引入 canvas/截图等重实现）。
- 不改动 layout.ejs 的 meta 标签结构。
- 不改变显式 OG 字段的最高优先级。
