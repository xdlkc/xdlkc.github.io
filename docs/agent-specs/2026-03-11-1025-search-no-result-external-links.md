# Spec: 站内搜索无结果时提供外部搜索快捷入口

- 时间：2026-03-11 10:25 (Asia/Shanghai)
- 功能名：Search no-result external links
- 目标：当站内搜索无结果时，给用户一个“一键去外部搜索（限定本站）”的可见入口，降低卡住成本。

## 背景 / 问题
当前本地搜索在无结果时会展示：无结果提示 + 关键词 chip（可点回填）。
但用户仍然可能需要：
- 站内确实有内容，只是索引缺失/关键词不匹配；
- 想用更强的搜索引擎（Google/Bing）来搜本站。

## 需求
当搜索结果为空（no-result UI 渲染时）：
1. 在无结果面板中新增“外部搜索”区域，包含至少两个链接：
   - Google（站内搜索）：打开新窗口
   - Bing（站内搜索）：打开新窗口
2. 外部搜索链接的 query 必须包含 `site:<当前域名>` + 用户输入的原始 query（trim 后）。
3. 链接必须：
   - `target="_blank"`
   - `rel="noopener noreferrer"`
4. 不影响现有能力：
   - 关键词 chips 仍可点击回填并触发搜索
   - query 为空时仍显示默认放大镜（不渲染 no-result 面板）

## 验收标准（可测试）
- 在 JSDOM 环境中（url 为 `https://example.test/`），输入 `foo bar` 且无结果时：
  - `#search-result` 内存在两个外部搜索链接（可通过 `data-external-search` 标记查找）。
  - Google 链接 href 包含编码后的 `site:example.test foo bar`。
  - Bing 链接 href 包含编码后的 `site:example.test foo bar`。
  - 两个链接均具备 `target=_blank` 且 `rel` 包含 `noopener`。

## 边界 / 非目标
- 不做多语言文案体系改造（本次只加简洁中文提示）。
- 不新增第三方依赖。
- 不改动索引生成/搜索排序逻辑。
