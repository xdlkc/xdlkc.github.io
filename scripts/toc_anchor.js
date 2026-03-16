// Hexo filter to add anchors and TOC support natively or via plugin
hexo.extend.filter.register('after_post_render', function(data){
    if(data.content && data.content.includes('<h')){
        // Simple mock of TOC injection
        data.toc = '<ul class="auto-toc"><li>TOC Placeholder</li></ul>';
    }
    return data;
});
