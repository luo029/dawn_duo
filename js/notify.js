let lastNotifyCheck = 0;
function notificationSupported() { return typeof Notification !== 'undefined'; }
function sendNotify(key, title, body) { try { const n = new Notification(title, { body: body, tag: 'dawn-' + key, requireInteraction: true, silent: false }); setTimeout(() => { try { n.close(); } catch (e) {} }, 15000); } catch (e) { console.warn('通知发送失败', e); } }
function saveNotifyLog() { try { localStorage.setItem('dawn-duo-notify-log', JSON.stringify(notifyLog)); } catch (e) {} }
function getRandomText(textArr) { if (Array.isArray(textArr)) { if (textArr.length === 0) return ''; return textArr[Math.floor(Math.random() * textArr.length)]; } return textArr || ''; }
function checkNotifications() {
    if (!configs.notifications || !notificationSupported() || Notification.permission !== 'granted') return;
    const nowTs = Date.now(); if (nowTs - lastNotifyCheck < 15000) return; lastNotifyCheck = nowTs;
    const today = getLogicalDateStr(); if (notifyLog.date !== today) { notifyLog = { date: today }; saveNotifyLog(); }
    const t = P().texts || DEFAULT_TEXTS_DAILY; const mName = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生'); const dName = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');
    const nSettings = configs.notifySettings; const nTexts = P().notifyTexts || {};
    let items = [];
    if (identity === 'master' || identity === 'both') { items.push({ key: 'master_sleep', user: 'master', type: 'sleep', tz: configs.timeZones.master, name: mName }); items.push({ key: 'master_wake', user: 'master', type: 'wake', tz: configs.timeZones.master, name: mName }); }
    if (identity === 'doggy' || identity === 'both') { items.push({ key: 'doggy_sleep', user: 'doggy', type: 'sleep', tz: configs.timeZones.doggy, name: dName }); items.push({ key: 'doggy_wake', user: 'doggy', type: 'wake', tz: configs.timeZones.doggy, name: dName }); }
    items.forEach(it => {
        const done = db[it.user]?.[today]?.[it.type]?.done; if (done) return;
        const nowMins = toMins(getTimeInTZ(it.tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })); const goalMins = toMins(configs.goals?.[it.user]?.[it.type]); if (!Number.isFinite(nowMins) || !Number.isFinite(goalMins)) return;
        let offset = nowMins - goalMins; if (offset < -720) offset += 1440; else if (offset > 720) offset -= 1440;
        if (offset >= -15 && offset <= 15) { 
            if (!notifyLog[it.key]) { 
                const obj = nTexts[it.key] || { channel: 'both', texts: [] };
                if (obj.channel === 'both' || obj.channel === 'page') {
                    const rawText = getRandomText(obj.texts); const body = (rawText || '').replace(/{name}/g, it.name); sendNotify(it.key, '🔔 契约提醒', body); 
                }
                notifyLog[it.key] = true; saveNotifyLog(); 
            } return; 
        }
        if (nSettings.enableOvertime) {
            let isOvertime = false, overtimeMins = 0; if (it.type === 'sleep' && offset > 30) { isOvertime = true; overtimeMins = offset; } else if (it.type === 'wake' && offset > 30) { isOvertime = true; overtimeMins = offset; }
            if (isOvertime) { 
                const lastNotifyTs = notifyLog[it.key + '_overtime'] || 0; const intervalMs = (nSettings.overtimeInterval || 30) * 60000; 
                if (nowTs - lastNotifyTs >= intervalMs) { 
                    const obj = nTexts[it.type === 'sleep' ? 'overtime_sleep' : 'overtime_wake'] || { channel: 'both', texts: [] };
                    if (obj.channel === 'both' || obj.channel === 'page') {
                        let rawText = getRandomText(obj.texts); if (!rawText) rawText = it.type === 'sleep' ? '{name}，已经熬夜 {mins} 分钟了，该睡觉了！' : '{name}，已经赖床 {mins} 分钟了，快起床吧！';
                        const body = rawText.replace(/{name}/g, it.name).replace(/{mins}/g, overtimeMins); sendNotify(it.key + '_overtime', it.type === 'sleep' ? '🌙 熬夜警告' : '☀️ 赖床警告', body); 
                    }
                    notifyLog[it.key + '_overtime'] = nowTs; saveNotifyLog(); 
                } 
            }
        }
    });
}
function detectPartnerCheckin(remoteDb) {
    if (!identity || identity === 'both') return;
    if (!configs.notifications || !configs.notifySettings || configs.notifySettings.partnerNotify === false) return;
    if (!notificationSupported() || Notification.permission !== 'granted') return;
    const partnerKey = identity === 'master' ? 'doggy' : 'master'; const today = getLogicalDateStr();
    const localRec = (db[partnerKey] || {})[today] || {}; const remoteRec = (remoteDb[partnerKey] || {})[today] || {}; if (!remoteRec || typeof remoteRec !== 'object') return;
    const prof = P(); const partnerNameRaw = partnerKey === 'master' ? prof.texts?.masterName : prof.texts?.doggyName; const partnerName = getPureName(partnerNameRaw) || (partnerKey === 'master' ? '先生' : '宝宝');
    const nTexts = prof.notifyTexts || {};
    ['sleep', 'wake'].forEach(type => {
        const localDone = localRec[type]?.done; const remoteDone = remoteRec[type]?.done; if (localDone || !remoteDone) return;
        const logKey = `partner_${partnerKey}_${type}_${today}`; if (notifyLog[logKey]) return;
        const tplKey = `partner_${partnerKey}_${type}`; const obj = nTexts[tplKey] || { channel: 'both', texts: [] };
        if (obj.channel === 'both' || obj.channel === 'page') {
            const rawText = getRandomText(obj.texts) || `{name} 已${type === 'sleep' ? '休息' : '起床'} ({time})`; const time = remoteRec[type]?.time || '';
            const body = rawText.replace(/{name}/g, partnerName).replace(/{time}/g, time); const title = type === 'sleep' ? (partnerKey === 'master' ? '👑 主人已休息' : '🎀 小狗已休息') : (partnerKey === 'master' ? '👑 主人已起床' : '🎀 小狗已起床');
            sendNotify(logKey, title, body);
        }
        notifyLog[logKey] = true;
    });
    saveNotifyLog();
}
window.testNotification = async function() {
    if (!notificationSupported()) return showToast('不支持通知', 'late'); if (!window.isSecureContext) return showToast('⚠️ 必须在 HTTPS 下', 'late');
    let perm = Notification.permission; if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; } } updateNotifyStatus(); if (perm !== 'granted') return showToast('未获权限', 'late');
    const nTexts = P().notifyTexts || {}; const mName = getPureName(P().texts.masterName) || '先生'; const dName = getPureName(P().texts.doggyName) || '小狗';
    const testKey = identity === 'master' ? 'master_sleep' : (identity === 'doggy' ? 'doggy_sleep' : 'master_wake'); const obj = nTexts[testKey] || { texts: ['测试通知'] };
    let testBody = getRandomText(obj.texts)?.replace(/{name}/g, identity === 'master' ? mName : dName) || '测试通知';
    try { new Notification('🔔 测试通知', { body: testBody, tag: 'dawn-test-' + Date.now(), requireInteraction: true }); showToast('测试已发送', 'success'); } catch (e) { showToast('发送失败：' + e.message, 'late'); }
};
function updateNotifyStatus() {
    const el = document.getElementById('notify-status'); if (!el) return;
    if (!notificationSupported()) { el.textContent = '⚠️ 不支持通知。'; return; } if (!window.isSecureContext) { el.innerHTML = '⚠️ 需 HTTPS 环境。'; return; }
    if (Notification.permission === 'granted') txt = '✅ 权限已授予。'; else if (Notification.permission === 'denied') txt = '❌ 权限被拒绝。'; else txt = 'ℹ️ 未授权。'; el.textContent = txt;
}