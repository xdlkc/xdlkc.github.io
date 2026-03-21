function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

if (typeof window !== 'undefined') {
    window.initTheme = initTheme;
    window.toggleTheme = toggleTheme;
    // We cannot use DOMContentLoaded in Jest without dispatching, so handle safely
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', initTheme);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initTheme, toggleTheme };
}
