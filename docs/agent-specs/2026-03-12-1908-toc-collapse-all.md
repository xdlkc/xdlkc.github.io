# Spec: TOC 一键收起/展开全部（桌面端）

- Date: 2026-03-12 19:08 (Asia/Shanghai)
- Slug: toc-collapse-all

## 背景 / 用户价值
文章目录（TOC）在长文里经常有多层级。逐个折叠会打断阅读节奏。

提供一个「一键收起/展开全部」按钮，让用户在阅读时能快速把目录变得更紧凑，或快速展开查看结构。

## 需求
在文章页桌面端 TOC（`.toc-card`）标题栏增加一个按钮，用于：
- 一键收起所有带子目录的 TOC 节点
- 一键展开所有带子目录的 TOC 节点

并与现有的「单项折叠」能力协作（`enhanceCollapsibleToc`）。

## 验收标准（Acceptance Criteria）
1. 当页面存在桌面端 TOC（`.toc-card .toc-nav`）且 TOC 内存在至少 1 个“带子列表（ol/ul）”的条目时：
   - TOC 标题栏出现按钮 `.toc-collapse-all`。
2. 初始按钮文案：
   - 若当前至少存在 1 个可折叠节点未折叠 → 显示「收起全部」（英文模式：`Collapse all`）
   - 若所有可折叠节点都已折叠 → 显示「展开全部」（英文模式：`Expand all`）
3. 点击「收起全部」后：
   - 所有带子列表的 `li` 增加 `.is-collapsed`
   - 对应的单项折叠按钮（`.toc-collapse-btn`）`aria-expanded="false"`
   - 折叠状态写入 `localStorage['xdlkc:toc:collapsed']`（数组形式，id 规则与现有逻辑一致：优先 `a[href]`，否则 `idx:<n>`）
4. 点击「展开全部」后：
   - 所有带子列表的 `li` 移除 `.is-collapsed`
   - `.toc-collapse-btn` 的 `aria-expanded="true"`
   - `localStorage['xdlkc:toc:collapsed']` 中对应项被清空
5. 幂等：重复初始化（`initTocScrollSpy` 多次调用）不会重复插入按钮或重复绑定事件。

## 边界 / 非目标
- 不改移动端 TOC（`details.toc-mobile`）交互。
- 不改变 TOC 的生成逻辑与 scrollspy 高亮逻辑。
- 不引入新的存储 key（复用 `xdlkc:toc:collapsed`）。

## 测试策略（TDD）
- 使用 JSDOM 构造一个含嵌套列表的 TOC DOM。
- 调用 `enhanceCollapsibleToc` 后再调用新函数注入按钮。
- 断言：按钮存在、文案随折叠状态变化；点击后 class 与 localStorage 正确更新。
