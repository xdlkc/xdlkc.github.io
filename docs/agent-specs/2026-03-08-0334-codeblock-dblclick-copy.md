# Spec: 代码块双击快速复制

- Date: 2026-03-08 03:34 (Asia/Shanghai)
- Slug: codeblock-dblclick-copy

## 背景/动机
当前文章页代码块已有「复制代码」按钮，但在移动端或快速浏览时，用户想要更快的复制动作。

## 需求
在文章内容区域的代码块上支持「双击复制」：用户双击代码块任意位置即可复制该代码块的纯文本到剪贴板，并给出成功/失败提示。

## 验收标准
1. 在 `.article-content` 内的以下代码块上，双击会触发复制：
   - `<pre><code>...</code></pre>`
   - `figure.highlight`（Hexo highlight 渲染）
2. 双击复制与现有「复制代码」按钮共存，不影响按钮行为。
3. 复制成功后：
   - 页面右下角 toast 显示「复制成功」
4. 复制失败后：toast 显示「复制失败，请手动复制」。
5. 若用户正在选中文本（`window.getSelection().toString()` 非空），双击不触发复制（避免干扰选中/复制工作流）。
6. 不重复绑定事件：`initCodeCopy()` 多次调用不会为同一代码块重复注册 `dblclick` 监听。

## 边界/不做
- 不做长按复制/右键菜单增强。
- 不改变复制内容提取规则（沿用现有 extract 逻辑）。
- 不在非 `.article-content` 的代码块上启用此功能。

## 测试策略（TDD）
- 单元测试（jsdom）：
  - `initCodeCopy()` 后，触发 `dblclick` 会调用 `navigator.clipboard.writeText`（或 fallback）并显示 toast。
  - 有文本选中时，`dblclick` 不触发复制。
  - 多次 `initCodeCopy()` 不会导致重复复制调用。
