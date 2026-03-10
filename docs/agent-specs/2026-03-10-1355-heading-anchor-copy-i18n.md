# Spec: 文章锚点复制按钮 i18n（中英）

时间：2026-03-10 13:55 (Asia/Shanghai)

## 背景 / 问题
文章标题旁的「#」锚点复制按钮（`themes/evan/source/js/heading-anchor-copy.js`）目前文案为中文：
- aria-label 固定为「复制本节链接」
- 成功/失败 toast 固定为「链接已复制 / 复制失败，请手动复制」

当用户切换到英文模式（`document.documentElement.dataset.langMode = 'en'`）时，这些反馈仍为中文，属于用户可感知的不一致。

## 需求
1. 在英文模式（langMode=en）下：
   - 按钮 `aria-label` 使用英文（例如："Copy section link"）
   - toast 成功提示为 "Link copied"（或语义等价）
   - toast 失败提示为 "Copy failed, please copy manually"（或语义等价）
2. 在中文模式（langMode=zh 或缺省）下：保持现有中文文案不变。
3. 幂等：重复执行 `initHeadingAnchorCopy()` 不应重复注入按钮。
4. 语言切换后（站点会 dispatch `xdlkc:lang-change` 事件）：
   - 已注入按钮的 `aria-label` 应随语言刷新（无需重新注入按钮）。

## 验收标准
- `npm test` 通过
- 单元测试覆盖：
  - en/zh 两种 langMode 下文案选择正确（aria-label + toast 文案）
  - `xdlkc:lang-change` 事件能刷新已存在按钮的 aria-label
  - 幂等：重复 init 不重复插入 `.heading-anchor-button`

## 边界 / 非目标
- 不改变按钮的可见符号（仍为 `#`）
- 不实现复杂的 i18n 框架；仅根据 `dataset.langMode` 做轻量分支
- 不改变页面结构、样式体系（只扩展行为与文案）
