window.updateBackendPushStatus = async function() {
    const statusEl = document.getElementById('backend-push-status'); const toggleEl = document.getElementById('cfg-backend-push'); if (!statusEl || !toggleEl) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { statusEl.textContent = '⚠️ 当前浏览器不支持后台推送'; toggleEl.checked = false; toggleEl.disabled = true; return; }
    try {
        const registration = await navigator.serviceWorker.ready; const subscription = await registration.pushManager.getSubscription();
        if (subscription) { const t = P().texts || DEFAULT_TEXTS_DAILY; const mName = getPureName(t.masterName) || '先生'; const dName = getPureName(t.doggyName) || '宝宝'; let displayId = identity === 'master' ? mName : (identity === 'doggy' ? dName : '联合身份'); statusEl.textContent = `✅ 当前设备已绑定后台推送（身份: ${displayId}）`; toggleEl.checked = true; }
        else { statusEl.textContent = 'ℹ️ 当前设备尚未绑定后台推送'; toggleEl.checked = false; }
    } catch (e) { statusEl.textContent = '⚠️ 检查状态失败：' + e.message; toggleEl.checked = false; }
};
window.handleBackendPushToggle = async function() { const toggleEl = document.getElementById('cfg-backend-push'); if (toggleEl.checked) await subscribeToPush(); else await unsubscribeFromPush(); };
window.subscribeToPush = async function () {
    showBar('push', 'connect', 20);
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { hideBar('push'); showToast('当前浏览器不支持 Web Push', 'late'); return document.getElementById('cfg-backend-push').checked = false; }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { hideBar('push'); showToast('通知权限被拒绝，无法接收后台提醒', 'late'); return document.getElementById('cfg-backend-push').checked = false; }
    try {
        updateBar('push', getProgressText('auth') || '正在请求授权...', 50);
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array('BCFx4JLqFVNZ2MExV8ZX5IKI1NvwWRsRp-Ennufze3bCXDdfKWicy6MiMAIcBpFcDurOOjvLFU3RlkHGkMzoLIg') });
        updateBar('push', getProgressText('sync') || '正在同步云端...', 80);
        const t = P().texts || DEFAULT_TEXTS_DAILY; let customIdentity = identity || 'both'; if (identity === 'master') customIdentity = getPureName(t.masterName) || '主人'; if (identity === 'doggy') customIdentity = getPureName(t.doggyName) || '小狗';
        const res = await fetch('https://push-subscribe.luo029.workers.dev/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: 'doggy', subscription: subscription.toJSON(), identity: customIdentity }) });
        if (res.ok) { updateBar('push', getProgressText('success') || '✅ 订阅成功！', 100); showToast('✅ 系统通知已开启', 'success'); setTimeout(() => hideBar('push'), 1000); updateBackendPushStatus(); }
        else { hideBar('push'); showToast('保存失败，请重试', 'late'); document.getElementById('cfg-backend-push').checked = false; }
    } catch (e) { hideBar('push'); showToast('订阅发生错误：' + e.message, 'late'); document.getElementById('cfg-backend-push').checked = false; }
};
window.unsubscribeFromPush = async function () {
    showBar('push', 'cancel', 20);
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { hideBar('push'); return showToast('不支持 Web Push', 'late'); }
    try {
        const registration = await navigator.serviceWorker.ready; const subscription = await registration.pushManager.getSubscription();
        if (!subscription) { hideBar('push'); updateBackendPushStatus(); return showToast('当前未开启后台推送', 'late'); }
        const endpoint = subscription.endpoint; await subscription.unsubscribe();
        updateBar('push', getProgressText('sync') || '正在清理云端...', 60);
        const res = await fetch('https://push-subscribe.luo029.workers.dev/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: 'doggy', action: 'unsubscribe', endpoint: endpoint }) });
        if (res.ok) { updateBar('push', getProgressText('success') || '🚫 已取消', 100); showToast('🚫 已取消推送', 'success'); setTimeout(() => hideBar('push'), 1000); }
        else { hideBar('push'); showToast('本地已取消，云端清理失败', 'late'); }
        updateBackendPushStatus();
    } catch (e) { hideBar('push'); showToast('取消失败：' + e.message, 'late'); updateBackendPushStatus(); }
};
function urlBase64ToUint8Array(base64String) { const padding = '='.repeat((4 - (base64String.length % 4)) % 4); const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/'); const rawData = atob(base64); return new Uint8Array([...rawData].map(char => char.charCodeAt(0))); }