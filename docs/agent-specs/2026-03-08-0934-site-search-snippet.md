---
- Date: 2026-03-08 09:34 (Asia/Shanghai)
- Slug: site-search-snippet
- Owner: agent (cron)
---

# Feature: 站内搜索结果显示“内容摘要片段”（Snippet）

## 背景/动机
目前站内搜索只展示标题、日期、标签；当标题/标签命中但用户不确定是否为想要的文章时，需要点进去确认。

新增一个小而完整、可感知的改进：在搜索结果里展示从文章正文提取的**摘要片段**，并对关键词进行高亮。

## 需求
- 在站内搜索弹窗结果列表中，每条结果在标题下方显示一行 snippet（若可生成）。
- snippet 来源优先级：`excerpt` > `content` > `raw`（db.json 中任意一个可用字段）。
- snippet 规则：
  - 若正文中能找到任意关键词：截取“命中位置前后”一段文本（前 24 字 + 后 56 字，左右可微调），前后需要时加省略号。
  - 若未命中：返回正文开头的一小段（最多 90 字）并按需加省略号。
  - snippet 必须是纯文本（不包含 HTML 标签），并使用现有 `<mark>` 高亮机制。

## 验收标准
- [ ] `SiteSearch.makeSnippet()` 在 Node tests 下可用，并满足：
  - 命中关键词时 snippet 覆盖命中处并带 `<mark>`。
  - 不命中时返回正文前缀片段。
  - HTML 输入不会把标签带进 snippet。
- [ ] `renderResults()` 生成的每条搜索结果包含 `.site-search-snippet`（当正文可用）。
- [ ] `npm test`（`node --test`）全绿。

## 边界/不做
- 不做真正的全文索引（仍然只用标题/标签打分排序）。
- 不做多段 snippet、多关键词分段聚合。
- snippet 不参与排序，仅用于展示。
