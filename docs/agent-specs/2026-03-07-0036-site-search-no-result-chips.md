# Spec: Site Search 无结果建议（关键词 Chips）

- 日期：2026-03-07 00:36 (Asia/Shanghai)
- Slug：site-search-no-result-chips

## 背景 / 问题
站内搜索（modal）在查询无结果时，只给出静态建议（缩短关键词/去 Archives）。当用户输入多个关键词（如 "foo bar"）时，无法快速尝试拆分后的关键词，交互上不够顺滑。

## 目标
当站内搜索无结果且查询包含多个关键词时：
1) 在空状态中展示“关键词 chips”（按钮/胶囊），每个 chip 对应一个拆分后的关键词。
2) 点击 chip 会把搜索框内容替换为该关键词，并立刻触发搜索。

## 需求（Functional Requirements）
- 仅在 `query` 非空 且 `results.length === 0` 时展示 chips。
- 关键词拆分规则：
  - 使用空白字符拆分（例如 `foo bar` -> `[foo, bar]`）。
  - 去重、去空、限制最多 6 个。
  - 单个关键词（拆分后只有 1 个 token）不展示 chips（避免噪音）。
- chips 使用 button 元素，并带上 `data-site-search-keyword` 属性，便于事件委托。
- 点击 chip：
  - 设置输入框 value 为该关键词
  - 触发一次 `input` 事件，使搜索立即更新结果

## 验收标准（Acceptance Criteria）
- 输入 `foo bar` 且无结果时：空状态中出现 2 个 chips（foo、bar）。
- 点击 `foo` chip：输入框值变为 `foo`，并触发搜索渲染。
- 不影响已有行为：
  - 有结果时仍正常高亮 title/tags。
  - Escape / 点击遮罩关闭、快捷键（/、Cmd+K、Ctrl+K）仍正常。

## 边界 / 非目标（Out of Scope）
- 不做复杂分词（中文分词、标点拆分、拼写纠错、tag fuzzy matching）。
- 不引入第三方依赖。
- 不修改 db.json 生成逻辑。

## 测试计划
- 新增 Node + JSDOM 集成测试：
  - mock fetch 返回一个不匹配的 posts 列表
  - initSiteSearch 后打开 modal、输入 `foo bar`
  - 断言出现 chips（data-site-search-keyword）
  - 点击 chip 后断言 input.value 更新为该 keyword
