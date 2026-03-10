# Spec: 阅读进度条可折叠 + 记忆状态（Reading Progress Collapse）

## 背景 / 问题
站点顶部的阅读进度条（reading-progress）在某些阅读场景下会显得“占视线/分散注意力”。希望用户能快速把它折叠为更轻量的形态，并在下次访问时记住偏好。

## 需求
在文章页与页面页（post/page layout）顶部的阅读进度条上新增“折叠/展开”能力，并将折叠状态持久化到 localStorage。

## 验收标准（可验证）
1. 页面存在 `.reading-progress` 时：
   - 初始化后自动插入一个可点击的折叠按钮（例如 `.reading-progress-toggle`）。
   - 按钮具有可访问性属性：`type="button"`、`aria-label`（中英随 langMode 切换）、`aria-pressed` 反映当前折叠状态。
2. 折叠行为：
   - 点击按钮后，`.reading-progress` 在 `is-collapsed` 与非折叠状态之间切换。
   - 折叠状态下：进度条保持可见（保留底部 3px bar），但整体高度显著变小，且百分比 label 隐藏（减少干扰）。
3. 状态记忆：
   - 使用 `localStorage` key：`xdlkc:reading-progress:collapsed`。
   - 值为 `'1'` 表示折叠，`'0'`/缺失表示不折叠。
   - 刷新页面后应恢复到上次状态。
4. 键盘快捷键：
   - 在非输入框焦点下按 `p` 可切换折叠/展开（不与现有 Arrow/ Home/End seek 冲突）。
5. 不改变现有阅读进度计算逻辑（percent/seek/标题前缀等保持不变）。

## 边界 / 非目标
- 不做跨设备同步（只依赖当前浏览器 localStorage）。
- 不新增额外 UI 面板或复杂动画；只做轻量 CSS 状态切换。
- 若 localStorage 不可用：功能仍可用（仅不记忆）。

## 实现提示
- 修改 `themes/evan/source/js/reading-progress.js`：新增 toggle 按钮注入、读写 localStorage、全局 keydown 监听（按需过滤 editable 目标）。
- 修改 `themes/evan/source/css/style.css`：新增 `.reading-progress-toggle` 与 `.reading-progress.is-collapsed` 样式，并在折叠时隐藏 `.reading-progress-label`。
- 测试：新增 `tests/reading-progress-collapse.test.js`，使用 jsdom 验证：
  - 初始化注入按钮；
  - 点击后 class 切换 + localStorage 写入；
  - 读取 localStorage 初始折叠态。
