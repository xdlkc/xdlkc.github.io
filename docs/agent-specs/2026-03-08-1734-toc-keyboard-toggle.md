# Spec: TOC 键盘快捷键（按 `t` 切换大纲）

- Date: 2026-03-08 17:34 (Asia/Shanghai)
- Slug: toc-keyboard-toggle

## 背景 / 问题
文章页已经有 TOC（大纲）侧边栏与移动端 `<details>` 抽屉，但在长文阅读时想快速开关 TOC 需要移动鼠标点击（桌面端）或点开 summary（移动端）。

## 需求
在文章页提供一个**低打扰、可发现**的快捷方式：
- 用户在页面任意位置按下键盘 `t`（toc 的 t），即可切换 TOC 的显示状态。

## 验收标准（Acceptance Criteria）
1. 在文章页（加载了 `toc-scrollspy.js` 且存在 TOC）按下 `t`：
   - 如果存在移动端 TOC 容器 `<details class="toc-mobile">`：切换其 `open` 状态（开/关）。
   - 否则：切换桌面端 TOC（`.toc-card .toc-nav`，若不存在则回退 `.toc-nav`）的 `hidden` 属性与 `aria-hidden`。
2. 当焦点在输入框场景时不触发：
   - `input`, `textarea`, `select`，或 `contenteditable` 元素内按 `t` 不应切换。
3. 不应影响已有点击 TOC 导航、scrollspy、折叠按钮等功能。
4. 需要保证初始化幂等：多次调用 `initTocScrollSpy()` 不会重复绑定键盘事件。

## 边界 / 非目标
- 不引入额外依赖。
- 不新增复杂 UI（例如 toast）；仅做可感知的开关行为。
- 不处理全站快捷键体系（只针对文章页 TOC）。

## 实现笔记
- 在 `initTocScrollSpy()` 内注册一次 `keydown` 监听，使用 `document.documentElement.dataset` 或闭包变量防重。
- 仅在无修饰键（ctrl/meta/alt）且 key 为 `t`/`T` 时响应。
