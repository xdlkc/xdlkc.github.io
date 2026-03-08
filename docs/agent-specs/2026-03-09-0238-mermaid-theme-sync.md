# Spec: Mermaid 图表随主题切换自动重绘（深色/浅色）

日期：2026-03-09 02:38（Asia/Shanghai）

## 背景 / 问题
文章页支持 Mermaid（通过 `post.ejs` 内联 `mermaid` CDN module 渲染）。目前 Mermaid 初始化固定使用 `theme: "default"`，当用户切换到深色模式时，图表仍保持浅色主题，导致对比度差、观感不一致。

## 目标（用户可感知）
- 当页面处于深色模式时，Mermaid 图表使用深色主题渲染。
- 当用户在页面中切换主题（system/light/dark）后，已渲染的 Mermaid 图表会自动用新主题重绘，无需刷新页面。

## 需求
1. Mermaid 首次渲染时：根据 `document.documentElement.dataset.theme` 选择主题：
   - `dark` -> Mermaid theme 使用 `dark`
   - 其它（`light` 或缺省）-> Mermaid theme 使用 `default`
2. 主题切换后：检测到 `data-theme` 变化时，自动对页面内 `.mermaid` 容器重绘。
3. 为了可重绘：在首次渲染前把 Mermaid 源码保存到 DOM（例如 `data-mermaid-source`），重绘时先恢复源码再调用 Mermaid 渲染。
4. 渲染过程应当“尽量不打扰用户”：
   - 若页面没有 Mermaid 图表，不做任何事。
   - 重绘应当做节流/去抖（避免短时间多次切换导致频繁渲染）。

## 非目标 / 边界
- 不引入本地 Mermaid 打包（仍使用现有 CDN import）。
- 不改动非文章页（仅 `themes/evan/layout/post.ejs` 相关逻辑）。
- 不追求完全自定义 Mermaid 的主题色，仅选择官方 `default/dark`。

## 验收标准
- [ ] 在深色模式下打开包含 Mermaid 的文章：图表主题为深色（背景/线条/文字可读）。
- [ ] 点击“主题”按钮切换深色/浅色：图表能在 1s 内重绘到匹配主题。
- [ ] `npm test` 通过，新增的测试覆盖：主题到 Mermaid theme 的映射、以及“保存/恢复源码”逻辑。
