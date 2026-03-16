# 代码块语言标签显示

## 需求描述

在文章页的代码块右上角显示编程语言标签，帮助读者快速识别代码块使用的编程语言，提升阅读体验。

## 功能范围

### 核心功能

1. **语言标签显示**
   - 位置：代码块右上角，在复制按钮旁边
   - 样式：小型标签，与复制按钮协调
   - 内容：显示编程语言名称（如 JavaScript、Python、CSS）

2. **语言识别**
   - 从代码块的类名提取语言信息（如 `language-javascript`、`lang-python`）
   - 支持常见编程语言：JavaScript、Python、CSS、HTML、Java、C、C++、Ruby、Go、Rust 等
   - 如果无法识别语言，显示"Code"或不显示标签

3. **样式适配**
   - 亮色模式：深色背景标签
   - 暗色模式：浅色背景标签
   - 响应式：移动端隐藏标签（节省空间）

### 边界条件

1. **无语言信息**
   - 如果代码块没有语言类名，不显示标签
   - 如果语言名称无效或无法识别，显示"Code"

2. **Mermaid 图表**
   - Mermaid 图表不显示语言标签（由 Mermaid 渲染）

3. **移动端**
   - 小屏幕（宽度 < 768px）隐藏语言标签
   - 保持复制按钮可见

## 验收标准

1. 文章页的代码块右上角显示编程语言标签
2. 语言标签显示正确的编程语言名称
3. 无语言信息的代码块不显示标签
4. Mermaid 图表不显示语言标签
5. 亮色模式和暗色模式下标签样式协调
6. 移动端语言标签隐藏
7. 不影响现有复制按钮功能

## 实现细节

### HTML 结构

```html
<pre class="language-javascript">
  <div class="code-block-header">
    <span class="code-language-label">JavaScript</span>
    <button class="code-copy-button">Copy</button>
  </div>
  <code>...</code>
</pre>
```

### CSS 样式

```css
.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem;
  background: rgba(127, 127, 127, 0.1);
  border-bottom-left-radius: 4px;
}

.code-language-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 暗色模式 */
[data-theme="dark"] .code-language-label {
  color: var(--text-secondary-dark, #999);
}

/* 移动端隐藏 */
@media (max-width: 767px) {
  .code-language-label {
    display: none;
  }
}
```

### JavaScript 实现

```javascript
window.CodeLanguageLabel = {
  initCodeLanguageLabel() {
    const codeBlocks = document.querySelectorAll('.article-content pre[class*="language-"], .article-content pre[class*="lang-"]');

    codeBlocks.forEach(block => {
      // Skip Mermaid blocks
      if (block.classList.contains('mermaid')) return;

      const language = this.extractLanguage(block);
      if (!language) return;

      this.addLanguageLabel(block, language);
    });
  },

  extractLanguage(block) {
    const classes = Array.from(block.classList);

    // Extract language from class name
    const languageClass = classes.find(cls =>
      cls.startsWith('language-') || cls.startsWith('lang-')
    );

    if (!languageClass) return null;

    const language = languageClass.replace(/^(language-|lang-)/, '');

    // Map common language codes to display names
    const languageMap = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'c': 'C',
      'cpp': 'C++',
      'cs': 'C#',
      'java': 'Java',
      'kt': 'Kotlin',
      'swift': 'Swift',
      'php': 'PHP',
      'sh': 'Shell',
      'bash': 'Bash',
      'sql': 'SQL',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'md': 'Markdown',
    };

    return languageMap[language.toLowerCase()] || language;
  },

  addLanguageLabel(block, language) {
    const header = document.createElement('div');
    header.className = 'code-block-header';

    const label = document.createElement('span');
    label.className = 'code-language-label';
    label.textContent = language;

    // Insert before existing content
    block.insertBefore(header, block.firstChild);
  }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  window.CodeLanguageLabel.initCodeLanguageLabel();
});
```

### 测试要点

1. 验证语言标签显示正确的编程语言名称
2. 验证无语言信息的代码块不显示标签
3. 验证 Mermaid 图表不显示语言标签
4. 验证移动端语言标签隐藏
5. 验证亮色模式和暗色模式样式协调
6. 验证不影响复制按钮功能

## 不包含的功能

- 语言标签点击切换语言
- 代码块语法高亮（已由 Hexo 提供）
- 语言标签的图标/徽章样式
- 多语言标签（一个代码块只有一个语言）

## 参考资料

- [Hexo - Tag Plugins](https://hexo.io/docs/tag-plugins#Code-Block)
- [Common Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
