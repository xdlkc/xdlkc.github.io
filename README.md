# xdlkc.github.io

这是博客的 Hexo 源码仓库。

## 环境要求

- Node.js 20+
- npm

## 安装依赖

```bash
npm install
```

## 本地预览

```bash
npx hexo server
```

打开：

```text
http://localhost:4000/
```

## 构建静态站点

```bash
npx hexo generate
```

生成结果在 `public/`。

## 发布新文章

使用发布脚本把 Obsidian 里的 Markdown 同步到 `source/_posts`：

```bash
./tools/publish_article.py "<你的 Markdown 路径>" --date 2026-03-01 --slug your-slug
```

例如：

```bash
./tools/publish_article.py "~/Library/Mobile Documents/iCloud~md~obsidian/Documents/lkc/Openclaws/openclaw-templates-comparison-tech-memo.md" --date 2026-03-01 --slug openclaw-agent-architecture-tech-memo
```

脚本会自动完成：

- 提取文章标题
- 写入 `source/_posts/<slug>.md`
- 保留正文原始标题结构
- 同步 Markdown 中引用的本地图片
- 把图片复制到 `source/uploads/<slug>/`
- 把图片链接改写为站点路径

同步后重新生成：

```bash
npx hexo generate
```

## 目录结构

- `source/_posts/`: 文章源码
- `source/uploads/`: 文章图片资源
- `themes/evan/`: 当前自定义主题
- `tools/publish_article.py`: 发布脚本
- `.github/workflows/deploy.yml`: GitHub Pages 自动部署

## 部署

推送到 `master` 后，GitHub Actions 会自动：

1. 安装依赖
2. 执行 `hexo generate`
3. 部署到 GitHub Pages

## 常用命令

```bash
npx hexo clean
npx hexo generate
npx hexo server
```
