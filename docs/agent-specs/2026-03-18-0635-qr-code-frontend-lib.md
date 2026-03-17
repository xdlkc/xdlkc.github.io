# Spec: 使用前端库生成二维码（QR Code Frontend Library）

- Date: 2026-03-18 06:35 (Asia/Shanghai)
- Slug: qr-code-frontend-lib

## 背景 / 问题
当前博客的文章分享二维码功能使用外部 API (api.qrserver.com) 生成二维码，存在以下问题：
- 依赖外部服务，存在可用性风险
- 需要网络请求，性能不佳
- 生成速度受网络延迟影响
- 隐私问题（URL 被发送到外部服务器）

用户期望：
- 快速生成二维码，无需等待网络请求
- 不依赖外部服务，提高可靠性
- 更好的隐私保护（URL 不发送到外部服务器）

## 需求
将二维码生成从外部 API 改为使用前端库：

### R1. 使用前端库
- 选择轻量级 QR Code 生成库（推荐 qrcode 或 qrcodejs2）
- 通过 npm 安装，作为项目依赖
- 在文章分享功能中集成该库

### R2. 本地生成二维码
- 使用 Canvas API 或 SVG 方式生成二维码
- 二维码包含当前文章的完整 URL
- 生成速度应显著快于外部 API（<100ms）

### R3. 保持现有功能
- 保持模态框显示方式
- 保持关闭功能（点击外部、关闭按钮、ESC 键）
- 保持无障碍性支持（aria 属性）
- 保持响应式设计

### R4. 降级处理
- 如果前端库加载失败或生成失败，显示友好错误提示
- 提供后备方案（显示文章链接或重试按钮）

### R5. 性能和兼容性
- 二维码大小适中（200x200 - 300x300 像素）
- 支持所有现代浏览器
- 不影响页面加载性能（按需生成）

## 验收标准
1. 点击微信分享按钮时，使用前端库生成二维码
2. 二维码生成速度快（<100ms）
3. 二维码包含正确的文章 URL
4. 不发送网络请求到外部 API
5. 保持所有现有功能正常工作
6. 新增测试文件 `tests/qr-code-frontend-lib.test.js`
7. 修改 `js/article-share.js` 以使用前端库
8. 添加 QR Code 库到 package.json
9. `npm test` 全部通过

## 边界 / 不做
- 不实现二维码自定义样式（颜色、Logo 等）
- 不实现二维码下载/保存功能
- 不修改模态框的样式和布局
- 不支持批量生成二维码

## 技术实现

### 推荐库
- qrcode (https://www.npmjs.com/package/qrcode) - 推荐，支持 Canvas 和 SVG
- qrcodejs2 (https://www.npmjs.com/package/qrcodejs2) - 备选

### 安装命令
```bash
npm install qrcode --save
```

### 代码修改
修改 `themes/evan/source/js/article-share.js` 中的 `openQrModal` 函数：

```javascript
// 原代码（使用外部 API）：
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
img.src = qrApiUrl;

// 新代码（使用前端库）：
const QRCode = require('qrcode');
QRCode.toCanvas(img, url, { width: 200, margin: 1 }, (error) => {
  if (error) {
    console.error('QR Code generation failed:', error);
    // 显示错误提示或使用后备方案
  }
});
```

### 测试要点
1. 测试二维码生成功能
2. 测试错误处理（库加载失败）
3. 测试生成性能（<100ms）
4. 测试兼容性（不同浏览器）
5. 测试降级处理

## 参考资料
- [qrcode npm package](https://www.npmjs.com/package/qrcode)
- [QR Code specification](https://www.qrcode.com/)
