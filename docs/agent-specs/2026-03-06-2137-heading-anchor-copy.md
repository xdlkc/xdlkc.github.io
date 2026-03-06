# Spec: 文章标题锚点一键复制（Heading Anchor Copy）

- 日期时间：2026-03-06 21:37 (Asia/Shanghai)
- Slug：heading-anchor-copy
- 优先级池：P0（文章页自动 TOC 与锚点导航）里的「锚点导航」子能力

## 背景 / 问题
目前文章页标题虽然有 `id`（可定位），但用户很难“快速拿到可分享的章节链接”。常见需求：分享某段内容时，希望点击标题旁的小图标即可复制带 `#anchor` 的 URL，并得到明确反馈。

## 需求
在文章页（post 页面）的正文区域中：
1. 对所有带 `id` 的标题（h1-h6）自动注入一个「复制锚点链接」按钮。
2. 用户点击按钮后：
   - 复制当前页面的完整 URL（包含 `#<heading-id>`）到剪贴板
   - 同步更新地址栏 hash（不刷新页面）
   - 显示一个短暂 toast 提示“链接已复制”
3. 按钮的视觉呈现：
   - 默认低干扰（可在 hover 标题时更明显）
   - 具备无障碍属性（`aria-label`）

## 验收标准（Acceptance Criteria）
- [ ] 在文章页渲染的 HTML 中，标题旁会出现可点击的锚点按钮（通过 DOM 注入实现）。
- [ ] 点击按钮会调用 `navigator.clipboard.writeText()`（可用时），内容为当前 URL + 对应 heading id 的 hash。
- [ ] 如果 `navigator.clipboard` 不可用，使用 `document.execCommand('copy')` 作为 fallback，且不抛出未捕获异常。
- [ ] 点击后会展示 toast 文案“链接已复制”。
- [ ] 具备最小测试覆盖：
  - 单测/集成测试验证点击后复制内容正确
  - 模板测试验证 post 页面引入脚本并初始化
  - 样式测试验证按钮样式 class 存在

## 边界 / 非目标
- 不处理“生成标题 id”的逻辑（由 Hexo/Markdown 渲染负责）。
- 不做“复制后自动滚动定位”的特殊动画（浏览器 hash 行为即可）。
- 不引入第三方依赖。
- 不影响现有 code-copy toast；允许复用同一个 toast 容器。
