# Spec: 站内搜索无结果时推荐热门标签（Top Tags）

- 时间：2026-03-08 18:34 (Asia/Shanghai)
- 功能名：Site Search 无结果推荐热门标签
- 目标：当用户在站内搜索输入关键词但**没有匹配结果**时，提供“可点击的热门标签”作为替代探索路径，减少挫败感。

## 需求（What）

在站内搜索弹窗（`site-search.js`）里：

1. 当查询 `query` 非空，且搜索结果 `results.length === 0` 时：
   - 仍然展示原有的“拆分关键词 chips”（当多关键词时）。
   - **新增**展示一个“热门标签”推荐区（来自已加载的 `db.json` 统计结果）。
2. 推荐区的每个标签以 chip 按钮形式呈现，点击后：
   - 将搜索框内容替换为该标签文本
   - 自动触发搜索（沿用现有 `[data-site-search-keyword]` 事件委托机制）

## 验收标准（Acceptance Criteria）

- A1：当搜索无结果时，页面包含一段提示文案（例如“也可以试试热门标签：”）以及若干热门标签 chips。
- A2：热门标签 chips 使用现有属性 `data-site-search-keyword`，点击后会更新 input 值并触发新一轮搜索。
- A3：当热门标签数据不可用/为空时，不显示该推荐区（保持原有无结果 UI）。
- A4：新增行为有自动化测试覆盖：在 JSDOM 环境下可复现“无结果 -> 展示热门标签 chips”。

## 边界（Non-goals / Out of Scope）

- 不做模糊匹配“Did you mean”纠错（Levenshtein 等）。
- 不改变搜索排序、索引结构、或结果渲染样式。
- 不引入额外依赖。

## 影响范围（Touched Areas）

- `themes/evan/source/js/site-search.js`：render 逻辑增强 + 调用处把 topTags suggestions 传入。
- `tests/`：新增测试用例覆盖无结果推荐区。
