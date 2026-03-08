# Spec: Theme mode cross-tab sync (ThemeToggle)

- Slug: theme-toggle-cross-tab-sync
- Date: 2026-03-08 13:34 (Asia/Shanghai)

## User story
当我在一个标签页切换「主题：跟随系统/浅色/深色」后，其他已打开的博客标签页应自动同步到同样的主题模式，不需要刷新。

## Motivation / Why it matters
- 博客文章经常多标签页阅读；主题偏好在标签页间不同步会造成体验割裂。
- 这是一个“小而完整、用户可感知”的功能：在另一个标签页点击主题切换，当前页立刻跟随变化。

## Acceptance criteria
1. 当 `localStorage['xdlkc:theme']` 在另一个标签页被修改，并触发 `storage` 事件时：
   - 当前页应读取最新保存的 mode（`system|light|dark`）。
   - 若 mode 为 `light` 或 `dark`：立即应用该主题，且 `data-theme-mode` 更新为相同 mode。
   - 若 mode 为 `system`：应按当前 `prefers-color-scheme` 解析成 `light|dark` 并应用，同时 `data-theme-mode` 仍为 `system`。
2. 仅响应 key 为 `xdlkc:theme` 的 storage 事件；其它 key 忽略。
3. 若浏览器不支持 `window.addEventListener('storage', ...)` 或无 `window` 环境（测试/SSR），不应抛错。

## Non-goals / Boundaries
- 不在本次实现中做“跨设备同步”。
- 不对 storage 事件进行节流/防抖（事件频率很低）。
- 不改变现有 toggle 的点击循环逻辑（system -> light -> dark -> system）。

## Test plan (TDD)
- 新增单元测试：
  - 初始化为 light（savedMode=light）后，模拟 storage 事件把 savedMode 改成 dark，应更新 `documentElement.dataset.theme` 为 `dark`。
  - 模拟无关 key 的 storage 事件，不应改变主题。
