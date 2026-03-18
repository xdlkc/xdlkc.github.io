module.exports = function(hexo) {
    if (!hexo.extend || !hexo.extend.filter) return;
    
    hexo.extend.filter.register('after_post_render', function(data) {
        if (data.layout !== 'post') return data;
        
        // Use the hexo util toc generator
        const tocObj = require('hexo-util').tocObj;
        const tocHelper = require('hexo-util').toc;
        
        let tocContent = '';
        if (tocObj) {
            tocContent = require('hexo-util').tocObj(data.content);
            if (typeof tocContent !== 'string') tocContent = JSON.stringify(tocContent);
        } else if (tocHelper) {
            tocContent = tocHelper(data.content);
        } else {
            // Hexo 7 uses native helper
            const toc = hexo.extend.helper.get('toc').bind(this);
            tocContent = toc(data.content, { list_number: false });
        }
        
        if (tocContent && tocContent.length > 0) {
            data.content = '<div class="post-toc">' + tocContent + '</div>\n' + data.content;
        }
        
        return data;
    });
};
