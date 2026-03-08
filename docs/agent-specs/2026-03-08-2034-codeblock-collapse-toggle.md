# Spec: Code block collapse / expand toggle

- Feature: 为文章页代码块提供“展开/收起”按钮（默认折叠长代码），提升可读性与滚动体验。
- Date: 2026-03-08 20:34 (Asia/Shanghai)

## User story

作为读者，当一段代码很长时，我希望页面默认只展示一个合理高度，并提供明显的“展开代码/收起代码”按钮，这样我可以更快浏览文章内容，并在需要时再展开查看完整代码。

## Acceptance criteria

1. 对文章正文 `.article-content` 内的代码块（支持：`pre` 与 `figure.highlight`）进行处理。
2. 当代码行数超过阈值（例如 > 16 行）时：
   - 默认折叠：代码块元素带有 `is-collapsed` 状态 class。
   - 注入一个按钮 `.code-collapse-button`，初始文案为“展开代码”，并设置 `aria-expanded="false"`。
3. 点击按钮可以在折叠/展开间切换：
   - 折叠态：按钮文案“展开代码”，`aria-expanded=false`。
   - 展开态：按钮文案“收起代码”，`aria-expanded=true`。
4. 对短代码块（<= 16 行）不注入按钮、不添加折叠状态。
5. 初始化应是幂等的：多次调用 init 不会重复注入按钮或重复绑定。
6. 样式：折叠时限制最大高度并隐藏纵向溢出；展开时恢复。

## Non-goals / boundaries

- 不做跨页面持久化（不记忆每个代码块的展开状态）。
- 不改变复制按钮的行为与位置（与现有 code-copy 共存）。
- 不对站点生成流程做大改动，仅通过前端 JS/CSS 实现。

## Test plan (TDD)

- 单元/集成测试（jsdom）：
  1) 长代码块会注入按钮并默认折叠。
  2) 点击按钮后 class 与 aria-expanded 与文案正确切换。
  3) 短代码块不注入按钮。
  4) init 多次调用不重复注入。
- 模板/资源测试：layout 引入 `/js/code-collapse.js`；CSS 包含 `.code-collapse-button` 与折叠样式。
