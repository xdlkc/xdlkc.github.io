# Spec: 代码块行号显示切换按钮

- 时间：2026-03-17 20:28 (Asia/Shanghai)
- Feature slug: `code-line-numbers-toggle`

## 背景 / 问题
代码块行号功能已实现（通过localStorage控制），但用户没有界面切换开关，只能手动修改浏览器存储。不方便用户根据个人喜好开启/关闭行号显示。

## 需求
在文章页添加一个切换按钮，允许用户控制是否显示代码块行号。

## 验收标准
- 在文章页添加一个切换按钮，位置在代码块附近或工具栏区域
- 点击按钮时：
  - 切换 localStorage 中的 `xdlkc:code-line-numbers-enabled` 状态（true/false）
  - 触发代码块行号的重新渲染（添加或移除行号）
  - 更新按钮的状态和文字提示（显示当前状态）
- 按钮的初始状态根据 localStorage 值显示（默认为 true）
- 切换后状态会持久化，刷新页面后保持用户选择
- 支持键盘快捷键 `l` 切换（在非输入框状态下）
- 按钮样式：
  - 浅色模式：普通按钮样式
  - 暗色模式：适配暗色主题
  - 有明确的视觉反馈（按下/松开状态）

## 边界 / 不做
- 不改变现有代码块行号的渲染逻辑（复用 code-line-numbers.js）
- 不修改现有测试（只新增测试）
- 不添加动画效果（保持简洁）

## 实现草案
- 在 `themes/evan/source/js/` 新增 `code-line-numbers-toggle.js`
  - 查找或创建切换按钮（data-code-line-numbers-toggle）
  - 监听点击事件，切换 localStorage 状态
  - 重新渲染代码块行号（调用 CodeLineNumbers.initCodeLineNumbers）
  - 更新按钮显示状态
  - 监听键盘快捷键 `l` 切换
- 在 `themes/evan/layout/post.ejs` 添加切换按钮 HTML
  - 放在代码块工具栏或文章工具区域
- 在 `themes/evan/source/css/style.css` 添加按钮样式

## 测试
- Node test（`node --test`）：新增 `tests/code-line-numbers-toggle.test.js`
  - 测试切换功能：点击按钮后 localStorage 状态正确切换
  - 测试按钮状态更新：按钮文字/属性正确反映当前状态
  - 测试键盘快捷键：按 `l` 键触发切换（非输入框时）
  - 测试持久化：切换后刷新页面状态保持
