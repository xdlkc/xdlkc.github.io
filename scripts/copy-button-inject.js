hexo.extend.filter.register('after_render:html', function(html, data) {
    if (html.includes('</head>')) {
        return html.replace('</head>', '<script defer src="/js/copy-button.js"></script></head>');
    }
    return html;
});
