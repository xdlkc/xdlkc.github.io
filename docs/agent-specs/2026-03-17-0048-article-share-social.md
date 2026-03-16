# 文章分享到社交媒体

## 需求描述

为文章页面添加分享到社交媒体的功能，用户可以一键分享文章链接到 Twitter/X、微博、微信（扫码）等平台，提升文章传播能力。

## 功能范围

### 核心功能

1. **分享按钮展示**
   - 在文章元数据区域添加分享按钮
   - 支持多个主流社交平台：Twitter/X、微博、LinkedIn、微信（扫码）
   - 按钮显示平台图标和平台名称
   - 点击按钮打开分享链接

2. **分享链接生成**
   - Twitter/X: 通过 `https://twitter.com/intent/tweet` 分享
   - 微博: 通过 `https://service.weibo.com/share/share.php` 分享
   - LinkedIn: 通过 `https://www.linkedin.com/sharing/share-offsite/` 分享
   - 微信: 生成二维码弹窗，用户扫码分享

3. **分享内容优化**
   - 自动提取文章标题作为分享文本
   - 自动使用文章 URL 作为分享链接
   - 支持 via 参数（@xdlkc）增加品牌曝光

### 边界条件

1. **移动端优化**
   - 微信端自动检测，优先显示微信分享按钮
   - 移动端按钮布局适配小屏幕

2. **打开方式**
   - Twitter/微博/LinkedIn: 新标签页打开
   - 微信: 弹窗显示二维码

3. **隐私和安全**
   - 不收集用户分享行为数据
   - 仅生成分享链接，不涉及第三方 SDK

## 验收标准

1. 文章页面正确显示分享按钮组
2. 点击 Twitter 按钮，在新标签页打开 Twitter 分享页面，预填充标题和链接
3. 点击微博按钮，在新标签页打开微博分享页面，预填充标题和链接
4. 点击 LinkedIn 按钮，在新标签页打开 LinkedIn 分享页面
5. 点击微信按钮，显示二维码弹窗（文章链接的二维码）
6. 分享按钮在中英文模式下正确显示
7. 分享链接正确包含文章标题和 URL

## 实现细节

### HTML 结构

```html
<div class="article-share" data-article-share>
  <span class="article-share-label" data-i18n-key="post.share">Share:</span>
  <a class="article-share-link article-share-twitter" href="#" data-share-platform="twitter" aria-label="Share to Twitter">Twitter</a>
  <a class="article-share-link article-share-weibo" href="#" data-share-platform="weibo" aria-label="Share to Weibo">Weibo</a>
  <a class="article-share-link article-share-linkedin" href="#" data-share-platform="linkedin" aria-label="Share to LinkedIn">LinkedIn</a>
  <button class="article-share-link article-share-wechat" type="button" data-share-platform="wechat" aria-label="Share to WeChat">WeChat</button>
</div>
```

### 分享链接格式

- Twitter: `https://twitter.com/intent/tweet?text={title}&url={url}&via=xdlkc`
- 微博: `https://service.weibo.com/share/share.php?title={title}&url={url}`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={url}`

### 二维码生成

使用轻量级库 `qrcode` 或使用公共 API 如 `https://api.qrserver.com/v1/create-qr-code/` 生成二维码。

### UI元素

- `[data-article-share]` - 分享容器
- `[data-share-platform]` - 分享按钮（平台标识）
- `.article-share-qr-modal` - 微信二维码弹窗

### 优先级

- P0: 核心分享功能（Twitter、微博、LinkedIn）
- P1: 微信扫码分享
- P2: 更多社交平台（Reddit、Hacker News 等）

## 不包含的功能

- 分享行为统计和分析
- 自定义分享内容编辑
- 复杂的第三方 SDK 集成
- 分享到邮件或其他非社交平台
