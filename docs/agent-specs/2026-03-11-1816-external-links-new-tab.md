# Spec: 外链自动新窗口打开 + 安全 rel + 轻量标识

Date: 2026-03-11 18:16 (Asia/Shanghai)
Slug: external-links-new-tab

## 需求 / 用户价值
读者在文章中点开外部链接时，经常希望不丢失当前阅读上下文。

本功能让**文章正文中的外部链接**默认在新标签页打开，并自动补齐安全属性（避免 `window.opener` 风险），同时用一个轻量的外链标识提升可感知性。

## 验收标准
1) 仅处理 `.article-content` 内的 `<a>`。
2) 对满足“外链”判断的链接：
   - 自动设置 `target="_blank"`（若作者已设置 target，则不覆盖）。
   - 自动设置 `rel`，至少包含 `noopener` 与 `noreferrer`（保留作者已有 rel 其它值）。
   - 增加 class：`external-link`。
3) **不处理**以下链接：
   - 站内相对路径（`/xxx`、`./xxx`、`../xxx`）
   - 同源绝对链接（与 `location.origin` 相同）
   - `mailto:` / `tel:` / `javascript:`
   - 纯 hash（`#heading`）
4) `initExternalLinks()` 可重复调用，具备幂等性：不会重复追加 class，也不会多次改写 rel。

## 边界/约束
- 在 Node 测试环境（无真实浏览器）也不应抛错。
- 以 `new URL(href, location.href)` 解析链接；若 URL 解析失败则跳过。

## 测试计划（TDD）
- jsdom 单元测试：
  - 外链：设置 target/rel/class。
  - 同源：不改。
  - 相对链接/hash/mailto：不改。
  - 幂等：重复 init 后结果不变。
