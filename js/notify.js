let lastNotifyCheck = 0;
function notificationSupported() { return typeof Notification !== 'undefined'; }

function sendNotify(key, title, body) {
  try {
    const n = new Notification(title, { body: body, tag: 'dawn-' + key, requireInteraction: true, silent: false });
    setTimeout(() => { try { n.close(); } catch (e) {} }, 15000);
  } catch (e) { console.warn('通知发送失败', e); }
}

function saveNotifyLog() {
  try { localStorage.setItem('dawn-duo-notify-log', JSON.stringify(notifyLog)); } catch (e) {}
}

function checkNotifications() {
  if (!configs.notifications || !notificationSupported() || Notification.permission !== 'granted') return;
  const nowTs = Date.now();
  if (nowTs - lastNotifyCheck < 15000) return;
  lastNotifyCheck = nowTs;

  const today = getLogicalDateStr();
  if (notifyLog.date !== today) { notifyLog = { date: today }; saveNotifyLog(); }

  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const mName = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生');
  const dName = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');
  const nSettings = configs.notifySettings;
  const nTexts = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;

  let items = [];
  if (identity === 'master' || identity === 'both') {
    items.push({ key: 'master_sleep', user: 'master', type: 'sleep', tz: configs.timeZones.master, name: mName });
    items.push({ key: 'master_wake', user: 'master', type: 'wake', tz: configs.timeZones.master, name: mName });
  }
  if (identity === 'doggy' || identity === 'both') {
    items.push({ key: 'doggy_sleep', user: 'doggy', type: 'sleep', tz: configs.timeZones.doggy, name: dName });
    items.push({ key: 'doggy_wake', user: 'doggy', type: 'wake', tz: configs.timeZones.doggy, name: dName });
  }

  items.forEach(it => {
    const done = db[it.user]?.[today]?.[it.type]?.done;
    if (done) return;

    const nowMins = toMins(getTimeInTZ(it.tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }));
    const goalMins = toMins(configs.goals?.[it.user]?.[it.type]);
    if (!Number.isFinite(nowMins) || !Number.isFinite(goalMins)) return;

    let offset = nowMins - goalMins;
    if (offset < -720) offset += 1440;
    else if (offset > 720) offset -= 1440;

    if (offset >= -15 && offset <= 15) {
      if (!notifyLog[it.key]) {
        const body = (nTexts[it.key] || '').replace(/{name}/g, it.name);
        sendNotify(it.key, '🔔 契约提醒', body);
        notifyLog[it.key] = true;
        saveNotifyLog();
      }
      return;
    }

    if (nSettings.enableOvertime) {
      let isOvertime = false, overtimeMins = 0;
      if (it.type === 'sleep' && offset > 30) { isOvertime = true; overtimeMins = offset; }
      else if (it.type === 'wake' && offset > 30) { isOvertime = true; overtimeMins = offset; }

      if (isOvertime) {
        const lastNotifyTs = notifyLog[it.key + '_overtime'] || 0;
        const intervalMs = (nSettings.overtimeInterval || 30) * 60000;
        if (nowTs - lastNotifyTs >= intervalMs) {
          let template = it.type === 'sleep' ? nTexts.overtime_sleep : nTexts.overtime_wake;
          if (!template) template = it.type === 'sleep' ? '{name}，已经熬夜 {mins} 分钟了，该睡觉了！' : '{name}，已经赖床 {mins} 分钟了，快起床吧！';
          const body = template.replace(/{name}/g, it.name).replace(/{mins}/g, overtimeMins);
          sendNotify(it.key + '_overtime', it.type === 'sleep' ? '🌙 熬夜警告' : '☀️ 赖床警告', body);
          notifyLog[it.key + '_overtime'] = nowTs;
          saveNotifyLog();
        }
      }
    }
  });
}

