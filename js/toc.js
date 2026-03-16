function generateTOC(headers) {
  if (!headers || headers.length === 0) return '';
  let html = '<ul class="toc">';
  headers.forEach(h => html += `<li><a href="#${h}">${h}</a></li>`);
  html += '</ul>';
  return html;
}
module.exports = { generateTOC };
