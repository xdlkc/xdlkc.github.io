# Spec: 移动端长按代码块复制（Code Copy Long-Press）

- 时间：2026-03-11 07:10 (Asia/Shanghai)
- Slug: code-copy-long-press

## 背景 / 问题
当前文章页代码复制主要依赖“点击复制按钮”或“双击代码块”。在移动端：
- 双击不稳定/不符合习惯
- 复制按钮可能需要精确点击

移动端更符合直觉的交互是“长按复制”。

## 目标
在文章正文（.article-content）的代码块上支持长按复制：
- 对 `pre` 与 `figure.highlight` 两类代码块生效
- 长按达到阈值（默认 450ms）后自动复制代码并 toast 提示

## 验收标准（Acceptance Criteria）
1. 在 `.article-content pre`（且不在 `figure.highlight` 内）与 `.article-content figure.highlight` 上，长按（touchstart 持续 >= 450ms）会触发复制。
2. 复制成功：
   - toast 提示包含复制行数（中文：`已复制 N 行`；英文：`Copied N lines`）
   - 代码块出现短暂高亮反馈（`is-copied` class）
3. 复制失败：toast 提示失败文案，并选中代码内容以便手动复制。
4. 不影响现有“点击复制按钮 / 双击复制”行为。
5. 实现需幂等：重复 init 不应重复绑定事件。

## 边界
- 只处理 touch 长按（不为桌面端增加新快捷键）。
- 不做复杂的滚动/拖动判定；touchmove 即取消本次长按。

## 测试策略（TDD）
- jsdom + node:test：
  - 注入后对 pre 触发 touchstart，等待短阈值（测试注入 longPressMs=10），断言 clipboard.writeText 被调用，toast 更新
  - touchmove 会取消长按复制

## 交付物
- 更新 `themes/evan/source/js/code-copy.js` 支持 long-press
- 新增测试覆盖
- 测试通过后提交并推送
