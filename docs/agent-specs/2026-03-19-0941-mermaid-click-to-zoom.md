# Spec: Mermaid 图表点击放大

- Date: 2026-03-19 09:41 (Asia/Shanghai)
- Feature slug: mermaid-click-to-zoom

## 背景 / 问题

技术博客文章中经常包含 Mermaid 图表（流程图、时序图、类图等）来展示复杂的架构和逻辑。当这些图表在文章中显示时，由于屏幕空间限制，可能会出现以下问题：

1. **细节难以看清**：复杂的流程图在默认尺寸下，文字和箭头可能太小
2. **移动端体验差**：在手机上查看时，图表被压缩，可读性更差
3. **无法放大查看**：用户无法放大查看图表的特定部分
4. **与图片体验不一致**：博客的图片已经支持点击放大（lightbox），但 Mermaid 图表不支持

用户期望能够像查看图片一样，点击 Mermaid 图表后放大查看，以便更好地理解复杂的架构图。

## 需求

为文章页面中的 Mermaid 图表添加点击放大功能：

### R1. 触发方式
- 点击 Mermaid 图表时打开放大视图
- 鼠标悬停时显示提示光标（cursor: zoom-in）
- 添加视觉提示（如图标或边框）表示可点击

### R2. 放大视图
- 在全屏模态框中显示放大后的 Mermaid 图表
- 图表居中显示，占据大部分屏幕空间
- 支持水平滚动（如果图表宽度超过屏幕）
- 背景使用半透明遮罩（rgba(0, 0, 0, 0.8)）

### R3. 关闭方式
- 点击遮罩区域关闭放大视图
- 按 `Escape` 键关闭放大视图
- 点击关闭按钮（右上角 ×）关闭放大视图
- 支持 ARIA 标签和键盘导航

### R4. 性能优化
- 使用事件委托，避免为每个图表单独绑定事件
- 复制 Mermaid 图表的内容，而不是移动 DOM 节点
- 使用 CSS transform 进行缩放（可选，基于实现方式）
- 懒加载放大功能，仅在用户首次点击时初始化

### R5. 可访问性
- 放大视图使用 `role="dialog"` 或 `role="img"`
- 添加 `aria-label` 描述图表内容
- 使用 `aria-modal="true"` 标记模态框
- 支持焦点管理（focus trap）
- 关闭按钮有清晰的 `aria-label`

### R6. 国际化支持
- 中文：`点击放大 Mermaid 图表` / `按 ESC 关闭`
- 英文：`Click to zoom Mermaid diagram` / `Press ESC to close`

### R7. 响应式设计
- 桌面端：最大宽度限制为 90vw，最大高度限制为 90vh
- 移动端：占据全屏，宽度 100vw，高度 100vh
- 图表保持宽高比

## 验收标准

1. 文章页面中的 Mermaid 图表可以点击放大
2. 鼠标悬停在 Mermaid 图表上时，显示 zoom-in 光标
3. 点击图表后，打开全屏模态框显示放大的图表
4. 放大视图中的图表清晰可见，不会被压缩
5. 点击遮罩区域可以关闭放大视图
6. 按 `Escape` 键可以关闭放大视图
7. 点击关闭按钮（×）可以关闭放大视图
8. 关闭放大视图后，可以重新打开同一个图表的放大视图
9. 放大视图使用语义化的 HTML 和 ARIA 属性
10. 中英文模式下，显示正确的提示文本
11. 桌面端和移动端的放大视图布局正确
12. 新增测试文件 `tests/mermaid-click-to-zoom.test.js`
13. 新增脚本 `themes/evan/source/js/mermaid-click-to-zoom.js`
14. 新增样式 `themes/evan/source/css/mermaid-click-to-zoom.css`（可选）
15. 在 `themes/evan/layout/post.ejs` 中引入脚本
16. `npm test` 全部通过

## 边界 / 不做

- 不修改 Mermaid 图表的渲染逻辑
- 不支持自定义缩放比例（使用默认放大比例）
- 不支持在放大视图中编辑图表
- 不支持图表拖拽移动（仅支持滚动）
- 不支持同时打开多个图表的放大视图

## 技术细节

### 文件变更
- `themes/evan/source/js/mermaid-click-to-zoom.js` - 新增放大功能脚本
- `themes/evan/layout/post.ejs` - 引入脚本 `<script src="<%- url_for('/js/mermaid-click-to-zoom.js') %>" defer></script>`
- `themes/evan/source/css/mermaid-click-to-zoom.css` - 新增样式（可选，可内联到主样式）

### 实现逻辑

1. **事件委托**：在 `document` 上监听点击事件，判断点击目标是否为 Mermaid 图表
2. **打开放大视图**：
   - 创建或显示模态框容器
   - 复制被点击的 Mermaid 图表的内容（SVG）
   - 将复制的内容插入模态框
   - 添加 ARIA 属性和焦点管理
3. **关闭放大视图**：
   - 移除或隐藏模态框
   - 恢复焦点到触发元素
   - 清理模态框内容

### 示例代码

```javascript
function initMermaidClickToZoom({ document = globalThis.document } = {}) {
  if (!document?.querySelector) return;

  // 事件委托
  document.addEventListener('click', (event) => {
    const target = event.target.closest('.mermaid');
    if (!target) return;

    openMermaidLightbox(target);
  });

  function openMermaidLightbox(mermaidElement) {
    const modal = document.createElement('div');
    modal.className = 'mermaid-lightbox';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Mermaid diagram zoomed view');

    // 复制 SVG 内容
    const clone = mermaidElement.cloneNode(true);
    clone.id = '';

    const content = document.createElement('div');
    content.className = 'mermaid-lightbox-content';
    content.appendChild(clone);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mermaid-lightbox-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close zoomed view');

    modal.appendChild(content);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);

    // 焦点管理
    closeBtn.focus();

    // 关闭逻辑
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });

    closeBtn.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    }, { once: true });

    function closeLightbox() {
      document.body.removeChild(modal);
      mermaidElement.focus();
    }
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => initMermaidClickToZoom());
}
```

### CSS 样式

```css
.mermaid {
  cursor: zoom-in;
  position: relative;
}

.mermaid::after {
  content: '🔍';
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0.5;
  pointer-events: none;
}

.mermaid-lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.mermaid-lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.mermaid-lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: none;
  font-size: 32px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .mermaid-lightbox-content {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
}
```

### 风险
- 低风险：纯前端功能，不影响现有 Mermaid 渲染
- 需要确保复制 SVG 时保留所有必要的样式和交互
- 需要处理多次点击同一个图表的情况
- 移动端可能需要额外的触摸事件处理

### 测试策略
- 单元测试：验证事件委托逻辑
- 单元测试：验证模态框创建和销毁
- 行为测试：验证点击 Mermaid 图表打开放大视图
- 行为测试：验证关闭放大视图的各种方式
- 行为测试：验证 ARIA 属性和焦点管理
- 行为测试：验证多次打开关闭同一个图表
