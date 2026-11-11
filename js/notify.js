let lastNotifyCheck = 0;
function notificationSupported() { return typeof Notification !== 'undefined'; }
function sendNotify(key, title, body) { try { const n = new Notification(title, { body: body, tag: 'dawn-' + key, requireInteraction: true, silent: false }); } catch (e) { console.warn('通知发送失败', e); } }
function saveNotifyLog() { try { localStorage.setItem('dawn-duo-notify-log', JSON.stringify(notifyLog)); } catch (e) {} }
function getRandomText(textArr) { if (Array.isArray(textArr)) { if (textArr.length === 0) return ''; return textArr[Math.floor(Math.random() * textArr.length)]; } return textArr || ''; }
function checkNotifications() {
    if (!configs.notifications || !notificationSupported() || Notification.permission !== 'granted') return;
    const nowTs = Date.now(); if (nowTs - lastNotifyCheck < 15000) return; lastNotifyCheck = nowTs;
    const today = getLogicalDateStr(); if (notifyLog.date !== today) { notifyLog = { date: today }; saveNotifyLog(); }
    const t = P().texts || DEFAULT_TEXTS_DAILY; const mName = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生'); const dName = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');
    const nSettings = configs.notifySettings || {}; const nTexts = P().notifyTexts || {}; const nItems = nSettings.items || {};
    let items = [];
    if (identity === 'master' || identity === 'both') { items.push({ key: 'master_sleep', user: 'master', type: 'sleep', tz: configs.timeZones.master, name: mName }); items.push({ key: 'master_wake', user: 'master', type: 'wake', tz: configs.timeZones.master, name: mName }); }
    if (identity === 'doggy' || identity === 'both') { items.push({ key: 'doggy_sleep', user: 'doggy', type: 'sleep', tz: configs.timeZones.doggy, name: dName }); items.push({ key: 'doggy_wake', user: 'doggy', type: 'wake', tz: configs.timeZones.doggy, name: dName }); }
    
    items.forEach(it => {
        if (nItems[it.key] === false) return;
        const done = db[it.user]?.[today]?.[it.type]?.done; if (done) return;
        const nowTimeStr = getTimeInTZ(it.tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
        const nowMins = toMins(nowTimeStr); const goalMins = toMins(configs.goals?.[it.user]?.[it.type]); if (!Number.isFinite(nowMins) || !Number.isFinite(goalMins)) return;
        let offset = nowMins - goalMins; if (offset < -720) offset += 1440; else if (offset > 720) offset -= 1440;
        
        if (offset >= -15 && offset <= 15) { 
            if (!notifyLog[it.key]) { 
                const obj = nTexts[it.key] || { channel: 'both', texts: [] };
                if (obj.channel === 'both' || obj.channel === 'page') {
                    const rawText = getRandomText(obj.texts); 
                    const nowHour = parseInt(getTimeInTZ(it.tz, { hour: 'numeric', hourCycle: 'h23' }), 10);
                    const shichen = getShichenInfo(isNaN(nowHour) ? 0 : nowHour);
                    const timeS = getTimeInTZ(it.tz, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
                    const dObj = new Date();
                    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                    const body = (rawText || '').replace(/{name}/g, it.name).replace(/{time_s}/g, timeS).replace(/{time}/g, nowTimeStr).replace(/{shichen}/g, shichen.name).replace(/{shichen_organ}/g, shichen.organ).replace(/{shichen_time}/g, shichen.time).replace(/{weekday}/g, weekdays[dObj.getDay()]).replace(/{date}/g, `${dObj.getMonth()+1}月${dObj.getDate()}日`).replace(/{duration}/g, '').replace(/{mins}/g, '');
                    const titleObj = obj.title || '🔔 契约提醒';
                    sendNotify(it.key, titleObj, body); 
                }
                notifyLog[it.key] = true; saveNotifyLog(); 
            } return; 
        }
        
        const oKey = `${it.user}_${it.type}_overtime`;
        if (nItems[oKey] === false) return; 
        
        const isMaster = it.user === 'master';
        const targetWindowEnabled = isMaster ? (nSettings.master_window_enabled !== false) : (nSettings.doggy_window_enabled !== false);
        const tSleepStart = toMins(isMaster ? (nSettings.master_sleep_start || '21:00') : (nSettings.doggy_sleep_start || '21:00'));
        const tSleepEnd = toMins(isMaster ? (nSettings.master_sleep_end || '05:00') : (nSettings.doggy_sleep_end || '05:00'));
        const tWakeStart = toMins(isMaster ? (nSettings.master_wake_start || '05:00') : (nSettings.doggy_wake_start || '05:00'));
        const tWakeEnd = toMins(isMaster ? (nSettings.master_wake_end || '12:00') : (nSettings.doggy_wake_end || '12:00'));
        const tMaxTimes = isMaster ? (nSettings.master_max_times !== undefined ? nSettings.master_max_times : 3) : (nSettings.doggy_max_times !== undefined ? nSettings.doggy_max_times : 3);
        
        let isOvertime = false, overtimeMins = 0; if (it.type === 'sleep' && offset > 30) { isOvertime = true; overtimeMins = offset; } else if (it.type === 'wake' && offset > 30) { isOvertime = true; overtimeMins = offset; }
        
        if (isOvertime) { 
            if (targetWindowEnabled) {
                const start = it.type === 'sleep' ? tSleepStart : tWakeStart;
                const end = it.type === 'sleep' ? tSleepEnd : tWakeEnd;
                let inWindow = false;
                if (start > end) inWindow = nowMins >= start || nowMins < end;
                else inWindow = nowMins >= start && nowMins < end;
                if (!inWindow) return;
            }
            
            if (tMaxTimes > 0) {
                const logKey = `${it.key}_overtime_count`;
                if ((notifyLog[logKey] || 0) >= tMaxTimes) return;
            }

            const lastNotifyTs = notifyLog[it.key + '_overtime'] || 0; const intervalMs = (nSettings.overtimeInterval || 30) * 60000; 
            if (nowTs - lastNotifyTs >= intervalMs) { 
                const obj = nTexts[oKey] || { channel: 'both', texts: [] };
                if (obj.channel === 'both' || obj.channel === 'page') {
                    let rawText = getRandomText(obj.texts); if (!rawText) rawText = it.type === 'sleep' ? '{name}，已经熬夜 {duration} 了，该睡觉了！' : '{name}，已经赖床 {duration} 了，快起床吧！';
                    const oh = Math.floor(overtimeMins / 60); const om = overtimeMins % 60;
                    const durStr = oh > 0 && om > 0 ? `${oh} h ${om} m` : (oh > 0 ? `${oh} h` : `${om} m`);
                    const nowHour = parseInt(getTimeInTZ(it.tz, { hour: 'numeric', hourCycle: 'h23' }), 10);
                    const shichen = getShichenInfo(isNaN(nowHour) ? 0 : nowHour);
                    const timeS = getTimeInTZ(it.tz, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
                    const dObj = new Date();
                    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                    const body = rawText.replace(/{name}/g, it.name).replace(/{time_s}/g, timeS).replace(/{time}/g, nowTimeStr).replace(/{shichen}/g, shichen.name).replace(/{shichen_organ}/g, shichen.organ).replace(/{shichen_time}/g, shichen.time).replace(/{weekday}/g, weekdays[dObj.getDay()]).replace(/{date}/g, `${dObj.getMonth()+1}月${dObj.getDate()}日`).replace(/{duration}/g, durStr).replace(/{mins}/g, overtimeMins);
                    const titleObj = obj.title || (it.type === 'sleep' ? '🌙 熬夜警告' : '☀️ 赖床警告');
                    sendNotify(it.key + '_overtime', titleObj, body); 
                }
                notifyLog[it.key + '_overtime'] = nowTs; 
                if (tMaxTimes > 0) {
                    const logKey = `${it.key}_overtime_count`;
                    notifyLog[logKey] = (notifyLog[logKey] || 0) + 1;
                }
                saveNotifyLog(); 
            } 
        }
    });
}
function detectPartnerCheckin(remoteDb) {
    if (!identity || identity === 'both') return;
    if (!configs.notifications || !configs.notifySettings) return;
    if (!notificationSupported() || Notification.permission !== 'granted') return;
    const partnerKey = identity === 'master' ? 'doggy' : 'master'; const today = getLogicalDateStr();
    const localRec = (db[partnerKey] || {})[today] || {}; const remoteRec = (remoteDb[partnerKey] || {})[today] || {}; if (!remoteRec || typeof remoteRec !== 'object') return;
    const prof = P(); const partnerNameRaw = partnerKey === 'master' ? prof.texts?.masterName : prof.texts?.doggyName; const partnerName = getPureName(partnerNameRaw) || (partnerKey === 'master' ? '先生' : '宝宝');
    const nTexts = prof.notifyTexts || {}; const nItems = configs.notifySettings.items || {};
    ['sleep', 'wake'].forEach(type => {
        const localDone = localRec[type]?.done; const remoteDone = remoteRec[type]?.done; if (localDone || !remoteDone) return;
        const tplKey = `partner_${partnerKey}_${type}`; 
        if (nItems[tplKey] === false) return; 
        const logKey = `${tplKey}_${today}`; if (notifyLog[logKey]) return;
        const obj = nTexts[tplKey] || { channel: 'both', texts: [] };
        if (obj.channel === 'both' || obj.channel === 'page') {
            const rawText = getRandomText(obj.texts) || `{name} 已${type === 'sleep' ? '休息' : '起床'} ({time})`; 
            const time = remoteRec[type]?.time || '';
            const body = rawText.replace(/{name}/g, partnerName).replace(/{time}/g, time).replace(/{time_s}/g, time).replace(/{shichen}/g, '').replace(/{shichen_organ}/g, '').replace(/{shichen_time}/g, '').replace(/{weekday}/g, '').replace(/{date}/g, '').replace(/{duration}/g, '').replace(/{mins}/g, ''); 
            const title = obj.title || (type === 'sleep' ? (partnerKey === 'master' ? '👑 主人已休息' : '🎀 小狗已休息') : (partnerKey === 'master' ? '👑 主人已起床' : '🎀 小狗已起床'));
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
    let txt = '';
    if (!notificationSupported()) { el.textContent = '⚠️ 不支持通知。'; return; } if (!window.isSecureContext) { el.innerHTML = '⚠️ 需 HTTPS 环境。'; return; }
    if (Notification.permission === 'granted') txt = '✅ 权限已授予。'; else if (Notification.permission === 'denied') txt = '❌ 权限被拒绝。'; else txt = 'ℹ️ 未授权。'; el.textContent = txt;
}