# 阅读进度条

## 需求描述

在文章页顶部显示一个阅读进度条，实时反映用户阅读文章的进度。当用户滚动浏览文章时，进度条会根据当前滚动位置动态更新百分比。

## 功能范围

### 核心功能

1. **进度条显示**
   - 位置：文章页顶部，固定或跟随滚动
   - 样式：细长的水平条，视觉上不突兀
   - 动画：进度变化时有平滑过渡效果

2. **进度计算**
   - 基于滚动位置：`scrollTop / (scrollHeight - clientHeight) * 100`
   - 范围：0% 到 100%
   - 更新时机：页面滚动时实时更新

3. **页面识别**
   - 只在文章页（`/YYYY/MM/DD/title.html`）显示
   - 其他页面不显示（首页、分类页、标签页等）

4. **性能优化**
   - 使用 `requestAnimationFrame` 优化滚动事件处理
   - 避免频繁的 DOM 操作
   - 进度条元素使用 CSS `transform` 而非 `width`，触发 GPU 加速

5. **主题适配**
   - 支持亮色模式和暗色模式
   - 进度条颜色与主题协调

### 边界条件

1. **短文章处理**
   - 文章内容不足以滚动时，进度条保持 0% 或根据内容高度调整

2. **滚动边界**
   - 滚动到顶部：进度为 0%
   - 滚动到底部：进度为 100%

3. **页面切换**
   - 从文章页切换到其他页面时，移除进度条或隐藏
   - 避免内存泄漏

4. **窗口调整**
   - 响应式设计，窗口大小变化不影响进度计算

## 验收标准

1. 文章页顶部显示阅读进度条
2. 滚动页面时，进度条实时更新
3. 进度计算准确（0% - 100%）
4. 只在文章页显示，其他页面不显示
5. 暗色模式下进度条颜色协调
6. 进度变化动画流畅
7. 页面性能不受影响（滚动流畅，无卡顿）

## 实现细节

### HTML 结构

```html
<div class="reading-progress" role="progressbar" aria-label="阅读进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
  <div class="reading-progress-bar"></div>
</div>
```

### CSS 样式

```css
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: transparent;
  z-index: 1000;
}

.reading-progress-bar {
  height: 100%;
  background-color: var(--primary-color, #3498db);
  width: 0%;
  transition: transform 0.1s ease-out;
  transform-origin: left;
}

/* 暗色模式 */
[data-theme="dark"] .reading-progress-bar {
  background-color: var(--primary-color, #5dade2);
}
```

### JavaScript 实现

```javascript
window.ReadingProgress = {
  progressElement: null,
  progressBarElement: null,

  initReadingProgress() {
    // 只在文章页初始化
    if (!this.isPostPage()) {
      return;
    }

    this.progressElement = document.querySelector('.reading-progress');
    this.progressBarElement = document.querySelector('.reading-progress-bar');

    if (!this.progressElement || !this.progressBarElement) {
      return;
    }

    // 使用 requestAnimationFrame 优化滚动事件
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    });

    // 初始更新
    this.updateProgress();
  },

  updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight <= clientHeight) {
      this.setProgress(0);
      return;
    }

    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    this.setProgress(Math.min(100, Math.max(0, progress)));
  },

  setProgress(value) {
    if (this.progressBarElement) {
      // 使用 transform 优化性能
      this.progressBarElement.style.transform = `scaleX(${value / 100})`;
      this.progressElement.setAttribute('aria-valuenow', Math.round(value));
    }
  },

  isPostPage() {
    // 检查当前页面是否是文章页
    const path = window.location.pathname;
    return /^\/\d{4}\/\d{2}\/\d{2}\//.test(path);
  }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  window.ReadingProgress.initReadingProgress();
});
```

### 测试要点

1. 验证只在文章页显示
2. 验证进度计算正确（0%, 50%, 100%）
3. 验证滚动时实时更新
4. 验证边界情况（短文章、窗口调整）
5. 验证性能优化（requestAnimationFrame）
6. 验证暗色模式适配

## 不包含的功能

- 阅读时间估算（已存在）
- 阅读速度统计
- 阅读历史记录
- 文章间进度保存
- 进度保存到 localStorage

## 参考资料

- [Web Accessibility Initiative - ARIA Progress Bar](https://www.w3.org/WAI/ARIA/apg/patterns/progressbar/)
- [MDN - Performance optimization](https://developer.mozilla.org/en-US/docs/Learn/Performance)
