# Spec: 暗色模式记忆

## 需求
支持站点的暗色模式状态切换与记忆，刷新页面后保留用户偏好。

## 验收标准
1. `localStorage` 保存 `theme` 键。
2. 页面加载时自动应用之前保存的 `theme`（添加 `data-theme="dark"` 到 `<html>`）。
3. 提供 `toggleTheme()` 切换状态，并同步存入 `localStorage`。

## 边界
- 无上次偏好时默认跟随系统或为亮色。
