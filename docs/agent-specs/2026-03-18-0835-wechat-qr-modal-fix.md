# WeChat QR Modal Display Fix

## 需求

修复 WeChat 分享二维码模态框在测试环境中无法正确显示的问题。

## 背景

测试 `ArticleShare: WeChat button opens QR modal` 和 `ArticleShare: clicking close button closes QR modal` 失败：

```
AssertionError [ERR_ASSERTION]: The input did not match the regular expression /(block|flex)/.
Input: 'none'
```

这说明点击 WeChat 按钮后，模态框的 display 属性仍然为 'none'，而不是期望的 'block' 或 'flex'。

## 问题分析

当前 `openQrModal` 函数是 async 的，但点击事件处理函数没有正确等待异步操作完成。在测试环境中（JSDOM + `runScripts: 'outside-only'`），async 操作可能不会立即完成，导致模态框样式没有更新。

## 验收标准

1. 点击 WeChat 按钮后，模态框应立即显示（display 为 'block'）
2. QR 码生成可以在后台异步进行
3. 测试应通过，模态框的 display 应为 'block' 或 'flex'
4. 点击关闭按钮后，模态框应隐藏（display 为 'none'）

## 边界条件

- 如果 URL 无效，应显示错误提示或使用 fallback API
- 如果 QR 码生成失败，应回退到外部 API
- 模态框应支持 ESC 键和点击外部区域关闭

## 实现方案

修改 `article-share.js` 的 `openQrModal` 函数：

1. 先设置模态框为可见状态（`display: 'block'`）
2. 然后异步生成 QR 码
3. 如果失败，回退到外部 API
4. 确保 modal 样式更新在 async 操作之前完成

## 测试用例

1. 点击 WeChat 按钮，模态框立即显示
2. QR 图片 src 被正确设置（本地或外部 API）
3. 点击关闭按钮，模态框隐藏
4. 点击外部区域，模态框隐藏
5. 按 ESC 键，模态框隐藏
