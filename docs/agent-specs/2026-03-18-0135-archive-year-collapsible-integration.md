# Spec: 归档年份折叠功能布局集成

- Date: 2026-03-18 01:35 (Asia/Shanghai)
- Slug: archive-year-collapsible-integration

## 背景 / 问题
归档年份折叠功能的 JavaScript 代码已经实现（`themes/evan/source/js/archive-year-collapsible.js`），测试也已编写（`tests/archive-year-collapsible.test.js`），但尚未集成到归档页面的布局中。

当前状态：
- `themes/evan/source/js/archive-year-collapsible.js` 已存在
- `tests/archive-year-collapsible.test.js` 已存在
- `themes/evan/layout/archive.ejs` 未引入 JS 文件
- `themes/evan/layout/archive.ejs` 未添加必要的 HTML 结构

## 需求
将归档年份折叠功能完全集成到归档页面：

### R1. HTML 结构调整
在 `themes/evan/layout/archive.ejs` 中，将年份分组中的文章列表用 `.archive-items-list` div 包裹：

```ejs
<div class="archive-year">
  <h2><%= year %></h2>
  <div class="archive-items-list">  <!-- 新增这行 -->
    <% grouped[year].forEach((post) => { %>
      <article class="archive-item">
        <time datetime="<%= date_xml(post.date) %>"><%= date(post.date, 'MM-DD') %></time>
        <a href="<%- url_for(post.path) %>"><%= post.title %></a>
      </article>
    <% }) %>
  </div>  <!-- 新增这行 -->
</div>
```

### R2. JS 文件引入
在 `themes/evan/layout/archive.ejs` 底部引入归档年份折叠 JS 文件：

```ejs
<script src="<%- url_for('/js/archive-year-collapsible.js') %>" defer></script>
```

### R3. 验证集成成功
- 折叠按钮正确显示在年份标题左侧
- 点击按钮可以切换折叠/展开状态
- 折叠状态可以持久化到 localStorage
- 刷新页面后可以恢复之前的折叠状态
- 现有的测试全部通过

## 验收标准
1. `themes/evan/layout/archive.ejs` 添加了 `.archive-items-list` 包裹层
2. `themes/evan/layout/archive.ejs` 引入了 `archive-year-collapsible.js`
3. `npm test` 中归档年份折叠相关测试全部通过
4. 手动测试：归档页面年份标题左侧显示折叠按钮（+/-）
5. 手动测试：点击按钮可以切换文章列表的显示/隐藏
6. 手动测试：折叠状态刷新页面后保持

## 边界 / 不做
- 不修改归档年份折叠的 JavaScript 逻辑
- 不修改归档年份折叠的测试
- 不添加其他新功能（如"全部折叠/全部展开"按钮）
- 不修改归档页面的其他样式和功能

## 技术细节

### 文件变更
- `themes/evan/layout/archive.ejs` - 添加 HTML 结构和 JS 引入

### 依赖
- `themes/evan/source/js/archive-year-collapsible.js` - 已存在
- `tests/archive-year-collapsible.test.js` - 已存在

### 风险
- 低风险：只修改布局文件，不涉及业务逻辑
- 现有测试应该继续通过
