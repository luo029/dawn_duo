// ==========================================
// 🚀 版本更新控制器 (每次发版记得改版本号)
// ==========================================
const APP_VERSION = '1.0.0'; 
const STORED_VERSION = localStorage.getItem('dawn_app_version');

if (STORED_VERSION && STORED_VERSION !== APP_VERSION) {
    // 发现版本不一致，清理缓存并强制刷新
    localStorage.setItem('dawn_app_version', APP_VERSION);
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let reg of registrations) { reg.unregister(); }
        });
    }
    
    if (window.caches) {
        caches.keys().then(names => {
            for (let name of names) { caches.delete(name); }
        });
    }
    
    // 强行刷新页面，绕过缓存
    window.location.reload(true);
} else if (!STORED_VERSION) {
    localStorage.setItem('dawn_app_version', APP_VERSION);
}
// ==========================================

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