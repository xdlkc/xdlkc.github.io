# Spec: 图片懒加载功能

**创建时间**: 2026-03-19 14:38
**功能名称**: 图片懒加载（Image Lazy Loading）
**优先级**: P0（性能优化）

## 需求背景

博客文章中包含大量图片，特别是技术博客中的架构图、流程图等。当页面首次加载时，所有图片都会同时下载，导致：
1. 首屏加载时间过长
2. 不必要的带宽消耗
3. 用户可能看不到首屏以下的内容，但图片已加载

## 功能描述

为博客中的所有图片实现懒加载功能，延迟加载视口外的图片，直到用户滚动到该位置时再加载。

## 用户可见价值

- **页面加载速度提升**：首屏加载时间减少 30-50%
- **流量节省**：只加载用户实际查看的图片
- **体验优化**：首屏内容更快呈现

## 技术实现

### 方案选择

使用现代浏览器原生的 `loading="lazy"` 属性，这是最优方案：
- 浏览器原生支持，无需 JavaScript
- 性能最优
- 自动处理视口检测和延迟加载
- 回退方案：不支持 `loading="lazy"` 的旧浏览器会忽略该属性，正常加载图片

### 实现位置

在 Hexo 的文章渲染过程中，为所有 `<img>` 标签添加 `loading="lazy"` 属性。

### 需要修改的文件

1. 创建或修改 Hexo 插件脚本：`scripts/image-lazy-loading.js`
2. 可能需要修改模板文件（取决于主题结构）

## 验收标准

### 功能验收

1. ✅ 所有文章中的 `<img>` 标签都包含 `loading="lazy"` 属性
2. ✅ 生成的 HTML 中的图片标签格式正确：`<img src="..." loading="lazy">`
3. ✅ 不影响已有图片的其他属性（如 `alt`、`class`、`style` 等）
4. ✅ 支持所有图片格式（jpg, png, gif, svg, webp 等）

### 测试验收

1. ✅ 单元测试：验证 `loading="lazy"` 属性被正确添加
2. ✅ 集成测试：验证完整文章渲染后的 HTML 输出
3. ✅ 性能测试：验证页面加载时间确实减少（可选）

### 兼容性

1. ✅ Chrome 76+ ✅ 支持
2. ✅ Firefox 75+ ✅ 支持
3. ✅ Safari 15.4+ ✅ 支持
4. ✅ Edge 79+ ✅ 支持
5. ✅ 不支持 `loading="lazy"` 的浏览器会忽略该属性，不影响功能

## 边界情况

### 不需要懒加载的情况

以下图片不添加 `loading="lazy"`：
1. 首屏第一张图片（可选，根据实际情况决定）
2. `<img>` 标签在折叠内容内（如 details/summary）
3. 头像、Logo 等小尺寸固定图片

### 注意事项

- 保持与现有代码的兼容性
- 不破坏已有的图片相关功能（如灯箱、复制等）
- 不增加额外的 JavaScript 依赖

## 实施步骤

1. 创建 `scripts/image-lazy-loading.js` 插件脚本
2. 编写单元测试 `tests/image-lazy-loading.test.js`
3. 运行测试确保通过
4. 提交代码并推送

## 回滚方案

如果出现问题，可以通过以下方式回滚：
1. 删除或禁用 `scripts/image-lazy-loading.js` 文件
2. 重新生成静态文件

## 参考资料

- MDN: https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading
- Web.dev: https://web.dev/browser-level-image-lazy-loading/
- Can I Use: https://caniuse.com/loading-lazy-attr
