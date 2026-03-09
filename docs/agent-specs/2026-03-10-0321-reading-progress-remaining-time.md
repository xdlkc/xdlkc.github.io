# Spec: 阅读进度条显示「剩余阅读时间」(Remaining Time)

- Date: 2026-03-10 03:21 (Asia/Shanghai)
- Slug: reading-progress-remaining-time

## 背景 / 用户价值
文章页顶部阅读进度条目前只显示百分比。增加“剩余阅读时间”可以让读者更快判断还要花多久读完，提升阅读体验（尤其是长文）。

## 需求
在文章页的阅读进度条百分比标签中，基于文章的总阅读分钟数，实时显示估算的剩余阅读时间。

## 验收标准
1. 文章页 `.reading-progress` 元素带有 `data-reading-minutes`（数字，来自服务端计算的阅读时间分钟数）。
2. 当 `data-reading-minutes` 为有效正数时：
   - 进度条标签展示形如：`50% · 剩余 5 分钟`（中文默认）。
   - `aria-valuetext` 更新为：`阅读进度 50%，剩余 5 分钟`。
   - 剩余分钟数计算：`ceil(totalMinutes * (1 - percent/100))`，并下限为 0。
3. 当 `data-reading-minutes` 缺失或无效时：
   - 保持原行为：标签只显示 `${percent}%`；`aria-valuetext` 为 `阅读进度 ${percent}%`。
4. 不引入新的依赖；仅做最小改动，保持性能（滚动更新依旧在 rAF 中）。

## 边界 / 非目标
- 不做更复杂的阅读速度个性化、按段落字数动态估算等。
- 不要求多语言完整 i18n；若后续需要再扩展（本次以中文为默认输出）。

## 测试计划 (TDD)
- 新增单测：当容器存在 `data-reading-minutes="10"` 且进度为 50% 时，标签包含 `50% · 剩余 5 分钟`，`aria-valuetext` 包含剩余时间。
- 保留原单测：无 `data-reading-minutes` 时，标签仍为 `50%`。
