# Spec: 代码块折叠状态记忆（sessionStorage）

## 背景 / 目标
当前文章页的长代码块默认折叠，用户点击“展开代码/收起代码”后，如果刷新页面或在同一标签页内重新加载，折叠状态会丢失。希望在**同一标签页**内记住每个代码块的展开/收起状态，让阅读体验更顺滑。

## 需求
- 对满足折叠条件（行数 >= minLines）的代码块（`pre` 与 `figure.highlight`）增加状态持久化：
  - 用户点击展开后，刷新页面仍保持展开。
  - 用户点击收起后，刷新页面仍保持收起。
- 状态粒度：**同一页面（pathname）+ 代码块顺序索引**。
- 存储介质：`sessionStorage`（只影响当前标签页，不跨标签页、不跨浏览器会话）。

## 验收标准
1. `initCodeCollapse()` 首次运行时：
   - 若 sessionStorage 中没有记录，默认折叠（保持现有行为）。
   - 若存在记录：
     - `expanded` => 代码块不带 `.is-collapsed`，按钮 `aria-expanded="true"`。
     - `collapsed` => 代码块带 `.is-collapsed`，按钮 `aria-expanded="false"`。
2. 用户点击按钮切换状态时：
   - 会写入/更新 sessionStorage 对应 key 的值。
3. 在同一页面再次执行 `initCodeCollapse()`：
   - 仍保持幂等（不重复绑定事件、不重复注入按钮）。

## 边界 / 不做
- 不跨标签页同步（不使用 localStorage + storage 事件）。
- 不对短代码块做任何处理。
- 不尝试对代码内容做 hash（避免性能与实现复杂度），仅使用索引。

## 技术方案（最小实现）
- Key：`xdlkc:code-collapse:${location.pathname}:${index}`
- Value：`expanded` | `collapsed`
- `initCodeCollapse({ root, minLines, storage, location })` 允许注入依赖，方便测试。
