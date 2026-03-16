/**
 * 阅读进度条模块
 * 在文章页顶部显示阅读进度，随滚动实时更新
 */

window.ReadingProgress = {
  progressElement: null,
  progressBarElement: null,

  /**
   * 初始化阅读进度条
   * 只在文章页（/YYYY/MM/DD/路径）启用
   */
  initReadingProgress() {
    // 只在文章页初始化
    if (!this.isPostPage()) {
      return;
    }

    this.progressElement = document.querySelector('.reading-progress');
    this.progressBarElement = document.querySelector('.reading-progress-bar');

    if (!this.progressElement || !this.progressBarElement) {
      return;
    }

    // 使用 requestAnimationFrame 优化滚动事件
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // 初始更新
    this.updateProgress();
  },

  /**
   * 更新进度条
   * 根据当前滚动位置计算并更新进度
   */
  updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight <= clientHeight) {
      this.setProgress(0);
      return;
    }

    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    this.setProgress(Math.min(100, Math.max(0, progress)));
  },

  /**
   * 设置进度条值
   * @param {number} value - 进度值（0-100）
   */
  setProgress(value) {
    if (this.progressBarElement) {
      // 使用 transform 优化性能，触发 GPU 加速
      this.progressBarElement.style.transform = `scaleX(${value / 100})`;
      this.progressElement.setAttribute('aria-valuenow', Math.round(value));
    }
  },

  /**
   * 检查当前页面是否是文章页
   * 文章页路径格式：/YYYY/MM/DD/...
   * @returns {boolean}
   */
  isPostPage() {
    const path = window.location.pathname;
    return /^\/\d{4}\/\d{2}\/\d{2}\//.test(path);
  }
};

// 自动初始化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ReadingProgress.initReadingProgress();
  });
}
