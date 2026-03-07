# Spec: 移动端文章目录点击后自动收起（TOC Auto-close)

- 时间：2026-03-07 10:34 (Asia/Shanghai)
- 功能 slug：toc-mobile-autoclose

## 背景 / 问题
文章页在移动端使用 `<details class="toc-mobile">` 展示 TOC。当前用户点击 TOC 的某一项后页面会滚动到对应标题，但 TOC 抽屉仍保持展开，容易遮挡阅读内容，需要用户手动再收起一次。

## 需求
当用户在移动端 TOC（`details.toc-mobile`）中点击任意目录链接（`.toc-nav a[href^="#"]`）时：
1. 正常执行现有的平滑滚动与 hash 更新逻辑；
2. 若该链接位于 `details.toc-mobile` 内，则在点击后自动关闭该 `details`（移除 `open`）。

## 验收标准
- [ ] 点击移动端 TOC 链接后，`details.toc-mobile` 的 `open` 属性被移除（即自动收起）。
- [ ] 桌面端 TOC（不在 `details.toc-mobile` 内）行为不变。
- [ ] 该行为对无 `details` 包裹的 TOC 不产生副作用。

## 边界 / 非目标
- 不新增/修改 TOC 的 HTML 结构（仅 JS 行为增强）。
- 不处理“点击目录项后自动滚动目录容器”之类复杂交互。
- 不引入新依赖。
