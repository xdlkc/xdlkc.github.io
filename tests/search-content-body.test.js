const test = require('node:test');
const assert = require('node:assert/strict');

const { scorePost, makeSnippet } = require('../themes/evan/source/js/site-search.js');

function normalizePost(raw) {
  if (!raw) return null;

  const title = typeof raw.title === 'string' ? raw.title : '';
  const path = typeof raw.path === 'string' ? raw.path : '';

  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : (Array.isArray(raw.tag) ? raw.tag : []);

  const categories = Array.isArray(raw.categories)
    ? raw.categories
    : (Array.isArray(raw.category) ? raw.category
      : (typeof raw.category === 'string' ? [raw.category]
        : (typeof raw.categories === 'string' ? [raw.categories] : [])));

  const date = raw.date ? String(raw.date).slice(0, 10) : '';

  const excerpt = typeof raw.excerpt === 'string' ? raw.excerpt : '';
  const content = typeof raw.content === 'string' ? raw.content : '';
  const rawText = typeof raw.raw === 'string' ? raw.raw : '';

  return {
    title,
    path,
    tags: tags.filter((t) => typeof t === 'string'),
    categories: categories.filter((c) => typeof c === 'string'),
    date,
    excerpt,
    content,
    raw: rawText
  };
}

test('scorePost - 内容搜索应得2-4分（低于标题）', () => {
  const post = normalizePost({
    title: 'Hexo 入门指南',
    content: '本文介绍了 Hexo 静态博客生成器的基本概念和安装步骤，适合新手学习',
    tags: ['hexo', 'tutorial'],
    categories: ['技术']
  });

  const score = scorePost(post, ['静态', '博客']);
  assert.ok(score > 0, '内容匹配应该有分数');
  assert.ok(score < 5, '内容匹配分数应低于标题匹配的10分');
});

test('scorePost - 多个关键词在内容中应累加分数', () => {
  const post = normalizePost({
    title: 'Vue 3.0 新特性解析',
    content: 'Vue 3.0 引入了 Composition API、Teleport 组件和新的响应式系统，性能比 Vue 2.0 提升了40%',
    tags: ['vue'],
    categories: ['前端']
  });

  const score = scorePost(post, ['composition', 'teleport']);
  assert.ok(score >= 4, '多个内容匹配应该累加分数');
});

test('scorePost - 标题和内容都匹配时，标题应得更高分数', () => {
  const post = normalizePost({
    title: 'React Hooks 最佳实践',
    content: 'React Hooks 是 React 16.8 引入的新特性，本文介绍最佳实践',
    tags: ['react'],
    categories: ['前端']
  });

  const titleScore = scorePost(post, ['react']);
  const contentScore = scorePost(post, ['特性', '实践']);
  assert.ok(titleScore > contentScore, '标题匹配分数应高于内容匹配分数');
});

test('scorePost - 无内容匹配时得0分', () => {
  const post = normalizePost({
    title: 'Python 数据分析入门',
    content: '本文介绍 Python 在数据科学中的应用',
    tags: ['python'],
    categories: ['数据科学']
  });

  const score = scorePost(post, ['机器学习', '深度学习']);
  assert.equal(score, 0, '无匹配时应得0分');
});

test('scorePost - 内容和摘要都应被搜索', () => {
  const post = normalizePost({
    title: 'Docker 容器化部署',
    excerpt: '使用 Docker 容器化应用部署，提高环境一致性',
    content: 'Docker 通过容器化技术实现应用隔离和快速部署',
    tags: ['docker'],
    categories: ['运维']
  });

  const excerptScore = scorePost(post, ['环境', '一致性']);
  const contentScore = scorePost(post, ['容器', '隔离']);
  assert.ok(excerptScore > 0, '摘要应能被搜索');
  assert.ok(contentScore > 0, '内容应能被搜索');
});

test('makeSnippet - 应从内容中提取匹配的片段', () => {
  const post = normalizePost({
    title: 'TypeScript 类型系统详解',
    content: 'TypeScript 的类型系统包括基本类型、联合类型、交叉类型和类型守卫等特性',
    excerpt: '深入理解 TS 类型系统'
  });

  const snippet = makeSnippet(post, '类型守卫');
  assert.ok(snippet.includes('类型守卫'), '片段应包含匹配的关键词');
  assert.ok(snippet.includes('类型系统'), '片段应包含上下文');
});

test('makeSnippet - 内容匹配优先于标题/摘要', () => {
  const post = normalizePost({
    title: 'JavaScript 异步编程',
    excerpt: '异步编程基础',
    content: 'JavaScript 中的 Promise、async/await 是处理异步操作的核心机制'
  });

  const snippet = makeSnippet(post, 'Promise');
  assert.ok(snippet.includes('Promise'), '片段应包含匹配内容');
  assert.ok(snippet.length > 0, '片段不应为空');
});
