# Spec: 站内搜索无结果时的“相似标签”建议（P0 搜索增强）

- 时间：2026-03-11 08:12 (Asia/Shanghai)
- Feature slug: `site-search-similar-tags`

## 背景 / 问题
站内搜索支持标题/标签检索与热门标签推荐，但当用户输入的标签/关键词拼写不准、大小写不同或只差一两个字符时，经常出现“无结果”。

## 需求
当搜索 **无结果** 时：
1) 给出“相似标签”建议（可点击 chip），帮助用户快速改为正确标签搜索。
2) 适配普通搜索与标签模式：
   - `#foo` 或 `tag: foo` / `tags: foo`：优先按标签模式给建议
   - 普通搜索：也给标签建议（因为很多用户其实想找标签）

## 验收标准
- 当 `results.length === 0` 且 `query` 非空：
  - 若站点存在与 query 相近的 tag（满足子串匹配或编辑距离阈值），则在无结果提示区块中显示：
    - 中文：`你是不是想找：` + chips
    - 英文：`Did you mean:` + chips
  - 点击 chip 会触发以 **标签模式** 搜索该 tag（等价于在输入框填入 `#<tag>` 并触发搜索）。
- 相似标签去重、最多展示 8 个，排序规则：
  1) 子串匹配优先于编辑距离匹配
  2) 编辑距离更小优先
  3) 字母序兜底
- 对大小写不敏感；输出保持 tag 原始展示文本（不强制小写）。

## 边界 / 不做
- 不做全文内容的拼写纠错
- 不引入重量级依赖（例如 fuse.js）
- 不更改现有搜索的评分/排序逻辑

## 实现草案
- 在 `themes/evan/source/js/site-search.js` 增加：
  - `getAllTags(posts)`：提取并去重全部 tags
  - `levenshtein(a,b)`：短字符串编辑距离
  - `suggestSimilarTags(allTags, queryTokensLower, { limit, maxDistance })`
- 在 `renderResults()` 的无结果分支渲染相似标签区块，并复用现有 chip 事件委托逻辑。

## 测试
- Node test（`node --test`）：新增 `tests/site-search-similar-tags.test.js`
  - 输入 query tokens 时，能返回预期的相似 tags（子串/编辑距离/去重/排序/limit）。