function detectPartnerCheckin(remoteDb) {
  if (!identity || identity === 'both') return;
  if (!configs.notifications || !configs.notifySettings || configs.notifySettings.partnerNotify === false) return;
  if (!notificationSupported() || Notification.permission !== 'granted') return;

  const partnerKey = identity === 'master' ? 'doggy' : 'master';
  const today = getLogicalDateStr();
  const localRec = (db[partnerKey] || {})[today] || {};
  const remoteRec = (remoteDb[partnerKey] || {})[today] || {};
  if (!remoteRec || typeof remoteRec !== 'object') return;

  const prof = P();
  const partnerNameRaw = partnerKey === 'master' ? prof.texts?.masterName : prof.texts?.doggyName;
  const partnerName = getPureName(partnerNameRaw) || (partnerKey === 'master' ? '先生' : '宝宝');
  const nTexts = prof.notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;

  ['sleep', 'wake'].forEach(type => {
    const localDone = localRec[type]?.done;
    const remoteDone = remoteRec[type]?.done;
    if (localDone || !remoteDone) return;
    
    const logKey = `partner_${partnerKey}_${type}_${today}`;
    if (notifyLog[logKey]) return;
    
    const tplKey = `partner_${partnerKey}_${type}`;
    const tpl = nTexts[tplKey] || `{name} 已${type === 'sleep' ? '休息' : '起床'} ({time})`;
    const time = remoteRec[type]?.time || '';
    
    const body = tpl.replace(/{name}/g, partnerName).replace(/{time}/g, time);
    const title = type === 'sleep' ? (partnerKey === 'master' ? '👑 主人已休息' : '🎀 小狗已休息') : (partnerKey === 'master' ? '👑 主人已起床' : '🎀 小狗已起床');
      
    sendNotify(logKey, title, body);
    notifyLog[logKey] = true;
  });
  saveNotifyLog();
}

window.testNotification = async function() {
  if (!notificationSupported()) return showToast('当前浏览器不支持通知', 'late');
  if (!window.isSecureContext) return showToast('⚠️ 必须在 HTTPS 或 localhost 下才能发送通知', 'late');
  let perm = Notification.permission;
  if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; } }
  updateNotifyStatus();
  if (perm !== 'granted') return showToast('未获得通知权限，请检查浏览器站点设置', 'late');

  const nTexts = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;
  const mName = getPureName(P().texts.masterName) || '先生';
  const dName = getPureName(P().texts.doggyName) || '小狗';
  let testBody = (identity === 'master') ? nTexts.master_sleep?.replace(/{name}/g, mName) : (identity === 'doggy' ? nTexts.doggy_sleep?.replace(/{name}/g, dName) : '这是一条测试通知。');
  try {
    new Notification('🔔 测试通知', { body: testBody || '测试', tag: 'dawn-test-' + Date.now(), requireInteraction: true });
    showToast('测试通知已发送 🔔', 'success');
  } catch (e) { showToast('通知发送失败：' + e.message, 'late'); }
};

function updateNotifyStatus() {
  const el = document.getElementById('notify-status');
  if (!el) return;
  if (!notificationSupported()) { el.textContent = '⚠️ 当前浏览器不支持系统通知。'; return; }
  if (!window.isSecureContext) { el.innerHTML = '⚠️ 当前非 HTTPS/localhost 环境，浏览器会拦截通知。'; return; }
  let txt = '';
  if (Notification.permission === 'granted') txt = '✅ 通知权限已授予，到点会自动提醒。';
  else if (Notification.permission === 'denied') txt = '❌ 通知权限已被拒绝，请手动在地址栏左侧修改。';
  else txt = 'ℹ️ 尚未授权，请点击下方按钮授权。';
  el.textContent = txt;
}

window.togglePartnerNotifyInputs = function() {
  const isChecked = document.getElementById('cfg-notify-partner').checked;
  const container = document.getElementById('partner-notify-inputs');
  const inputs = container.querySelectorAll('input');
  inputs.forEach(inp => {
    inp.disabled = !isChecked;
    if (isChecked) {
      inp.style.opacity = '1'; inp.style.cursor = 'text'; inp.parentElement.parentElement.style.opacity = '1';
    } else {
      inp.style.opacity = '0.5'; inp.style.cursor = 'not-allowed'; inp.parentElement.parentElement.style.opacity = '0.5';
    }
  });
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

window.subscribeToPush = async function () {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return showToast('当前浏览器不支持 Web Push', 'late');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return showToast('通知权限被拒绝，无法接收后台提醒', 'late');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('BCFx4JLqFVNZ2MExV8ZX5IKI1NvwWRsRp-Ennufze3bCXDdfKWicy6MiMAIcBpFcDurOOjvLFU3RlkHGkMzoLIg'),
    });

    const WORKER_URL = 'https://push-subscribe.luo029.workers.dev/';
    const WEBHOOK_SECRET = 'doggy';

    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: WEBHOOK_SECRET,
        subscription: subscription.toJSON(),
      }),
    });

    if (res.ok) {
      showToast('✅ 系统通知已开启，后台也能收到提醒了', 'success');
      localStorage.setItem('push-subscribed', 'true');
    } else {
      showToast('订阅信息保存失败，请稍后重试', 'late');
    }
  } catch (e) {
    showToast('订阅发生错误：' + e.message, 'late');
  }
};