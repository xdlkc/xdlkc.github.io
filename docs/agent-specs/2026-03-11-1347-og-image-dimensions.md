# Spec: OG Image 元信息增强（type/width/height）

- 时间：2026-03-11 13:47 (Asia/Shanghai)
- Slug: og-image-dimensions

## 背景 / 问题
当前页面已经输出 `og:image`，但缺少 `og:image:type` 与图片尺寸（`og:image:width/height`）。

很多分享平台/爬虫会用这些信息更快、更稳定地生成预览卡片；缺少时通常也能工作，但可能出现：
- 需要额外探测图片（变慢）
- 预览裁切/渲染不稳定

## 需求
为 **本地站内图片**（同域名且位于仓库内可访问的静态文件）自动补充：
- `og:image:type`
- `og:image:width`
- `og:image:height`

并保持对远程图片/不可解析图片的安全降级（不报错、不阻塞构建）。

## 验收标准
1) 当 `social_meta()` 选出的 `social.image` 指向站内图片（例如 `https://xdlkc.github.io/images/avatar.jpg` 或 `/images/avatar.jpg`）且文件存在时：
   - helper `buildSocialMeta()` 返回 `imageType`、`imageWidth`、`imageHeight`（width/height 为正整数）。
2) 当图片为远程 URL（例如 `https://cdn.example.com/a.png`）或文件不存在/格式不支持时：
   - `buildSocialMeta()` 仍返回原有字段；新增字段为空（""/0/null 均可，但要一致），且不会抛异常。
3) `themes/evan/layout/layout.ejs`：
   - 若 `social.imageType` 存在，输出 `<meta property="og:image:type" ...>`
   - 若 `social.imageWidth`/`social.imageHeight` 存在，输出对应 meta。
4) `npm test` 通过。

## 设计 / 实现要点（SDD）
- 新增 `scripts/helpers/image-dimensions.js`
  - 支持解析 PNG/JPEG 的宽高（读取文件头即可）。
  - 同时提供基于扩展名的 MIME 推断（jpg/png/gif/webp/svg）。
- `scripts/helpers/social-meta.js`
  - `buildSocialMeta()` 增加可选参数 `rootDir`（Hexo 中传 `hexo.base_dir`）。
  - 只对同域名或 root-relative 的路径尝试读取尺寸。
  - 文件读取失败/解析失败 -> 静默降级。

## 边界 / 非目标
- 不做在线请求探测远程图片尺寸。
- 先不支持 SVG 的宽高解析（SVG 常见是 viewBox/width/height，多变且需要 XML 解析），仅输出 type。
- 不修改现有 `og:image` 选图逻辑。
