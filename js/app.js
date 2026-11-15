window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = document.documentElement.getAttribute('data-theme');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
});
applyConfigsToPage(); updateModeCards(); render(); initIdentity(); updateNotifyStatus(); 
// 优化：仅在页面可见时更新时钟，切后台时停止运算，大幅降低手机耗电
setInterval(() => { if (!document.hidden) updateClocks(); }, 1000); 
updateClocks();
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(() => {}); }