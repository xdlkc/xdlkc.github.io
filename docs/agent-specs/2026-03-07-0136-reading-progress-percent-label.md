# Spec: 阅读进度条显示百分比（Reading Progress Label）

- Date: 2026-03-07 01:36 (Asia/Shanghai)
- Slug: reading-progress-percent-label

## 背景 / 动机
当前文章页顶部有阅读进度条，但用户无法直观看到当前阅读进度的具体百分比。

## 需求
在文章页阅读进度条上显示当前阅读进度百分比（0–100）。

## 验收标准
1. 文章页存在 `.reading-progress` 容器时：
   - 在容器内渲染一个可见的百分比文本（例如 `42%`）。
   - 滚动时百分比会随进度更新。
2. 无可滚动内容（文档高度 <= 视窗高度）时：
   - 百分比应显示为 `100%`。
3. 无障碍（a11y）：
   - `.reading-progress` 继续维护 `aria-valuenow`。
   - 新增 `aria-valuetext`，其值应为如 `阅读进度 42%`。
4. 渐进增强：
   - 若页面不存在 `.reading-progress` 或 `.reading-progress-bar`，脚本不报错。

## 边界 / 不做
- 不新增新的 UI 开关（始终显示百分比）。
- 不改变现有进度条计算逻辑（仍使用 `computeReadingProgressPercent`）。
- 不对非文章页（没有 `.reading-progress`）强行注入组件。

## 测试计划（TDD）
- 单元测试：
  - `computeReadingProgressPercent` 在可滚动/不可滚动场景下返回正确值。
- 集成测试（jsdom）：
  - `initReadingProgress` 会在 `.reading-progress` 内注入 `.reading-progress-label`。
  - 触发一次更新后，label 文本与 `aria-valuenow/aria-valuetext` 同步。
