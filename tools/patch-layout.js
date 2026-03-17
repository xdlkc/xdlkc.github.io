const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../themes/evan/layout/layout.ejs');
let code = fs.readFileSync(file, 'utf8');
const injection = `<div id="reading-progress-bar" style="position: fixed; top: 0; left: 0; height: 3px; background: #007bff; width: 0%; z-index: 9999; transition: width 0.1s;"></div>
<script>
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (scrollHeight > 0) {
      const progress = (scrollTop / scrollHeight) * 100;
      const bar = document.getElementById('reading-progress-bar');
      if (bar) bar.style.width = progress + '%';
    }
  });
</script>`;
if (!code.includes('reading-progress-bar')) {
  code = code.replace('<body>', '<body>\n    ' + injection);
  fs.writeFileSync(file, code);
}
