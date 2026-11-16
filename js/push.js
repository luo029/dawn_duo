window.updateBackendPushStatus = async function() {
    const statusEl = document.getElementById('backend-push-status'); const toggleEl = document.getElementById('cfg-backend-push'); if (!statusEl || !toggleEl) return;
    const muteEl = document.getElementById('cfg-device-mute');
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { statusEl.textContent = '⚠️ 当前浏览器不支持后台推送'; toggleEl.checked = false; toggleEl.disabled = true; if (muteEl) muteEl.disabled = true; return; }
    
    try {
        const registration = await navigator.serviceWorker.ready; const subscription = await registration.pushManager.getSubscription();
        if (subscription) { 
            const t = P().texts || DEFAULT_TEXTS_DAILY; const mName = getPureName(t.masterName) || '先生'; const dName = getPureName(t.doggyName) || '宝宝'; 
            let displayId = identity === 'master' ? mName : (identity === 'doggy' ? dName : '联合身份'); 
            
            let authInfo = '';
            try { 
                const localAuth = JSON.parse(localStorage.getItem('dawn-duo-push-auth') || '{}'); 
                if (localAuth.endpoint === subscription.endpoint) { 
                    authInfo = `<br><span style="font-size:0.65rem;color:var(--text-muted);font-weight:normal;">授权设备: ${localAuth.device || '未知'} | 授权时间: ${localAuth.time || '未知'}</span>`; 
                } 
            } catch(e){}
            statusEl.innerHTML = `✅ 已绑定推送 (身份: ${displayId})${authInfo}`; 
            toggleEl.checked = true; 
            if (muteEl) muteEl.disabled = false;

            try {
                const res = await fetchGHFile('subscriptions.json');
                if (res) {
                    const subs = JSON.parse(res.content);
                    const target = subs.find(s => s.endpoint === subscription.endpoint);
                    const isMuted = target && target.muted === true;
                    if (muteEl) muteEl.checked = isMuted;
                    if (window.handleDeviceMuteUI) window.handleDeviceMuteUI(isMuted);
                }
            } catch (e) { console.warn('拉取静音状态失败', e); }

        }
        else { statusEl.textContent = 'ℹ️ 当前设备尚未绑定后台推送'; toggleEl.checked = false; if (muteEl) { muteEl.checked = false; muteEl.disabled = true; } if (window.handleDeviceMuteUI) window.handleDeviceMuteUI(false); }
    } catch (e) { statusEl.textContent = '⚠️ 检查状态失败：' + e.message; toggleEl.checked = false; if (muteEl) { muteEl.checked = false; muteEl.disabled = true; } if (window.handleDeviceMuteUI) window.handleDeviceMuteUI(false); }
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
        
        const device = getDeviceInfo();
        const authTime = new Date().toLocaleString();
        
        const res = await fetch('https://push-subscribe.luo029.workers.dev/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: 'doggy', subscription: subscription.toJSON(), identity: identity || 'both', device, authTime }) });
        
        if (res.ok) { 
            try {
                const fileRes = await fetchGHFile('subscriptions.json');
                if (fileRes) {
                    const subs = JSON.parse(fileRes.content);
                    const target = subs.find(s => s.endpoint === subscription.endpoint);
                    if (target && (!target.device || target.device !== device)) {
                        target.device = device;
                        target.authTime = authTime;
                        await pushGHFile('subscriptions.json', JSON.stringify(subs, null, 2), fileRes.sha);
                    }
                }
            } catch(e) { console.warn('补全云端设备信息失败', e); }

            updateBar('push', getProgressText('success') || '✅ 订阅成功！', 100); 
            showToast('✅ 系统通知已开启', 'success'); 
            localStorage.setItem('dawn-duo-push-auth', JSON.stringify({ endpoint: subscription.endpoint, device, time: authTime }));
            setTimeout(() => hideBar('push'), 1000); 
            updateBackendPushStatus(); 
        }
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
        localStorage.removeItem('dawn-duo-push-auth');
        updateBar('push', getProgressText('sync') || '正在清理云端...', 60);
        const res = await fetch('https://push-subscribe.luo029.workers.dev/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: 'doggy', action: 'unsubscribe', endpoint: endpoint }) });
        if (res.ok) { updateBar('push', getProgressText('success') || '🚫 已取消', 100); showToast('🚫 已取消推送', 'success'); setTimeout(() => hideBar('push'), 1000); }
        else { hideBar('push'); showToast('本地已取消，云端清理失败', 'late'); }
        updateBackendPushStatus();
    } catch (e) { hideBar('push'); showToast('取消失败：' + e.message, 'late'); updateBackendPushStatus(); }
};
window.toggleDeviceMute = async function(isMuted) {
    const muteEl = document.getElementById('cfg-device-mute');
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) { if (muteEl) muteEl.checked = false; return showToast('当前未绑定推送', 'late'); }
        
        showToast('正在同步云端静音状态...', 'success');
        const endpoint = subscription.endpoint;
        
        const fileRes = await fetchGHFile('subscriptions.json');
        if (!fileRes) return;
        const subs = JSON.parse(fileRes.content);
        const target = subs.find(s => s.endpoint === endpoint);
        if (target) {
            target.muted = isMuted;
            await pushGHFile('subscriptions.json', JSON.stringify(subs, null, 2), fileRes.sha);
            showToast(isMuted ? '🔕 本设备已静音' : '🔔 本设备已恢复接收', 'success');
            if (window.handleDeviceMuteUI) window.handleDeviceMuteUI(isMuted);
        } else {
            showToast('云端找不到该设备记录，请重新授权', 'late');
            if (muteEl) muteEl.checked = !isMuted;
        }
    } catch(e) {
        console.warn('更新静音状态失败', e);
        showToast('更新静音状态失败', 'late');
        if (muteEl) muteEl.checked = !isMuted;
    }
};
function urlBase64ToUint8Array(base64String) { const padding = '='.repeat((4 - (base64String.length % 4)) % 4); const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/'); const rawData = atob(base64); return new Uint8Array([...rawData].map(char => char.charCodeAt(0))); }

// ================= 新增：真实后台测试逻辑 =================

window.isPWAStandalone = function() {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ('standalone' in window.navigator && window.navigator.standalone === true) return true;
  return false;
};

window.triggerBackgroundTest = async function() {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先配置 GitHub Token', 'late');
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return showToast('当前浏览器不支持后台推送', 'late');
    
    // 1. 检测 PWA
    const isPWA = window.isPWAStandalone();
    if (!isPWA) {
        return window.showCustomConfirm('⚠️ 非 PWA 独立模式', '检测到您当前在浏览器标签页中运行。<br><br>iOS 仅在将网页添加到主屏幕并以独立 App 启动时，才允许接收后台推送。<br><br>确定仍要强行测试吗？', () => {
            startCountdownTest();
        });
    } else {
        startCountdownTest();
    }
};

async function startCountdownTest() {
    // 2. 检查订阅
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return showToast('未开启后台推送，请先在上方打开开关', 'late');
    
    // 获取当前设备最后20位（用于定向测试）
    const targetSuffix = subscription.endpoint.slice(-20);
    
    let count = 5;
    showToast(`🚀 将在 ${count} 秒后发送...请立即切出页面！`, 'success');
    
    const timer = setInterval(async () => {
        count--;
        if (count > 0) {
            showToast(`🚀 将在 ${count} 秒后发送...请立即锁屏或切到后台！`, 'success');
        } else {
            clearInterval(timer);
            
            // 倒计时结束，触发云端
            try {
                const title = '📡 云端后台测试';
                const body = '如果你在切出页面后看到了这条通知，说明你的 iOS 后台推送是正常的！';
                
                const res = await ghFetch(`/repos/${ghConfig.user}/${ghConfig.repo}/actions/workflows/push.yml/dispatches`, { 
                    method: 'POST', 
                    headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ 
                        ref: 'main', 
                        inputs: { 
                            test_mode: 'true',
                            custom_title: title,
                            custom_body: body,
                            test_target: targetSuffix
                        } 
                    }) 
                }); 
                if (res.ok) {
                    // 注意：因为用户此时可能已经切出页面，Toast 用户可能看不到，但发出去就行了。
                    console.log('后台测试已触发');
                } else {
                    console.warn('后台测试触发失败');
                }
            } catch(e) {
                console.error('请求出错', e);
            }
        }
    }, 1000);
}