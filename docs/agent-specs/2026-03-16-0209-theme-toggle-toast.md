# Spec: Theme toggle toast feedback

- Date: 2026-03-16 02:09 (Asia/Shanghai)
- Slug: theme-toggle-toast

## Problem / Motivation
当前主题切换（System/Light/Dark）会更新按钮文案与页面样式，但缺少即时、可感知的反馈；尤其在按钮不在视口内或用快捷键 `d` 切换时，用户不容易确认当前处于哪种模式。

## User Story
作为读者，当我点击“主题”按钮或使用快捷键切换主题时，我希望看到一个短暂的提示，告诉我当前主题模式，以便我确认切换已经生效。

## Requirements
1) 当用户触发主题切换（点击 `[data-theme-toggle]` 或快捷键触发的同等 click）后，页面右下角出现一个 toast 提示。
2) toast 文案与按钮的可见 label 一致：
   - 中文：`主题：跟随系统|浅色|深色`
   - 英文：`Theme: System|Light|Dark`
3) toast 自动消失（约 1.4s），且多次快速切换时应重置计时器，不叠加多个 toast。
4) 初始加载（init）不显示 toast；仅用户主动切换时显示。

## Acceptance Criteria
- 在 JSDOM 测试中，调用 `initThemeToggle()` 后，模拟点击按钮：
  - DOM 中注入且仅注入一个 `.theme-toggle-toast` 元素
  - 点击后 `.theme-toggle-toast` 具有 `is-visible` 类
  - `.theme-toggle-toast.textContent` 包含切换后的按钮文案（如 `主题：浅色`）
- 不破坏现有主题切换行为与持久化逻辑。

## Non-goals / Boundaries
- 不改动主题切换的模式循环顺序（system -> light -> dark -> system）。
- 不新增第三方依赖。
- 不在跨标签页 storage sync/系统主题变更时弹 toast（避免干扰）。
