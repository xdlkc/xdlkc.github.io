# Spec: TOC 可见性记忆（按 `t` 隐藏/显示后可跨刷新保持）

- 时间：2026-03-08 22:34 (Asia/Shanghai)
- Slug: toc-visibility-persist

## 背景 / 问题
当前文章页支持按键 `t` 快捷键隐藏/显示桌面端 TOC（目录）。但这个状态在刷新/重新打开页面后会丢失。

对于会长时间阅读同一类文章的用户来说，“我就是不想看 TOC / 我希望一直显示 TOC”是一个稳定偏好，应该被记住。

## 需求
- 当用户在**桌面端 TOC**上使用 `t` 键切换可见性时，将偏好写入 localStorage。
- 页面初始化 TOC（`initTocScrollSpy`）时读取该偏好，并在满足显示条件时应用。

## 验收标准
1. 默认情况下（localStorage 没有记录），TOC 行为与当前一致。
2. 当用户按 `t` 将桌面 TOC 隐藏后：
   - TOC 元素带有 `hidden` 属性，且 `aria-hidden="true"`
   - localStorage 写入 `xdlkc:toc:hidden = "1"`
3. 再次按 `t` 显示 TOC 后：
   - 移除 `hidden` 与 `aria-hidden`
   - localStorage 写入 `xdlkc:toc:hidden = "0"`（或删除该 key 也可，但测试以写入 0 为准）
4. 刷新/重新初始化（再次调用 `initTocScrollSpy`）时：
   - 若 `xdlkc:toc:hidden === "1"` 且文章有 >=2 个 heading，则 TOC 初始保持隐藏。
5. 不改变现有“文章标题太少自动隐藏 TOC”的规则：
   - 如果文章 heading < 2，依然强制隐藏（即便存储为显示）。

## 边界 / 非目标
- 不要求持久化移动端 `<details class="toc-mobile">` 的 open/close 状态。
- 不引入新的 UI 控件，只复用现有 `t` 快捷键。
- localStorage 不可用时应静默失败，不影响页面功能。

## 实现建议
- 新增 storage key：`xdlkc:toc:hidden`。
- 在 `initTocScrollSpy` 中注入 `storage` 与 `hiddenStorageKey` 可选参数以便测试。
- 在 `t` 的 keydown handler 中，切换隐藏状态后 best-effort 写入 storage。
