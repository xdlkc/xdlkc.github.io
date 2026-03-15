# Spec: 代码块行号点击复制（Highlight gutter line copy）

日期：2026-03-16 05:28 (Asia/Shanghai)

## 背景 / 问题
博客文章里的代码块（Hexo highlight 渲染）通常带行号（gutter）。读者在引用某一行代码时，现有“复制代码”会复制整段，不够精确。

## 目标（用户可感知）
在带行号的代码块中：**点击行号即可复制对应那一行代码内容**，并给出明确的复制反馈。

## 需求
1. 仅对 `.article-content figure.highlight` 生效（Hexo highlight 结构）。
2. 当代码块存在 `.gutter .line`（行号列）且存在 `.code .line`（代码列）时：
   - 点击某个行号（`.gutter .line`）会复制同 index 的代码行文本（不含换行）。
   - 显示 toast：
     - 中文：`已复制第 N 行`
     - 英文：`Copied line N`
3. 复制成功后，对代码块容器维持现有的 `is-copied` 闪烁反馈（复用现有机制）。
4. 复制失败时：
   - 选中对应代码行（尽力而为），并显示现有“复制失败，已选中代码，按 Ctrl/Cmd+C”提示（沿用当前失败提示文案）。
5. 绑定必须是幂等的：重复调用 `initCodeCopy()` 不应重复绑定事件。

## 验收标准
- 新增的 Node/jsdom 测试覆盖：
  - 点击第 2 个行号会复制第 2 行代码，toast 文案正确。
  - `initCodeCopy()` 调用两次后点击一次行号，只会触发一次复制。
- `npm test`（或 `pnpm/yarn` 等同）在本仓库脚本下通过：`npm test`。

## 边界 / 非目标
- 不支持 `<pre><code>` 无行号结构的“逐行复制”（维持现状）。
- 不增加复杂的多选/拖拽复制交互。
- 不改变现有“复制整段代码”的按钮/快捷键/长按逻辑。
