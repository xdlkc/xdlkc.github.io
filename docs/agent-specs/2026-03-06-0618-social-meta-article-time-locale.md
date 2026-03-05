# Spec: 社交元信息补充 `og:locale` 与文章发布时间

## 背景
当前页面已经输出基础 Open Graph / Twitter 元信息，但缺少语言区域（`og:locale`）以及文章时间（`article:published_time` / `article:modified_time`）。这会降低社交平台抓取和 SEO 语义完整度。

## 需求
为站点新增一项小功能：在不改变现有页面结构的前提下，扩展 `social_meta` 能力并输出额外 meta 标签。

## 功能说明
1. `social_meta` 新增 `locale` 字段：
   - 从 `site.language` 推导；
   - 语言格式从 `zh-CN` 规范为 `zh_CN`（即连字符改下划线）；
   - 若包含地区码则地区部分大写（如 `en-us` -> `en_US`）。
2. 当页面是文章（`type = article`）时：
   - 输出 `articlePublishedTime`（来源 `page.date`）；
   - 输出 `articleModifiedTime`（来源 `page.updated`）；
   - 时间统一为 ISO-8601 字符串。
3. 模板层新增 meta 输出：
   - 始终输出 `<meta property="og:locale" ...>`；
   - 仅当存在值时输出 `article:published_time` / `article:modified_time`。

## 验收标准
- 单元测试覆盖：
  - 能正确生成 `locale`；
  - 文章页能生成 ISO 格式发布时间与修改时间；
  - 非文章页不生成文章时间字段（为空）。
- 原有 `social-meta` 测试全部通过。
- `npm test` 全量通过。

## 边界与非目标
- 不引入多语言映射表，不做复杂 locale 兜底，仅做格式规范化。
- 不修改页面视觉样式。
- 不新增第三方依赖。
