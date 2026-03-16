/* Print optimization style test.
 *
 * This test verifies that the style.css file contains
 * essential print-specific rules.
 */

const fs = require('fs');
const path = require('path');

const STYLE_CSS_PATH = path.join(__dirname, '../themes/evan/source/css/style.css');

function readStyleCss() {
  const content = fs.readFileSync(STYLE_CSS_PATH, 'utf8');
  return content;
}

describe('Print optimization styles', () => {
  it('should contain @media print block', () => {
    const css = readStyleCss();
    expect(css).toMatch(/@media\s+print/);
  });

  it('should hide navigation elements in print', () => {
    const css = readStyleCss();
    // Check for .article-nav display: none inside @media print
    const match = css.match(/@media\s+print\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const printBlock = match[1];
    expect(printBlock).toMatch(/\.article-nav[^}]*display:\s*none/);
  });

  it('should hide sidebar TOC in print', () => {
    const css = readStyleCss();
    const match = css.match(/@media\s+print\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const printBlock = match[1];
    expect(printBlock).toMatch(/\.toc-card[^}]*display:\s*none/);
  });

  it('should hide comments in print', () => {
    const css = readStyleCss();
    const match = css.match(/@media\s+print\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const printBlock = match[1];
    expect(printBlock).toMatch(/\.post-comments[^}]*display:\s*none/);
  });

  it('should set white background for article content in print', () => {
    const css = readStyleCss();
    const match = css.match(/@media\s+print\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const printBlock = match[1];
    expect(printBlock).toMatch(/\.article-content[^}]*background:\s*white|#fff/);
  });

  it('should set black text color for readability in print', () => {
    const css = readStyleCss();
    const match = css.match(/@media\s+print\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const printBlock = match[1];
    expect(printBlock).toMatch(/color:\s*black|#000/);
  });

  it('should handle links to show URL in print', () => {
    const css = readStyleCss();
    const match = css.match(/@media\s+print\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const printBlock = match[1];
    // Check for a::after or a[href]::after content rule
    expect(printBlock).toMatch(/a[^}]*::after[^}]*content/);
  });

  it('should handle images to fit page width in print', () => {
    const css = readStyleCss();
    const match = css.match(/@media\s+print\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const printBlock = match[1];
    expect(printBlock).toMatch(/img[^}]*max-width:\s*100%/);
  });
});
