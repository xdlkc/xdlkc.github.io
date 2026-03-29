function generateRss(items) {
  return items.map(item => `
    <item>
      <title>${item.title}</title>
      <author>${item.author || 'Unknown'}</author>
      <content:encoded><![CDATA[${item.content || ''}]]></content:encoded>
    </item>
  `).join('');
}
module.exports = generateRss;
