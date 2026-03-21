function initRewardToggle() {
  const container = document.getElementById('reward-container');
  if (!container) return;

  const btn = container.querySelector('[data-reward-toggle]');
  const qr = container.querySelector('.reward-qr-codes');
  if (!btn || !qr) return;

  btn.addEventListener('click', () => {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isExpanded));
    qr.setAttribute('aria-hidden', String(isExpanded));
    
    if (!isExpanded) {
      qr.classList.add('is-expanded');
      qr.style.display = 'block';
    } else {
      qr.classList.remove('is-expanded');
      qr.style.display = 'none';
    }
  });
}

// Auto-init if in browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initRewardToggle);
}

// Export for tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initRewardToggle };
}
