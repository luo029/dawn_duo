window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = document.documentElement.getAttribute('data-theme');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
});
applyConfigsToPage(); updateModeCards(); render(); initIdentity(); updateNotifyStatus();

// 性能优化：抛弃 setInterval，改用 requestAnimationFrame 驱动时钟，避免滚动时阻塞主线程
let lastClockTick = 0;
function clockLoop(timestamp) {
  // 确保每秒只更新一次，且完全贴合屏幕刷新率
  if (!lastClockTick || timestamp - lastClockTick >= 1000) {
    lastClockTick = timestamp;
    updateClocks();
  }
  requestAnimationFrame(clockLoop);
}
requestAnimationFrame(clockLoop);
updateClocks();

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(() => {}); }