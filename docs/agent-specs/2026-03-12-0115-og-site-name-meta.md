# Spec: OG 增加 og:site_name 元信息

- 日期：2026-03-12 01:15 (Asia/Shanghai)
- Feature slug：og-site-name-meta

## 背景 / 问题
站点当前已输出基础的 Open Graph / Twitter meta（title/description/url/type/image 等），但缺少 `og:site_name`。
在部分分享/预览场景中，`og:site_name` 可用于更清晰地展示来源站点名称。

## 需求
在页面 `<head>` 中输出：
- `<meta property="og:site_name" content="<站点标题>" />`

站点标题优先使用 Hexo `config.title`，并进行基础清洗（去 HTML / trim）。

## 验收标准
1. `themes/evan/layout/layout.ejs` 中包含 `og:site_name` meta 标签。
2. `social_meta()` 返回值包含 `siteName` 字段（供模板使用）。
3. 单元测试覆盖：模板确实渲染了 `og:site_name`。

## 边界 / 不做什么
- 不新增额外网络请求
- 不改变现有 OG/Twitter 字段的行为与优先级
- 不强依赖 Twitter 配置（如 twitter:site/creator）
