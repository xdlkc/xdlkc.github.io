# Spec: 文章分享功能增加二维码生成（Article Share QR Code）

- Date: 2026-03-17 18:18 (Asia/Shanghai)
- Slug: article-share-qrcode

## 背景 / 问题
当前博客已有分享功能（Twitter、微博、LinkedIn、微信），但微信分享需要用户手动复制链接，不够便捷。

用户期望：
- 一键生成文章链接的二维码
- 方便通过手机扫描快速在移动设备上打开文章
- 简洁的 UI 集成到现有分享面板

## 需求
为文章分享功能增加二维码生成：

### R1. 二维码按钮位置和样式
- 在现有分享面板中添加"二维码"按钮（与其他分享按钮并列）
- 使用 QR Code 图标或文字"QR"
- 按钮悬停时高亮，有 hover 效果
- 在移动端和桌面端都可用

### R2. 二维码显示
- 点击二维码按钮时，弹出一个模态框（modal）显示二维码
- 二维码包含当前文章的完整 URL
- 二维码大小适中（200x200 - 300x300 像素）
- 模态框背景半透明，居中显示
- 点击模态框外部或关闭按钮可关闭

### R3. 二维码内容
- 二维码编码：完整的文章 URL
- URL 来源：使用 canonical URL（确保正确）
- 如果 canonical URL 不可用，使用 window.location.href

### R4. 无障碍性
- 二维码按钮有 `aria-label`："分享到移动设备（二维码）"
- 模态框有 `role="dialog"` 和适当的 `aria-labelledby`
- 键盘可访问（Tab 键可聚焦，Esc 键可关闭）
- 二维码图片有 `alt` 属性说明用途

### R5. 性能和兼容性
- 使用轻量级 QR Code 生成库（qrcodejs2 或 qrcode）
- 动态生成二维码，不依赖外部 API
- 不影响页面加载性能
- 支持所有现代浏览器

## 验收标准
1. 分享面板中有"二维码"按钮
2. 点击按钮弹出模态框显示二维码
3. 二维码包含正确的文章 URL
4. 点击模态框外部可关闭
5. 移动端和桌面端都能正常使用
6. 键盘导航可以访问二维码按钮和关闭模态框
7. 新增测试文件 `tests/article-share-qrcode.test.js`
8. 新增 JS 文件 `js/article-share-qrcode.js`
9. `layout.ejs` 或 `post.ejs` 引入 `article-share-qrcode.js`
10. `npm test` 全部通过

## 边界 / 不做
- 不实现二维码下载/保存功能
- 不支持自定义二维码样式（颜色、Logo 等）
- 不支持批量生成多个文章的二维码
- 不依赖外部二维码生成 API（使用前端库）
