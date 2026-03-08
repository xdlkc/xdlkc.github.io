# Spec: 阅读进度条支持“拖拽跳转” (Drag-to-seek)

- 时间：2026-03-08 16:34 (Asia/Shanghai)
- Slug: reading-progress-drag-to-seek

## 背景 / 动机
目前文章页顶部的阅读进度条支持“单击跳转”与“双击回到顶部”。但在长文中，用户常希望像播放器进度条一样“按住拖动”快速定位到目标进度；单击在部分情况下不够直观。

## 需求
为 `.reading-progress` 增加拖拽交互：

1. 鼠标按下（mouse down）在进度条上时，立即按当前指针位置跳转到对应阅读进度。
2. 按住拖动（mouse move）时，持续更新跳转位置（节流由浏览器事件频率自然限制即可，不强制 rAF）。
3. 松开鼠标（mouse up）或移出窗口（window blur）时，结束拖拽并清理事件监听。
4. 交互期间给 `.reading-progress` 增加 `is-dragging` class，松开后移除（用于未来样式/反馈扩展）。
5. 保持现有行为不变：
   - 单击跳转仍可用
   - 双击回到顶部仍可用
   - 百分比 label 与 aria 属性更新逻辑不改变

## 验收标准 (Acceptance Criteria)
- 在支持 DOM 的环境中：
  - `initReadingProgress()` 后，`mousedown` + `mousemove` 会触发多次 `window.scrollTo(...)`，且 `top` 随指针位置变化。
  - `mouseup` 后 `is-dragging` class 被移除，且后续 `mousemove` 不再触发滚动。
- `npm test` 全部通过。

## 边界 / 不做
- 不实现移动端 touch / pointer events 的完整适配（可在未来增强）。本次先保证桌面鼠标拖拽可用；实现上允许顺带兼容 PointerEvent，但不作为验收必要项。
- 不新增复杂 UI（如浮动 tooltip）。
