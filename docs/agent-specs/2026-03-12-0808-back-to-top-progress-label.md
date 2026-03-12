# Spec: Back-to-top 按钮显示阅读进度百分比

- Date: 2026-03-12 08:08 (Asia/Shanghai)
- Slug: back-to-top-progress-label

## 需求 / Why
当前文章页右下角有“返回顶部”浮动按钮，但用户无法直观看到自己阅读到了哪里。

新增一个小而完整、用户可感知的增强：当 Back-to-top 按钮出现时，同时展示当前页面阅读进度百分比（0–100%）。

## 验收标准 / Acceptance Criteria
1. 当页面滚动超过阈值（现有逻辑）Back-to-top 按钮显示时：
   - 按钮文本从 `↑` 变为 `↑ <percent>%`（例如 `↑ 56%`）。
2. 百分比计算规则：
   - `maxScroll = scrollHeight - clientHeight`，若 `maxScroll <= 0` 则进度为 0。
   - `percent = round(scrollY / maxScroll * 100)` 并 clamp 到 `[0, 100]`。
3. 滚动/窗口尺寸变化时，百分比会更新（沿用现有 scroll/resize 监听）。
4. 不改变现有可访问性基本要求：按钮依然是 `<button type="button">` 且保留 `aria-label="返回顶部"`（本轮不做多语言扩展）。

## 边界 / Non-goals
- 不新增新的 UI 组件（不引入进度条、tooltip）。
- 不与现有 Reading Progress Bar 组件做联动（保持解耦）。
- 不调整 Back-to-top 的显示/隐藏阈值策略。

## 测试策略
- JSDOM：模拟 `scrollHeight/clientHeight/scrollY`，初始化后应渲染 `↑ 56%`。
- 校验 clamp：滚动超过最大值时显示 `100%`。
