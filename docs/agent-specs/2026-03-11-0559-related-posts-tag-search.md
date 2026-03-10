# Spec: Related Posts 标签/关键词可一键触发站内搜索

- 时间：2026-03-11 05:59 (Asia/Shanghai)
- 类型：小而完整、用户可感知（Related Posts 交互增强）

## 背景 / 问题
文章页底部已有 Related Posts，并展示「共享标签 / 共享关键词」chip，但当前仅为静态文本，用户无法直接基于这些 tag/keyword 继续探索站内内容。

站点已经有站内搜索模态框（SiteSearch），并支持 `#tag`、`tag:` 等语法以及 chip 点击填充查询。

## 需求
在文章页 Related Posts 区域：
- 点击「共享标签」chip：打开站内搜索模态框，并自动以 `#<tag>` 作为查询。
- 点击「共享关键词」chip：打开站内搜索模态框，并自动以 `<keyword>` 作为查询。

## 验收标准
1. Related Posts 渲染的 tag/keyword chip 为可点击元素（button），并携带必要 data 属性：
   - `data-site-search-open`
   - `data-site-search-keyword="..."`
   - tag 额外携带 `data-site-search-keyword-mode="tag"`
2. 点击 chip 后：
   - 站内搜索 dialog 进入打开状态（`.site-search-dialog.is-open`）
   - 输入框 `[data-site-search-input]` 被填充为目标 query（tag 前缀 `#`）
   - 触发一次 `input` 事件以启动搜索刷新
3. 样式上 chip 外观保持现有胶囊样式，并具备 button 交互语义（cursor/字体/无默认 button 样式干扰）。

## 边界 / 非目标
- 不新增新的搜索语法；复用现有 SiteSearch。
- 不改变 related posts 的排序/算法。
- 不要求在无 JS 场景下工作（button 点击不跳转）。

## 测试计划（TDD）
- 新增单元/集成测试：点击页面中的 `[data-site-search-open][data-site-search-keyword]` 会打开搜索并填充 query。
- 更新模板相关测试：确保 post.ejs 中 related posts 的 tag/keyword 输出包含 `data-site-search-open` 与 keyword 属性。
