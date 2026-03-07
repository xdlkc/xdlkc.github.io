# Spec: 文章页记住并恢复阅读位置（Scroll Restore）

- Date: 2026-03-08 00:34 (Asia/Shanghai)
- Slug: scroll-restore

## 背景 / 问题
在文章较长或需要来回对照代码时，读者刷新页面或返回文章页后经常需要手动滚回上次位置，体验割裂。

## 需求
在文章页（layout=post）与普通页面（layout=page）中：
1. 当用户离开页面（pagehide / beforeunload）时，记录当前 `scrollY` 到本地存储。
2. 当用户再次打开同一路径页面时：
   - 若 URL 没有 hash（`location.hash` 为空），自动滚动恢复到上次记录的位置。
   - 若有 hash（例如点击 TOC/锚点），不自动恢复，避免与锚点跳转冲突。
3. 记录应带时间戳，超过 7 天自动失效。
4. 恢复时需要做安全裁剪：不能滚动到负数或超过最大可滚动高度。

## 验收标准
- 刷新文章页：能回到刷新前的阅读位置（在无 hash 的情况下）。
- 打开带 hash 的文章链接（例如 `.../post/#section`）：页面应保持锚点行为，不触发 scroll restore。
- 本地存储里超过 7 天的数据不会触发恢复。
- 不抛异常：在 localStorage 不可用/被禁用时静默失败。

## 边界 / 不做
- 不做跨设备同步。
- 不做“每个 tab 独立”的复杂隔离（默认按 path 维度存）。
- 不做对外配置开关（保持实现小而完整）。

## 实现草案
- 新增脚本：`themes/evan/source/js/scroll-restore.js`
- 存储 key：`xdlkc:scroll:<pathname>`
- 值：`{ y: number, ts: number }`
- 在 `themes/evan/layout/layout.ejs` 全站引入脚本（defer），但仅在存在 `document.body` 时生效。

## 测试计划
- Node 单测（jsdom）：
  - save: 触发 pagehide 后 localStorage 写入正确 key/value。
  - restore: 满足条件时调用 `window.scrollTo(0, y)`。
  - hash: `location.hash` 非空时不调用 scrollTo。
  - expiry: ts 过期时不调用 scrollTo，并可选择清理该 key。
