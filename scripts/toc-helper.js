// Basic Hexo TOC helper override or injection if needed
// Assuming theme supports it, or injecting into layout
hexo.extend.filter.register('after_post_render', function(data){
  if(data.content.includes('<h2')){
    data.content = '<!-- TOC_GENERATED -->\n' + data.content;
  }
  return data;
});
