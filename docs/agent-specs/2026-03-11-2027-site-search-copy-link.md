# Spec: 站内搜索结果「复制链接」按钮（带反馈）

- Date: 2026-03-11 20:27 (Asia/Shanghai)
- Slug: site-search-copy-link

## 背景 / Why
站内搜索已能快速定位文章，但“把某篇搜索结果分享给别人”仍要先打开再复制链接。给每条搜索结果提供「复制链接」能减少一步，属于小而完整、用户可感知的交互增强。

## 需求（用户故事）
- 作为读者，我在站内搜索弹窗里看到某条结果时，可以直接点击「复制链接」，把该文章的 URL 复制到剪贴板。
- 作为读者，我点击后能得到即时反馈（toast/按钮文案变化），确认复制成功。

## 验收标准（Acceptance Criteria）
1) 每条搜索结果渲染一个复制按钮（例如文案“复制链接/Copy link”），可被键盘聚焦。
2) 点击复制按钮时：
   - 优先使用 `navigator.clipboard.writeText` 复制绝对 URL（基于 `location.origin` + `post.path`）。
   - 成功后显示 toast（复用 `.code-copy-toast` 样式容器）并短暂显示“链接已复制/Link copied”；按钮文案短暂变为“已复制/Copied”。
   - 失败时：显示 toast “复制失败，请手动复制/Copy failed...”，并不抛出未捕获异常。
3) 不改变现有搜索排序/高亮/键盘导航逻辑。

## 边界 / Non-goals
- 不实现“复制 Markdown 链接/富文本”。
- 不对结果项整体点击行为做改动。
- 不引入新依赖。

## 测试策略（TDD）
- 新增 Node(JSDOM) 测试：
  - `renderResults()` 输出的结果项包含 `[data-site-search-copy-link]` 按钮。
  - 模拟 `navigator.clipboard.writeText`，点击按钮后断言复制内容为绝对 URL，且 toast 文案包含“链接已复制/Link copied”。
