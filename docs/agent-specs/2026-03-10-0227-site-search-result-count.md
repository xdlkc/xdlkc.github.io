# Spec: 站内搜索结果数量提示（result count）

- Date: 2026-03-10 02:27 (Asia/Shanghai)
- Slug: site-search-result-count

## 背景 / 动机
站内搜索已有高亮、热门标签与无结果建议，但缺少“本次检索命中多少篇”的即时反馈。用户在输入关键词时无法快速判断搜索范围与命中情况。

## 需求（User Story）
作为读者，我在站内搜索输入关键词后，希望看到本次搜索命中结果数量，从而快速判断是否需要调整关键词。

## 验收标准（Acceptance Criteria）
1. 当搜索 query 非空且有结果时：
   - 结果区域顶部展示一行“结果数量”提示。
   - 中文模式（`document.documentElement.dataset.langMode === 'zh'`）显示：`找到 N 篇`。
   - 英文模式显示：`Found N results`（N=1 时显示 `Found 1 result`）。
2. 当 query 为空：
   - 不显示结果数量提示（保持原有“热门标签/输入提示”逻辑）。
3. 当 query 非空但无结果：
   - 不显示结果数量提示（保持原有“无结果 + 建议”逻辑）。
4. 结果数量提示不影响现有结果列表渲染、关键词高亮、tag-only（#tag）模式。

## 边界 / 非目标
- 不做分页、不改变现有最多展示 12 条结果的限制。
- 不新增新的快捷键说明文案（本轮只做数量提示）。
- 不修改搜索打分/排序算法。

## 实现草案
- 在 `themes/evan/source/js/site-search.js` 的 `renderResults` 中：
  - 当 `q` 非空且 `results.length > 0` 时，在列表之前插入一个 `<div class="site-search-count" data-site-search-count>`。
  - 文案根据语言模式和结果数量单复数生成。

## 测试计划（TDD）
新增 Node+JSDOM 单测覆盖：
- zh 模式：3 条结果 -> `找到 3 篇` 出现。
- en 模式：1 条结果 -> `Found 1 result` 出现。
- query 为空 -> 不出现 count。
- 无结果 -> 不出现 count。
