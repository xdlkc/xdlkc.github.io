# Spec: 文章页 TOC 一键显示/隐藏（持久化）

- 时间：2026-03-10 01:19 (Asia/Shanghai)
- 功能名：TOC Toggle Button

## 背景 / 问题
当前文章页 TOC（右侧 Outline）已经支持键盘 `t` 快捷键隐藏/显示，但这是“发现成本较高”的能力；对移动端/触屏用户也不友好。

## 需求
在文章页（post）右侧 TOC 卡片中提供一个可点击按钮，用于显示/隐藏 TOC，并将用户偏好持久化到 localStorage。

## 验收标准
1) 当文章存在 TOC 且 heading 数量 >= 2 时：
   - TOC 区域显示一个按钮（例如“隐藏/显示”图标或文字）。
   - 点击按钮会在“显示/隐藏”之间切换。
2) 切换后需要持久化：刷新页面后保持用户上次选择（仅桌面 TOC；移动端 `<details class="toc-mobile">` 不受影响）。
3) 可访问性：
   - 按钮为 `<button type="button">`
   - 具备 aria-label（中英文无强制，但至少有中文）
   - 用 `aria-pressed` 或 `aria-expanded` 表达状态（二选一即可）。
4) 不破坏现有能力：
   - `t` 快捷键仍可用
   - scrollspy 高亮仍可用

## 边界 / 非目标
- 不改 TOC 内容生成策略，不改 heading id 规则。
- 不为短文章（heading < 2）强行显示桌面 TOC。
- 不做样式大改，只做一个“小而完整”的交互入口。

## 测试策略（TDD）
- jsdom 集成测试：构造包含 `.toc-nav`、`.article-content`、两个 heading 以及 TOC toggle button 的 DOM。
- 调用 `initTocScrollSpy({ storage: stubStorage })` 后：
  - 点击按钮应为 `.toc-nav` 设置/移除 `hidden` + `aria-hidden`。
  - `storage.setItem('xdlkc:toc:hidden', '1'|'0')` 被调用且值正确。
  - 按钮 `aria-pressed`（或 aria-expanded）同步更新。
