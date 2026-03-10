# Spec: 站内搜索「清空最近搜索」按钮

- 时间：2026-03-10 23:16 (Asia/Shanghai)
- Feature slug: site-search-clear-recent

## 背景 / 问题
站内搜索弹窗会展示「最近搜索」chips，但当历史积累后，用户缺少一个显式方式清空（例如分享电脑/隐私需求/避免干扰）。

## 需求
在站内搜索弹窗中：
1) 当存在最近搜索记录时（localStorage 中 xdlkc:site-search:recent 非空），在「最近搜索」标题右侧展示一个“清空”(Clear)按钮。
2) 点击“清空”后：
   - 清空最近搜索存储（该 key 置为空数组）
   - 立即更新 UI：不再展示「最近搜索」区域（仍可显示热门标签区域）
3) i18n：
   - 中文：按钮文案“清空”，aria-label “清空最近搜索”
   - 英文：按钮文案“Clear”，aria-label “Clear recent searches”

## 验收标准
- [ ] renderResults(query 为空, recentQueries 非空) 时，DOM 中存在 [data-site-search-clear-recent] 按钮。
- [ ] 点击按钮后，localStorage 的 recent key 保存值为 []（或等价空数组）。
- [ ] 点击按钮后，DOM 不再包含 [data-site-search-recent]（最近搜索模块被移除）。

## 边界 / 不做
- 不做“删除单条历史”
- 不调整最近搜索写入时机（仍然仅在点击结果时记录）
- 不改变 RECENT_LIMIT 规则
