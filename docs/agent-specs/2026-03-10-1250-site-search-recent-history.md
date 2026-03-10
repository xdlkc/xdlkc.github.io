# Spec: Site Search 最近搜索历史（Recent Searches）

- Date: 2026-03-10 12:50 (Asia/Shanghai)
- Slug: site-search-recent-history

## 背景 / 用户价值
站内搜索弹窗目前在「空查询」状态会展示热门标签（Top Tags）。但用户往往会重复搜索相同关键词（例如“agent”“rss”“tdd”）。

新增“最近搜索”可以让用户在打开搜索框后，一键复用上次搜索词，减少重复输入。

## 需求
1. 站内搜索弹窗在 **query 为空** 时，除 Top Tags 外，展示“最近搜索”chip（按钮）。
2. 当用户通过搜索结果进行跳转（点击结果或按 Enter 打开结果）时，将当前搜索词写入本地存储。
3. 最近搜索列表：
   - 去重（大小写不敏感）
   - 保留顺序（最新在前）
   - 最多保留 5 条
4. 点击“最近搜索”chip：
   - 将输入框填入该关键词
   - 触发搜索（复用既有 data-site-search-keyword 行为）
5. 不影响现有快捷键（/、Cmd/Ctrl+K）、无结果建议、Top Tags 展示、键盘导航。

## 验收标准
- 打开搜索弹窗，query 为空时：
  - 若 localStorage 中存在历史，则渲染一个容器 `[data-site-search-recent]`，包含若干 `[data-site-search-keyword]` chip。
- 用户搜索并打开某条结果后：
  - localStorage 写入最新搜索词
  - 再次打开弹窗（query 为空）可看到该词出现在“最近搜索”中

## 边界 / 约束
- 仅在浏览器环境可用；Node 测试使用注入的 storage stub。
- storage 不可用（抛错/被禁用）时：静默降级，不应影响搜索功能。
- 不在用户输入过程中（debounce 搜索）写入历史，避免写入半成品。

## 非目标
- 不实现跨设备同步。
- 不引入新的依赖。
