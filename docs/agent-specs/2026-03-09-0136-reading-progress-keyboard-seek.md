# Spec: Reading Progress Bar Keyboard Seek

Date: 2026-03-09 01:36 (Asia/Shanghai)
Slug: reading-progress-keyboard-seek

## 背景 / 问题
文章页顶部的阅读进度条目前支持：展示百分比、点击跳转进度、拖拽 scrub、双击回顶部。
但它对键盘用户（或习惯键盘操作的用户）不可操作：进度条本身不一定可聚焦，也没有左右键/ Home/End 等快捷操作。

## 目标（用户可感知）
让阅读进度条在获得焦点时可用键盘进行“快进/快退/到头到尾”的滚动跳转。

## 需求
1. 进度条容器（`.reading-progress`）可聚焦（`tabindex=0`），并保持原有 `role="progressbar"` 语义。
2. 当 `.reading-progress` 获得焦点时：
   - `ArrowLeft`：阅读进度 -5%
   - `ArrowRight`：阅读进度 +5%
   - `Home`：跳到 0%
   - `End`：跳到 100%
3. 键盘操作应触发页面滚动（复用现有 `computeScrollTopForPercent` + `scrollTo`）。
4. 不影响原有鼠标行为（点击/拖拽/双击）。

## 验收标准
- 单元测试覆盖：给定当前百分比与按键，能计算出期望的下一百分比（并 clamp 到 0-100）。
- 集成（DOM）测试覆盖：在 JSDOM 中 `.reading-progress` 能响应 keydown（ArrowLeft/ArrowRight/Home/End），并调用 `window.scrollTo`。
- `npm test` 全绿。

## 边界 / 非目标
- 不做移动端手势改动。
- 不新增复杂的可视化 UI（比如 tooltip 或额外按钮）。
- 不修改进度计算逻辑（只新增键盘 seek 能力）。
