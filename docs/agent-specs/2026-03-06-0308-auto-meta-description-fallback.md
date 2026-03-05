# Spec: 自动生成 meta description（缺省回退）

## 背景
当前页面 `<meta name="description">` 仅使用 `page.description || config.description`。当文章未显式配置 `description` 时，会回退为站点统一描述，导致多数文章缺少与正文相关的 SEO 摘要。

## 需求
新增一个模板 helper：当页面未提供 `description` 时，自动从文章内容/摘要生成简短描述，用于 `<meta name="description">`。

## 验收标准
1. 若 `page.description` 存在且非空（去除首尾空白后），优先使用它。
2. 若 `page.description` 不存在，则优先使用 `page.excerpt`；若无 `excerpt`，再使用 `page.content`。
3. 自动生成描述时：
   - 去除 HTML 标签；
   - 压缩多余空白为单个空格；
   - 截断到 160 字符以内；
   - 结果为空时回退 `config.description`。
4. 不影响已有页面渲染，不引入破坏性改动。

## 边界与非目标
- 不做智能分词或句子级摘要，仅做轻量文本清洗与截断。
- 不处理 Open Graph/Twitter Card，仅处理 `meta description`。
