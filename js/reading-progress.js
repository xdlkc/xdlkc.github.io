// reading-progress.js
(function() {
  const bar = document.createElement('div');
  bar.id = 'reading-progress-bar';
  bar.style.position = 'fixed';
  bar.style.top = '0';
  bar.style.left = '0';
  bar.style.height = '3px';
  bar.style.backgroundColor = '#007bff';
  bar.style.zIndex = '9999';
  bar.style.transition = 'width 0.1s ease';
  bar.style.width = '0%';
  document.body.appendChild(bar);

  let isTicking = false;
  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const scrolled = window.scrollY;
          const progress = (scrolled / docHeight) * 100;
          bar.style.width = Math.min(progress, 100) + '%';
        }
        isTicking = false;
      });
      isTicking = true;
    }
  });
})();
