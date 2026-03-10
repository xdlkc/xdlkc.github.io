# Spec: Heading anchor copy toast includes section title

## Background / Problem
文章页与页面已支持“标题锚点复制”（heading 旁的 `#` 按钮）。但复制成功后 toast 只显示“链接已复制/Link copied”，用户无法确认复制的是哪一节（尤其当连续复制多个小节时）。

## Goal
当用户点击标题旁的锚点复制按钮时：
- 复制到剪贴板的 URL 行为保持不变（完整 URL + `#id`）
- toast 成功提示中包含该标题文本（section title），让用户立即确认复制目标

## Non-goals / Boundaries
- 不改变按钮 UI（仍为 `#`）
- 不引入新 DOM 结构/样式（复用现有 `.code-copy-toast`）
- 不改变失败提示文案
- 不对 heading 文本做富文本渲染（toast 纯文本）

## Acceptance Criteria
1. 点击 `.heading-anchor-button` 后，`navigator.clipboard.writeText` 收到的内容仍为 `location.href` 的 base + `#<headingId>`。
2. 在 `langMode = en` 时，toast 文本包含 "Section"（heading 的可见文本）以及 "copied"（不要求完全一致文案，但必须包含标题）。
3. 在 `langMode = zh` 时，toast 文本包含标题文本与“已复制/复制”语义。
4. 若标题文本为空或不可用，toast 退化为原来的 success 文案（不包含 title）。

## Test Plan (TDD)
- 更新/新增 Node+JSDOM 测试：模拟点击锚点按钮后读取 `.code-copy-toast` 文本，断言包含标题文本（en/zh 两种）。
- 运行 `npm test` 全绿。
