# Spec: URL 参数临时覆盖主题模式（theme=dark|light|system）

## 背景 / 用户价值
站点主题模式目前通过按钮切换并持久化到 localStorage。分享链接时，无法让接收者“临时以暗色/浅色/跟随系统”打开某一页。

新增一个**小而完整、用户可感知**的能力：URL querystring 里加 `theme` 参数即可临时覆盖本页主题模式。

示例：
- `...?theme=dark` 强制暗色
- `...?theme=light` 强制浅色
- `...?theme=system` 强制跟随系统

## 需求
1. 当 URL 参数 `theme` 值为 `dark|light|system` 时：
   - 本页 `data-theme-mode` = 对应 mode
   - 本页 `data-theme` 解析规则：
     - mode=dark/light => theme 同 mode
     - mode=system => theme 由 `prefers-color-scheme` 决定
2. URL 覆盖**不写入** localStorage（只影响当前 URL 打开的页面）。
3. 尽量减少闪烁：`themes/evan/layout/layout.ejs` head 的 early-theme 脚本也要支持该覆盖。
4. 非法值（例如 `theme=blue`）忽略，回退到原逻辑（localStorage / system）。

## 验收标准
- localStorage 保存 `light`，但 URL 为 `?theme=dark`：最终 `dataset.themeMode === 'dark'` 且 `dataset.theme === 'dark'`，并且 localStorage 仍为 `light`。
- URL 为 `?theme=system` 且 prefersDark=true：最终 theme=dark 且 themeMode=system。
- URL 为 `?theme=blue`：行为与无参数一致。
- `npm test` 全部通过。

## 边界 / 不做
- 不新增 UI 提示条/分享按钮。
- 不实现跨页面持续覆盖（只对当前 URL 生效）。
- 不改变主题切换按钮的循环规则。