# Spec: Theme Toggle 支持「跟随系统」模式（System / Light / Dark）

## 背景 / 动机
当前站点仅支持 Light/Dark 两态切换并持久化。许多读者希望「跟随系统」作为第三态：
- 默认跟随系统深浅色
- 仍可强制浅色/深色
- 读者可在三态间循环切换

这是一个小而完整、用户可感知的功能：主题按钮会显示当前模式，并且在 System 模式下系统主题变化时页面会自动更新。

## 需求
1. 主题偏好支持三种模式：`system | light | dark`，持久化到 `localStorage`（key 保持不变：`xdlkc:theme`）。
2. 页面实际渲染仍使用 `data-theme="light|dark"`（用于 CSS），并新增 `data-theme-mode="system|light|dark"` 供调试与未来样式使用。
3. 点击主题按钮循环切换：`system -> light -> dark -> system`。
4. 在 `system` 模式下：
   - 初始主题由 `prefers-color-scheme` 决定；
   - 如果系统主题在页面打开期间发生变化，页面应自动更新（light <-> dark）。
5. 按钮文案（可见）反映当前模式，例如：
   - `主题：跟随系统`
   - `主题：浅色`
   - `主题：深色`

## 验收标准
- 单元测试覆盖：
  - `resolveInitialTheme` 在 saved=`system` 时回退到 `prefersDark`；
  - `toggleThemeMode` 循环顺序正确；
  - `applyThemeToDocument` 同时设置 `data-theme` 与 `data-theme-mode`，并更新按钮 `aria-pressed` 与文案。
- `npm test` 通过。
- 手动预期：页面右上角主题按钮文字会变化；选择“跟随系统”时，系统切换深浅色后页面随之更新。

## 边界 / 非目标
- 不引入新的 UI 组件（如下拉菜单）；仅使用现有按钮。
- 不改动整体 CSS 主题配色方案。
- 不处理无 `matchMedia` 环境的动态系统切换（仅保证不报错，初始逻辑按默认 light）。
