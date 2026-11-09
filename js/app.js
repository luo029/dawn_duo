// 页面启动入口
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = document.documentElement.getAttribute('data-theme');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
});

applyConfigsToPage();
updateModeCards();
render();
initIdentity();
updateNotifyStatus();
setInterval(updateClocks, 1000);
updateClocks();

// 注册 Service Worker (为了 PWA 完美支持，如果本地有 sw.js 会自动注册)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // 如果没有 sw.js 静默失败，不影响主体功能
  });
}