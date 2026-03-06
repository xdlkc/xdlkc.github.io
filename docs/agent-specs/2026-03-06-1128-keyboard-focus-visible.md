# Spec: 键盘焦点高亮可视化

- 时间: 2026-03-06 11:28 (Asia/Shanghai)
- 类型: UX / 可访问性

## 背景
当前站点主要依赖颜色与布局表达状态，键盘用户在使用 Tab 导航时，焦点位置不够显著，影响操作确定性。

## 需求
为站点的可交互元素补充统一的 `:focus-visible` 样式，确保键盘导航时焦点可见。

## 验收标准
1. 在 `themes/evan/source/css/style.css` 中新增统一焦点规则，目标至少覆盖：`a`、`button`、`input`、`textarea`、`select`、`summary`、`[role="button"]`。
2. 焦点规则需包含：
   - `outline`（使用站点强调色变量 `var(--accent)`）
   - `outline-offset`
3. 使用 `:focus-visible`（而不是仅 `:focus`），避免鼠标点击场景出现过度样式噪音。

## 边界
- 本次不改动页面结构与交互逻辑。
- 本次不引入 JS 焦点管理，仅做 CSS 增强。
- 不调整既有 hover/active 样式。