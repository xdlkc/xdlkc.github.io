const fs = require('fs');
const path = require('path');

describe('TOC Feature', () => {
  it('should have toc helper or container in post layout', () => {
    // Look into the theme layout files or generated HTML
    const layoutPath = path.join(__dirname, '../themes/landscape/layout/post.ejs');
    if (fs.existsSync(layoutPath)) {
      const content = fs.readFileSync(layoutPath, 'utf-8');
      expect(content).toMatch(/toc\(/);
    } else {
      console.warn('post.ejs not found, skipping precise check');
    }
  });
});
