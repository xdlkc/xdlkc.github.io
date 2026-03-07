# Spec: 可折叠的文章目录（TOC Collapsible）

- Feature slug: `toc-collapsible`
- Date: 2026-03-08 07:34 (Asia/Shanghai)

## 背景 / 问题
文章较长且目录包含多级标题时（H2/H3/H4），目录会变得很长，读者在侧边栏/移动端 TOC 中定位主章节会更困难。

## 需求
为文章页 TOC 增加“折叠/展开子标题”的能力：
- 若某个 TOC 条目下存在子列表（nested `ol/ul`），则为该条目注入一个折叠按钮。
- 点击折叠按钮只影响该条目的子列表显示，不影响正文滚动与 TOC 链接跳转。
- 需要保证可访问性（`aria-expanded` 等）。

## 验收标准（可验证）
1. 文章页 TOC（桌面侧边栏 + 移动端 details 中的 TOC）里：
   - 当某一项存在子目录时，会出现一个可点击的折叠按钮。
2. 点击折叠按钮：
   - 该项的子目录会隐藏/显示切换。
   - 按钮 `aria-expanded` 会随状态更新（展开=true，折叠=false）。
3. 目录增强逻辑幂等：重复初始化不会重复插入按钮。
4. 不改变既有 TOC 的锚点行为与 scrollspy 行为。

## 边界 / 非目标
- 不做“记住折叠状态”的持久化（localStorage）
- 不对没有子列表的条目显示折叠按钮
- 不调整 TOC 生成算法（仍以 Hexo helper 输出为主）

## 实现思路（最小方案）
- 在 `themes/evan/source/js/toc-scrollspy.js` 中新增 `enhanceCollapsibleToc(toc, {document})`：
  - 遍历 `li`，若其直接包含 `ol/ul` 子列表，则插入 `button.toc-collapse-btn`。
  - 点击按钮切换 `li.is-collapsed`，并设置 `aria-expanded`。
- 在 `initTocScrollSpy()` 中，在绑定链接滚动逻辑之前执行一次增强。
- CSS：隐藏 `li.is-collapsed` 下的子列表，并为按钮提供基本样式。

