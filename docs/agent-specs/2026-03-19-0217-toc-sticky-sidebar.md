# Spec: 文章目录侧边栏固定定位优化

- Date: 2026-03-19 02:17 (Asia/Shanghai)
- Feature slug: toc-sticky-sidebar

## 背景 / 问题
用户在阅读长文章时，目录（TOC）通常显示在侧边栏。但当前实现在滚动文章内容时，目录会随页面一起滚动，当用户滚动到目录下方时，目录就看不到了，需要手动滚回顶部才能看到目录。

用户期望目录能够在滚动时固定在视口顶部，这样无论用户阅读到文章的哪个部分，都可以随时点击目录跳转到对应章节。

## 需求
为文章页面的目录添加固定定位功能：

### R1. 目录固定定位
- 当用户滚动到目录下方时，目录应该固定在视口顶部
- 固定时目录应该保持原来的宽度（不变形）
- 固定时目录应该保持原来的样式（不影响其他元素）

### R2. 固定触发条件
- 只有当目录滚动到视口顶部以外时才触发固定定位
- 目录上方应该有一个偏移量（与导航栏高度对齐）
- 滚动回到目录原始位置时，取消固定定位

### R3. 性能优化
- 使用 `position: sticky` CSS 属性实现（推荐）
- 或使用 Intersection Observer API 监测目录位置（兼容方案）
- 避免使用 `scroll` 事件监听器（性能问题）

### R4. 用户体验
- 固定切换应该平滑（无闪烁）
- 不应该影响文章内容的正常滚动
- 移动端可以选择禁用固定定位（屏幕空间有限）

### R5. 可访问性
- 固定定位不应该影响键盘导航
- 应该保持正确的 ARIA 属性和角色

## 验收标准
1. 在长文章页面滚动到目录下方时，目录固定在视口顶部
2. 固定时目录保持原有宽度和样式
3. 滚动回到目录原始位置时，目录取消固定定位
4. 固定切换平滑，无闪烁
5. 不影响文章内容的正常滚动
6. 移动端可以选择禁用固定定位（通过 CSS 媒体查询）
7. 新增测试文件 `tests/toc-sticky-sidebar.test.js`
8. `npm test` 全部通过

## 边界 / 不做
- 不修改目录的点击跳转行为
- 不修改目录的展开/折叠行为
- 不修改目录的自动滚动高亮行为
- 不支持动态调整固定偏移量（从配置读取）

## 技术细节

### 文件变更
- `themes/evan/source/js/toc-sticky-sidebar.js` - 新增目录固定定位功能脚本
- `themes/evan/layout/post.ejs` - 引入脚本 `<script src="<%- url_for('/js/toc-sticky-sidebar.js') %>" defer></script>`
- `themes/evan/source/css/_partial/toc.styl` - 新增或更新样式（可选，可内联到主样式）

### 实现逻辑
1. 检测目录容器 `.toc-sidebar`
2. 使用 `position: sticky` CSS 属性（推荐）：
   - 设置 `top: 80px`（与导航栏高度对齐）
   - 设置 `max-height: calc(100vh - 100px)`（防止超出视口）
3. 或使用 Intersection Observer API（兼容方案）：
   - 监听目录容器的可见性
   - 当目录离开视口时，添加固定定位类
   - 当目录进入视口时，移除固定定位类
4. 移动端禁用固定定位（CSS 媒体查询 `@media (max-width: 768px)`）

### 风险
- 低风险：只添加新功能，不影响现有行为
- `position: sticky` 在某些旧浏览器中不支持（需要 fallback）
- 移动端可能会占用太多屏幕空间（通过 CSS 禁用）

### 示例代码
```css
/* 方案1：使用 CSS sticky */
.toc-sidebar {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

/* 移动端禁用固定定位 */
@media (max-width: 768px) {
  .toc-sidebar {
    position: static;
  }
}
```

```javascript
// 方案2：使用 Intersection Observer（fallback）
const sidebar = document.querySelector('.toc-sidebar');
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    sidebar.classList.remove('is-sticky');
  } else {
    sidebar.classList.add('is-sticky');
  }
});
observer.observe(sidebar);
```
