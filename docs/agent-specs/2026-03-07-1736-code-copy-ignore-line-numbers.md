# Spec: 复制代码时自动忽略行号（SDD+TDD）

- 时间：2026-03-07 17:36 (Asia/Shanghai)
- 背景：Hexo 的 code highlight 常见结构是 `<figure class="highlight"><table>...<td class="gutter">行号</td><td class="code">代码</td>...`。
  目前复制逻辑会抓取所有 `.line`，导致把行号也复制进去，影响可用性。

## 需求

- 当代码块来自 `figure.highlight` 且 DOM 同时包含：
  - `.gutter .line`（行号）
  - `.code .line`（代码）
  复制时必须只复制 **代码列**，不包含行号。
- 若不存在 `.code .line`（某些渲染器结构不同），则退化为原来的 `.line` 提取逻辑。

## 验收标准

- 新增测试覆盖“含 gutter 行号 + code 代码列”的结构，测试先失败后通过。
- `npm test` 全部通过。

## 边界/非目标

- 不改变按钮 UI 文案/位置（本轮只修复复制内容）。
- 不尝试处理复杂的行内高亮 span（保持 textContent）。
