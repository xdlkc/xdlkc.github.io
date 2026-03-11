# Spec: Related Posts reason badge (tags/keywords/recent)

Date: 2026-03-11 14:52 (Asia/Shanghai)
Slug: related-posts-reason-badge

## 背景 / 问题
文章页已有「相关阅读」列表，并会基于共享标签/标题关键词做相关性排序；当启用 fallbackRecent 时，可能出现“最近文章”填充，但用户看不出为什么这些文章会出现在相关阅读里。

## 需求
在文章页的每一条 Related Post 上显示一个简短的“推荐原因”徽标（badge），让用户一眼知道它是：
- 因共享标签推荐
- 因共享关键词推荐
- 因无匹配而回退到“最新文章”推荐

## 验收标准 (AC)
1. `computeRelatedPostsDetailed(...)` 的每个返回项增加 `reason` 字段，取值为：`'tags' | 'keywords' | 'recent'`。
   - 若 `sharedTags.length > 0` → reason = `tags`
   - 否则若 `sharedKeywords.length > 0` → reason = `keywords`
   - 否则（仅在 fallbackRecent 路径出现）→ reason = `recent`
2. `themes/evan/layout/post.ejs` 在每条 related post 的标题附近渲染徽标：
   - reason=tags → 显示文案（可切换中/英）："Shared tags" / "共享标签"
   - reason=keywords → "Shared keywords" / "共享关键词"
   - reason=recent → "Recent" / "最新文章"
3. 徽标样式轻量，不影响布局：小号字体、圆角、淡背景色；暗色模式下仍可读。
4. 不改变现有 related posts 的排序与筛选逻辑（仅增加 reason 信息与展示）。

## 边界 / 非目标
- 不新增新的推荐算法，不引入全文相似度。
- 不对历史文章 front-matter 做批量修改。
- 不在 badge 中展示具体命中词（仍沿用现有 tags/keywords chips）。

## 测试策略 (TDD)
- 单元测试：覆盖 tags/keywords/fallbackRecent 三种 reason。
- 模板测试：断言 post.ejs 包含 reason 徽标渲染与 i18n key。
