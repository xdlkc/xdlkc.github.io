/**
 * 测试：打印样式优化（Print-Friendly Styles）
 *
 * 验证 print.css 文件存在且被正确引入
 * 验证打印样式正确隐藏/显示元素
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

test('print.css 文件存在', () => {
  const printCssPath = path.join(__dirname, '../themes/evan/source/css/print.css');
  assert.ok(fs.existsSync(printCssPath), 'print.css 应该存在');
});

test('print.css 包含 @media print 规则', () => {
  const printCssPath = path.join(__dirname, '../themes/evan/source/css/print.css');

  if (!fs.existsSync(printCssPath)) {
    // 文件不存在时跳过测试
    return;
  }

  const cssContent = fs.readFileSync(printCssPath, 'utf-8');
  assert.ok(cssContent.includes('@media print'), '应该包含 @media print 规则');
});

test('print.css 隐藏导航栏', () => {
  const printCssPath = path.join(__dirname, '../themes/evan/source/css/print.css');

  if (!fs.existsSync(printCssPath)) {
    return;
  }

  const cssContent = fs.readFileSync(printCssPath, 'utf-8');
  assert.ok(cssContent.includes('.article-nav'), '应该包含 .article-nav 选择器');
  assert.ok(cssContent.includes('display: none') || cssContent.includes('visibility: hidden'), '应该隐藏元素');
});

test('print.css 隐藏交互按钮', () => {
  const printCssPath = path.join(__dirname, '../themes/evan/source/css/print.css');

  if (!fs.existsSync(printCssPath)) {
    return;
  }

  const cssContent = fs.readFileSync(printCssPath, 'utf-8');
  const buttons = [
    '.back-to-top',
    '.article-share',
    '.article-link-copy',
    '.post-like',
    '.theme-toggle',
    '.font-size-toggle'
  ];

  buttons.forEach(selector => {
    assert.ok(cssContent.includes(selector), `应该包含 ${selector} 选择器`);
  });
});

test('print.css 隐藏 TOC 和相关文章', () => {
  const printCssPath = path.join(__dirname, '../themes/evan/source/css/print.css');

  if (!fs.existsSync(printCssPath)) {
    return;
  }

  const cssContent = fs.readFileSync(printCssPath, 'utf-8');
  const elements = ['.toc-card', '.toc-mobile', '.related-posts'];

  elements.forEach(selector => {
    assert.ok(cssContent.includes(selector), `应该包含 ${selector} 选择器`);
  });
});

test('print.css 包含打印元数据样式', () => {
  const printCssPath = path.join(__dirname, '../themes/evan/source/css/print.css');

  if (!fs.existsSync(printCssPath)) {
    return;
  }

  const cssContent = fs.readFileSync(printCssPath, 'utf-8');
  assert.ok(cssContent.includes('.print-meta'), '应该包含 .print-meta 选择器');
});

test('print.css 移除背景色', () => {
  const printCssPath = path.join(__dirname, '../themes/evan/source/css/print.css');

  if (!fs.existsSync(printCssPath)) {
    return;
  }

  const cssContent = fs.readFileSync(printCssPath, 'utf-8');
  // 检查是否设置了白色或透明背景
  assert.ok(
    cssContent.includes('background: none') ||
    cssContent.includes('background: transparent') ||
    cssContent.includes('background: white'),
    '应该移除背景色'
  );
});

test('print.css 使用黑色文字', () => {
  const printCssPath = path.join(__dirname, '../themes/evan/source/css/print.css');

  if (!fs.existsSync(printCssPath)) {
    return;
  }

  const cssContent = fs.readFileSync(printCssPath, 'utf-8');
  // 检查是否设置了黑色或深灰色文字
  assert.ok(
    cssContent.includes('color: #000') ||
    cssContent.includes('color: black') ||
    cssContent.includes('color: #111') ||
    cssContent.includes('color: #222'),
    '应该使用黑色文字'
  );
});
