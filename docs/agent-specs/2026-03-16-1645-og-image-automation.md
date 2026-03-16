# Spec: OG Image 自动化增强

## 需求
在没有手动配置 OG Image 的文章页中，自动抓取文章的第一张图片作为 OG Image。如果文章没有图片，回退到默认站点 OG Image。

## 验收标准
1. 有图片的文章，`meta property="og:image"` 使用第一张图。
2. 无图片的文章，`meta property="og:image"` 使用默认图。

## 边界
如果文章的第一张图是外部 HTTP 链接且失效，不处理连通性，直接使用该链接。
