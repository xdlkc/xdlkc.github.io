# Spec: TOC 自动滚动保持当前章节可见

## 背景/动机
文章较长、目录（TOC）较多时，右侧 TOC 会出现滚动条。当前实现会高亮 active heading，但高亮项可能在可视区域外，用户需要手动滚动 TOC 才能看到当前位置。

## 需求
- 当滚动正文导致 active TOC link 更新时：
  - 若 active link 在 TOC 容器可视区域之外，自动调整 TOC 容器的 scrollTop，让 active link 回到可视区域（靠近最近边缘）。
  - 若已在可视区域内，不做滚动。
- 不应影响页面整体滚动位置（只滚动 TOC 容器）。

## 验收标准
- `TocScrollSpy` 提供一个可测试的纯函数，用于计算为了让 active link 可见所需的 `scrollTop`。
- 单元测试覆盖：
  - active link 在容器上方不可见 → scrollTop 向上调整到 link 顶部。
  - active link 在容器下方不可见 → scrollTop 向下调整到 link 底部对齐容器底部。
  - active link 已可见 → scrollTop 不变。

## 边界/不做
- 不做复杂动画（可选）。
- 不处理多级折叠目录。
- 不修改 TOC 结构，只在现有 `.toc-nav` 容器上生效。
