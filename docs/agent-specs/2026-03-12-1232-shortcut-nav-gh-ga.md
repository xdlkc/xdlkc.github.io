# Spec: 键盘快捷键 g+h / g+a 快速跳转（Home / Archives）

- Feature slug: `shortcut-nav-gh-ga`
- Date: 2026-03-12 12:32 (Asia/Shanghai)

## 背景 / 问题
站点已提供 `?` 快捷键帮助与 `/` 站内搜索，但缺少“快速回到首页/归档”的低摩擦操作。

## 目标（用户可感知）
新增一个常见的两键序列导航：
- 按下 `g` 然后 `h`：跳转到首页 `/`
- 按下 `g` 然后 `a`：跳转到归档页 `/archives/`

（灵感来源于 GitHub / 文档站常用的 `g` 前缀导航）

## 验收标准
1. 在非输入状态（不在 input/textarea/select/contenteditable）下：
   - `g` + `h` 在 800ms 内触发 `location.assign('/')`
   - `g` + `a` 在 800ms 内触发 `location.assign('/archives/')`
2. 触发后应 `preventDefault()`（避免页面滚动等副作用）。
3. 只在无 meta/ctrl/alt 修饰键时生效。
4. 若超过 800ms 未按第二个键，则不跳转。
5. 在输入框中打字时不得触发。
6. 快捷键帮助面板（ShortcutHelp）列表中新增两条说明：
   - `g h` — Home
   - `g a` — Archives
   文案随 langMode（zh/en）切换。

## 边界 / 非目标
- 不做更复杂的多级快捷键系统；只实现上述两条。
- 不做 hash 导航或滚动行为。

## 实现备注
- 在 `themes/evan/source/js/shortcut-help.js` 中实现。
- `initShortcutHelp` 允许注入 `location`（测试用），默认使用 `root.location` 或 `window.location`。
