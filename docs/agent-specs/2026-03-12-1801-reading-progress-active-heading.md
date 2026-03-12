# Spec: Reading Progress 显示当前章节标题（Active Heading）

## 背景 / 动机
站内已有阅读进度条与百分比，但在长文中用户常想知道“我现在在哪个章节”，以便快速定位与回忆上下文。

## 需求
当页面存在文章正文标题（`.article-content h2/h3`）时：
- 阅读进度条右侧/内部的 `reading-progress-label` 在百分比后追加当前章节标题（active heading）。
- 同时更新进度条容器的 `aria-valuetext`，包含百分比与章节标题，提升可访问性。

当页面不存在标题、或无法解析标题时：
- 保持现有行为：label 仅显示百分比；aria-valuetext 仅包含“阅读进度 xx%”。

## Active Heading 判定
- 取所有 `.article-content h2, .article-content h3`（按 DOM 顺序）。
- 计算每个 heading 的文档绝对位置（`scrollY + getBoundingClientRect().top`）。
- 以 `scrollY + thresholdPx` 为基准（默认 96px），选择**最后一个**满足 `headingTop <= scrollY + thresholdPx` 的 heading 作为当前章节。
- 若滚动位置在第一标题之前，则不显示章节标题（只显示百分比）。

## 文本格式
- label: `"{percent}% · {heading}"`（heading 过长时截断为 24 字符并加 `…`）。
- aria-valuetext:
  - 中文：`阅读进度 {percent}% · {heading}`
  - 英文：`Reading progress {percent}% · {heading}`

## 边界 / 非目标
- 不新增/调整页面布局结构（只复用现有 label）。
- 不引入第三方依赖。
- heading 为空（全空白）时视为无标题。

## 验收标准
- 新增单元测试覆盖：在有 h2/h3 且滚动到中间时，label 与 aria-valuetext 包含章节标题；在标题前不包含。
- `npm test`（`node --test ...`）全绿。
- 提交包含 spec + tests + code，并推送到 `origin master`。
