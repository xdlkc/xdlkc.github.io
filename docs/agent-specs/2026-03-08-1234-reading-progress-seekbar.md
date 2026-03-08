# Spec: 阅读进度条支持点击跳转（Seek Bar）

- 时间：2026-03-08 12:34 (Asia/Shanghai)
- Feature slug: reading-progress-seekbar

## 需求 / 背景
目前文章页顶部有阅读进度条，点击会直接回到顶部（Back to top）。当文章较长时，用户想快速跳到某个大概位置，需要反复滚动。

本次增强：把阅读进度条升级为“可点击跳转”的 seek bar —— 用户点击进度条任意位置，页面平滑滚动到对应阅读位置；同时保留原来的“快速回到顶部”能力。

## 验收标准（可验证）
1. 在可滚动页面（docHeight > winHeight）中：
   - 单击 `.reading-progress` 任意位置，会将页面滚动到该位置对应的阅读进度百分比（0~100）。
   - 目标 scrollTop 计算基于 `totalScrollable = docHeight - winHeight`，即 `scrollTop = totalScrollable * percent`（四舍五入/取整均可，但需 clamp）。
2. 在不可滚动页面（docHeight <= winHeight）中：
   - 点击不会报错；滚动位置保持不变（或保持 0）。
3. 保留“回到顶部”能力：
   - 双击 `.reading-progress` 会平滑滚动到顶部（0）。
4. 单元测试覆盖核心纯函数：
   - `computeScrollTopForPercent`：percent=0/50/100、以及越界 percent（<0, >100）需要 clamp。
   - `computePercentFromPointer`：根据点击坐标（clientX）在进度条范围内计算 percent，并 clamp。

## 边界 / 非目标
- 不做拖拽（drag）交互，仅支持点击/轻触跳转。
- 不引入第三方库。
- 不改变阅读进度条的视觉样式（除非现有样式无法表达点击区域）。

## 影响范围
- 主要修改：`themes/evan/source/js/reading-progress.js`
- 新增测试：`tests/reading-progress-seekbar.test.js`

