# Spec: Code copy 成功后高亮代码块（视觉反馈）

- 时间：2026-03-08 11:34 (Asia/Shanghai)
- Slug: code-copy-visual-feedback

## 背景 / 问题
站点已有代码块「复制代码」按钮与 toast 提示，但在长文里用户点击后，视线不一定在右下角 toast 上；希望在代码块本身也给一个短暂、明确的视觉反馈（用户可感知）。

## 需求
当用户点击代码块右上角「复制代码」按钮并复制成功时：
1. 当前代码块容器（`pre` 或 `figure.highlight`）应短暂增加一个可见的高亮效果（例如边框/阴影）。
2. 高亮效果在约 1.2s 左右自动消失。
3. 复制失败时不添加高亮（只保留现有 toast 失败提示）。

## 验收标准
- ✅ 点击复制按钮并复制成功后，对应容器会添加 `is-copied` class。
- ✅ 约 1.2s 后 `is-copied` class 会被移除。
- ✅ 复制失败时不添加 `is-copied`。
- ✅ 现有 copy toast / 按钮文案行为不被破坏。

## 边界 / Non-goals
- 不调整现有复制逻辑（Clipboard API / fallback）策略。
- 不引入第三方依赖。
- 不改变代码块 HTML 结构（仍由现有 `initCodeCopy` 注入按钮）。
