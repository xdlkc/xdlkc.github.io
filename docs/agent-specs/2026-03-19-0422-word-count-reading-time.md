# Spec: 文章字数统计与阅读时间显示

- Date: 2026-03-19 04:22 (Asia/Shanghai)
- Feature slug: word-count-reading-time

## 背景 / 问题
当前博客文章页面只显示发布日期，没有显示文章的字数和预估阅读时间。读者无法在开始阅读前快速了解文章的长度，影响阅读体验。

许多现代博客都会在文章元信息中显示字数和预估阅读时间（如 "3245 字 · 12 分钟阅读"），这有助于读者：
- 快速评估文章内容深度
- 决定是否现在阅读或稍后阅读
- 安排阅读时间

## 需求
为文章页面添加字数统计和预估阅读时间显示：

### R1. 字数统计
- 统计文章正文的字符数（中文按 1 字符计，英文按单词计）
- 统计范围：文章内容的纯文本部分（排除 HTML 标签）
- 字数格式化：使用千位分隔符（如 3,245）

### R2. 阅读时间估算
- 基于字数估算阅读时间
- 中文阅读速度：400 字/分钟
- 英文阅读速度：200 词/分钟
- 最小显示时间：1 分钟
- 时间显示：向上取整（如 12.3 分钟 → 13 分钟）

### R3. 显示位置
- 在文章元信息区域显示（与发布日期同一行）
- 格式："{字数} 字 · {时间} 分钟阅读"
- 如果字数为 0，不显示该项

### R4. 生成时优化
- 在 Hexo 生成时计算并存储字数（不依赖前端 JS）
- 使用 Hexo helper 函数实现
- 支持自定义阅读速度配置

### R5. 可访问性
- 添加适当的 ARIA 标签
- 支持屏幕阅读器
- 保持语义化

## 验收标准
1. 文章页面显示字数统计（如 "3,245 字"）
2. 文章页面显示预估阅读时间（如 "12 分钟阅读"）
3. 字数统计准确（排除 HTML 标签，中英文分别计算）
4. 阅读时间估算合理（基于配置的阅读速度）
5. 显示位置正确（在文章元信息区域）
6. 格式正确（"{字数} 字 · {时间} 分钟阅读"）
7. 短文章（< 1 分钟）也显示最小 1 分钟
8. 新增测试文件 `tests/word-count-reading-time.test.js`
9. `npm test` 全部通过

## 边界 / 不做
- 不统计代码块内容
- 不统计引言内容
- 不实时更新字数（仅在生成时计算）
- 不支持自定义显示格式（固定格式）
- 不支持多语言阅读速度配置

## 技术细节

### 文件变更
- `scripts/helpers/post-word-count.js` - 新增字数统计 helper（如果不存在）
- `scripts/helpers/reading-time.js` - 新增阅读时间估算 helper（如果不存在）
- `themes/evan/layout/post.ejs` - 在文章元信息区域添加字数和阅读时间显示

### 实现逻辑
1. **字数统计**：
   - 提取文章内容纯文本（去除 HTML 标签）
   - 中文统计：使用正则 `[\u4e00-\u9fa5]` 统计中文字符
   - 英文统计：使用正则 `[a-zA-Z]+` 统计英文单词
   - 总字数 = 中文字符数 + 英文单词数

2. **阅读时间估算**：
   - 中文阅读时间 = 中文字符数 / 400（分钟）
   - 英文阅读时间 = 英文单词数 / 200（分钟）
   - 总阅读时间 = 中文时间 + 英文时间
   - 向上取整，最小 1 分钟

3. **显示**：
   - 在文章元信息区域添加：
   ```html
   <span class="article-meta-word-count">3,245 字</span>
   <span class="article-meta-sep">·</span>
   <span class="article-meta-reading-time">12 分钟阅读</span>
   ```

### 配置选项（可选）
在 `_config.yml` 中添加配置：
```yaml
reading_time:
  chinese_speed: 400  # 中文阅读速度（字/分钟）
  english_speed: 200  # 英文阅读速度（词/分钟）
```

### 风险
- 低风险：只添加显示功能，不影响现有行为
- 字数统计可能不够精确（排除 HTML 标签但可能保留部分格式字符）
- 阅读时间因人而异（仅作为参考）

### 示例代码
```javascript
// 字数统计
hexo.extend.helper.register('post_word_count', function(post) {
  const content = post.content || '';
  const text = content.replace(/<[^>]*>/g, ''); // 去除 HTML 标签

  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

  return (chineseChars + englishWords).toLocaleString();
});

// 阅读时间
hexo.extend.helper.register('post_reading_time', function(post) {
  const config = hexo.config.reading_time || {};
  const chineseSpeed = config.chinese_speed || 400;
  const englishSpeed = config.english_speed || 200;

  const content = post.content || '';
  const text = content.replace(/<[^>]*>/g, '');

  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

  const chineseTime = chineseChars / chineseSpeed;
  const englishTime = englishWords / englishSpeed;
  const totalMinutes = Math.max(1, Math.ceil(chineseTime + englishTime));

  return totalMinutes;
});
```

```html
<!-- 显示 -->
<div class="article-meta">
  <time><%= date(page.date, 'YYYY-MM-DD') %></time>
  <% if (wordCount) { %>
    <span class="article-meta-sep">·</span>
    <span class="article-meta-word-count"><%= wordCount %> 字</span>
  <% } %>
  <% if (readingTime) { %>
    <span class="article-meta-sep">·</span>
    <span class="article-meta-reading-time"><%= readingTime %> 分钟阅读</span>
  <% } %>
</div>
```
