# Spec: TOC（移动端）展开状态记忆

- 时间：2026-03-16 04:19 (Asia/Shanghai)
- 功能名：移动端目录展开状态记忆

## 背景 / 问题
文章页在移动端会渲染一个 `<details class="toc-mobile">` 目录抽屉。用户每次打开页面时都需要重复展开目录；而桌面端 TOC 已支持可见性持久化（`xdlkc:toc:hidden` 等）。

## 需求
为移动端 TOC 增加“展开/折叠”状态记忆：

1) 当用户手动展开/折叠移动端 TOC（点击 `<summary>` 或通过快捷键 `t`），将状态写入 `localStorage`。
2) 再次进入任意带有移动端 TOC 的页面时，按上一次状态自动恢复（展开则带 `open` 属性，折叠则移除）。

## 验收标准
- 在存在 `details.toc-mobile` 的页面：
  - 初次加载默认行为不变（若无存储值则保持模板默认：通常为折叠）。
  - 用户展开后，`localStorage['xdlkc:toc:mobile-open'] === '1'`。
  - 用户折叠后，`localStorage['xdlkc:toc:mobile-open'] === '0'`。
  - 重新初始化（再次运行 `initTocScrollSpy`）或“刷新页面”的等效测试中，能根据存储值恢复 `open` 状态。
- 不影响桌面端 TOC 显示/隐藏持久化逻辑。
- 在 `localStorage` 不可用/抛错时不报错（静默降级，不持久化）。

## 边界 / 非目标
- 不跨设备同步。
- 不改变桌面端 `.toc-card` 的隐藏策略。
- 不引入新依赖。

## 实现提示
- 建议 storage key：`xdlkc:toc:mobile-open`。
- 监听 `details` 的 `toggle` 事件来记录展开状态；快捷键 `t` 修改 `open` 时也会触发 `toggle`（大多数浏览器），但仍需保证在代码路径里显式写入也没问题。
