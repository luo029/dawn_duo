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