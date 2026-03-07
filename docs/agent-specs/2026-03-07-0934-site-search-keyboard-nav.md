# Spec: 站内搜索结果键盘导航（ArrowUp/Down + Enter）

- 时间：2026-03-07 09:34 (Asia/Shanghai)
- Slug: site-search-keyboard-nav

## 背景 / 问题
当前站内搜索弹窗支持输入与回车打开第一条结果，但当结果列表较多时，用户只能用鼠标点选，键盘流不顺。

## 需求
在站内搜索弹窗中，为搜索结果增加“键盘可操作性”：

1) **ArrowDown / ArrowUp**：在结果列表中移动选中项
2) **Enter**：打开当前选中项；若没有选中项，保持现有行为（打开第一条结果）
3) 选中项需要有明确的视觉反馈（通过 class 即可，样式可后续再精调）

## 验收标准
- 打开搜索弹窗，输入关键词出现结果列表后：
  - 按一次 ArrowDown：第一条结果变为“选中”
  - 再按 ArrowDown：选中移动到第二条
  - 按 ArrowUp：选中回到第一条
  - 按 Enter：调用 location.assign() 跳转到选中项链接
- 不影响 IME 组合输入（event.isComposing 时不处理 Enter/方向键）
- 结果重新渲染（query 改变）后，选中状态重置为“未选中”

## 边界 / 非目标
- 不做完整的 roving tabindex / aria-activedescendant 体系（本轮以最小可用为目标）
- 不实现鼠标 hover 自动选中（避免意外跳动）
- 不修改 db.json 结构与索引生成逻辑
