const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  // 访问博客文章
  await page.goto('http://localhost:4000/2026/03/19/agent-skill-design-patterns/');

  // 等待页面加载
  await page.waitForLoadState('networkidle');

  // 检查 CSS 文件
  const cssInfo = await page.evaluate(() => {
    const cssFiles = Array.from(document.styleSheets).map(sheet => sheet.href);
    const hasResponsiveFixes = cssFiles.some(href => href && href.includes('responsive-fixes.css'));
    const hasStyle = cssFiles.some(href => href && href.includes('style.css'));
    return { cssFiles, hasResponsiveFixes, hasStyle };
  });

  console.log('\n=== CSS Files Info ===');
  console.log('CSS loaded:', cssInfo.cssFiles.length, 'files');
  console.log('responsive-fixes.css loaded:', cssInfo.hasResponsiveFixes);
  console.log('style.css loaded:', cssInfo.hasStyle);

  // 检查图片元素
  const imagesInfo = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('.article-content img'));
    return images.map((img, index) => {
      const computedStyle = window.getComputedStyle(img);
      return {
        index,
        src: img.src.substring(0, 80),
        naturalWidth: img.naturalWidth,
        computedMaxWidth: computedStyle.maxWidth,
        computedWidth: computedStyle.width,
        computedDisplay: computedStyle.display,
        overflow: computedStyle.overflow
      };
    });
  });

  console.log('\n=== Images Info ===');
  console.log('Images found:', imagesInfo.length);
  imagesInfo.forEach(img => {
    console.log(`Image ${img.index}:`);
    console.log(`  src: ${img.src}...`);
    console.log(`  naturalWidth: ${img.naturalWidth}`);
    console.log(`  computedMaxWidth: ${img.computedMaxWidth}`);
    console.log(`  computedWidth: ${img.computedWidth}`);
    console.log('');
  });

  // 检查代码块
  const codeBlocksInfo = await page.evaluate(() => {
    const codeBlocks = Array.from(document.querySelectorAll('.article-content pre'));
    return codeBlocks.map((block, index) => {
      const computedStyle = window.getComputedStyle(block);
      const codeElement = block.querySelector('code');
      return {
        index,
        computedMaxWidth: computedStyle.maxWidth,
        computedOverflowX: computedStyle.overflowX,
        computedWidth: computedStyle.width,
        computedWhiteSpace: computedStyle.whiteSpace,
        textLength: codeElement ? codeElement.textContent.length : 0
      };
    });
  });

  console.log('\n=== Code Blocks Info ===');
  console.log('Code blocks found:', codeBlocksInfo.length);
  codeBlocksInfo.forEach(block => {
    console.log(`Code block ${block.index}:`);
    console.log(`  computedMaxWidth: ${block.computedMaxWidth}`);
    console.log(`  computedOverflowX: ${block.computedOverflowX}`);
    console.log(`  computedWidth: ${block.computedWidth}`);
    console.log(`  computedWhiteSpace: ${block.computedWhiteSpace}`);
    console.log(`  textLength: ${block.textLength}`);
    console.log('');
  });

  // 检查行内代码
  const inlineCodesInfo = await page.evaluate(() => {
    const inlineCodes = Array.from(document.querySelectorAll('.article-content :not(pre) > code'));
    return inlineCodes.slice(0, 5).map((code, index) => {
      const computedStyle = window.getComputedStyle(code);
      return {
        index,
        text: code.textContent.substring(0, 50),
        computedWordBreak: computedStyle.wordBreak,
        computedOverflowWrap: computedStyle.overflowWrap,
        computedWhiteSpace: computedStyle.whiteSpace
      };
    });
  });

  console.log('\n=== Inline Codes Info ===');
  console.log('Inline codes found (showing first 5):', inlineCodesInfo.length);
  inlineCodesInfo.forEach(code => {
    console.log(`Inline code ${code.index}:`);
    console.log(`  text: ${code.text}...`);
    console.log(`  computedWordBreak: ${code.computedWordBreak}`);
    console.log(`  computedOverflowWrap: ${code.computedOverflowWrap}`);
    console.log(`  computedWhiteSpace: ${code.computedWhiteSpace}`);
    console.log('');
  });

  // 截图
  console.log('\nTaking full page screenshot...');
  await page.screenshot({ path: '/tmp/mobile-screenshot.png', fullPage: true });
  console.log('Screenshot saved to /tmp/mobile-screenshot.png');

  // 检查 viewport
  const viewportInfo = await page.evaluate(() => {
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight
    };
  });

  console.log('\n=== Viewport Info ===');
  console.log('viewportWidth:', viewportInfo.viewportWidth);
  console.log('viewportHeight:', viewportInfo.viewportHeight);
  console.log('documentWidth:', viewportInfo.documentWidth);
  console.log('documentHeight:', viewportInfo.documentHeight);

  // 检查是否有水平滚动
  const hasHorizontalScroll = viewportInfo.documentWidth > viewportInfo.viewportWidth;
  console.log('\nHas horizontal scroll:', hasHorizontalScroll);

  await browser.close();
})();
