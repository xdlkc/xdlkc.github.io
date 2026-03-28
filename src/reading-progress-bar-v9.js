document.addEventListener('DOMContentLoaded', () => {
  const bar = document.createElement('div');
  bar.className = 'progress-bar-v9';
  bar.style.position = 'fixed';
  bar.style.top = '0';
  bar.style.left = '0';
  bar.style.height = '4px';
  bar.style.backgroundColor = '#007bff';
  bar.style.zIndex = '9999';
  bar.style.width = '0%';
  document.body.appendChild(bar);

  const updateProgress = () => {
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;
    
    const maxScroll = scrollHeight - clientHeight;
    let percentage = 0;
    
    if (maxScroll > 0) {
      percentage = (scrollY / maxScroll) * 100;
    }
    
    // clamp between 0 and 100
    percentage = Math.max(0, Math.min(100, percentage));
    bar.style.width = percentage + '%';
  };

  window.addEventListener('scroll', updateProgress);
  // initial call
  updateProgress();
});
