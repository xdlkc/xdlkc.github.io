document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('figure.highlight').forEach(block => {
    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.innerText = 'Copy';
    btn.addEventListener('click', async () => {
      const code = block.querySelector('.code').innerText;
      await navigator.clipboard.writeText(code);
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = 'Copy', 2000);
    });
    block.appendChild(btn);
  });
});
