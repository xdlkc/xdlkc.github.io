const test = require('node:test');
const assert = require('node:assert');
const Hexo = require('hexo');
const path = require('path');

test('TOC Injection Filter', async (t) => {
    const hexo = new Hexo(path.join(__dirname, '..'), { silent: true });
    await hexo.init();
    
    // Load the filter
    require('../scripts/toc-filter.js')(hexo);

    const data = {
        layout: 'post',
        content: '<h2 id="Heading-1"><a href="#Heading-1" class="headerlink" title="Heading 1"></a>Heading 1</h2><p>Content</p>'
    };

    const result = await hexo.extend.filter.exec('after_post_render', data, { context: hexo });
    
    assert.ok(result.content.includes('class="post-toc"'), 'TOC container should be injected');
    assert.ok(result.content.includes('Heading 1'), 'TOC should contain heading text');
});
