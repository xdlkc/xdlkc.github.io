# Spec: Related Posts 无匹配时展示“最近文章”兜底（fallbackRecent）

## 背景/动机
当前文章页已有 Related Posts 区块，但在某些文章（标签较少、标题关键词不明显、或候选文章较少）情况下，Related Posts 可能为空，从而整段区块消失。用户会感知为“页面结尾突然断了”，也失去继续浏览站内内容的引导。

## 需求
当 `related_posts_detailed` 计算不到任何相关结果（既无共享标签，也无标题关键词命中）时：
- 支持可选的兜底模式：返回按时间倒序的“最近文章”列表（排除当前文章），用于继续推荐阅读。

## 验收标准
- 新增 helper 行为（不破坏现有默认行为）：
  - `computeRelatedPostsDetailed` 支持 `fallbackRecent: true` 选项。
  - 当启用且常规相关结果为空时，返回最近文章（按 date 倒序），数量不超过 `limit`。
  - 兜底结果的 `sharedTags` 与 `sharedKeywords` 为空数组。
- 模板层启用兜底：文章页 Related Posts 在“无相关结果”时仍可展示最近文章（用户可见）。
- 单元测试覆盖：
  - 无任何 tag/keyword 命中且 `fallbackRecent: true` 时，确实返回最近文章并正确排序/截断。

## 边界/非目标
- 不改变现有打分/排序算法（有相关结果时保持原样）。
- 不做“相似度更高级”的 NLP（保持轻量）。
- 不在兜底列表中插入额外文案（仅复用现有 Related Posts UI）。
