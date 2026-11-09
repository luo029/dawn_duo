// ================= 数据初始化与迁移 =================
function deepMerge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) {
    if (Array.isArray(override)) return override.slice();
    return Array.isArray(base) ? base.slice() : override;
  }
  const isObj = (v) => v && typeof v === 'object';
  if (isObj(base)) {
    const ov = isObj(override) ? override : {};
    const out = {};
    for (const k of Object.keys(base)) out[k] = deepMerge(base[k], ov[k]);
    for (const k of Object.keys(ov)) if (!(k in out)) out[k] = deepMerge(undefined, ov[k]);
    return out;
  }
  return override === undefined ? base : override;
}

function migrateConfigs(raw) {
  if (!raw || typeof raw !== 'object') return {};
  if (raw.configVersion >= 7) return raw;
  
  const out = Object.assign({}, raw);
  out.configVersion = 7;
  
  if (out.timeZones && typeof out.timeZones.master === 'string') {
    out.timeZones = { master: { type: 'iana', value: out.timeZones.master }, doggy: { type: 'iana', value: out.timeZones.doggy } };
  }
  if (!out.profiles) out.profiles = { daily: {}, service: {} };
  const oldNotifyTexts = out.notifySettings && out.notifySettings.texts ? out.notifySettings.texts : null;
  if (oldNotifyTexts) {
    if (!out.profiles.daily.notifyTexts) out.profiles.daily.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.daily, oldNotifyTexts);
    if (!out.profiles.service.notifyTexts) out.profiles.service.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.service);
    delete out.notifySettings.texts; 
  }
  if (out.showLogicalDate === undefined) out.showLogicalDate = true;
  
  if (!out.clockLayout) out.clockLayout = 'separate';
  if (out.showMasterClock === undefined) out.showMasterClock = true;
  if (out.showDoggyClock === undefined) out.showDoggyClock = true;
  if (out.showSeconds === undefined) out.showSeconds = true;
  if (out.showShichen === undefined) out.showShichen = false;
  if (out.showWellness === undefined) out.showWellness = false;
  return out;
}

let savedConfigs = {};
try { savedConfigs = migrateConfigs(JSON.parse(localStorage.getItem('dawn-duo-configs')) || {}); } catch (e) { savedConfigs = {}; }

let configs = deepMerge(DEFAULT_CONFIGS, savedConfigs);
if (configs.mode !== 'service') configs.mode = 'daily';

if (!configs.profiles) configs.profiles = deepMerge(DEFAULT_CONFIGS.profiles, {});
if (!configs.profiles.daily.notifyTexts) configs.profiles.daily.notifyTexts = DEFAULT_NOTIFY_TEXTS.daily;
if (!configs.profiles.service.notifyTexts) configs.profiles.service.notifyTexts = DEFAULT_NOTIFY_TEXTS.service;

function P() { return configs.profiles[configs.mode] || configs.profiles.daily; }
function modeLabel() { return configs.mode === 'service' ? '主仆' : '日常'; }

const IDENTITY_KEY = 'dawn-duo-identity';
let identity = '';
try { identity = localStorage.getItem(IDENTITY_KEY) || ''; } catch (e) { identity = ''; }
if (['master', 'doggy', 'both'].indexOf(identity) === -1) identity = '';

let db = { master: {}, doggy: {} };
let notifyLog = JSON.parse(localStorage.getItem('dawn-duo-notify-log') || '{}');
let lastLogicalDate = getLogicalDateStr();

// ================= 工具函数 =================
function getPureName(str) {
  return (str || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim();
}
function getLogicalDateStr(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() - offsetDays);
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
function getTimeInTZ(tzObj, options) {
  try {
    if (!tzObj || !tzObj.type) return '--:--:--';
    if (tzObj.type === 'offset') {
      const offset = parseFloat(tzObj.value) || 0;
      const targetUtcOffset = 8 + offset;
      const date = new Date(new Date().getTime() + targetUtcOffset * 3600000);
      return new Intl.DateTimeFormat('zh-CN', Object.assign({ timeZone: 'UTC' }, options)).format(date);
    } else {
      return new Intl.DateTimeFormat('zh-CN', Object.assign({ timeZone: tzObj.value || 'Asia/Shanghai' }, options)).format(new Date());
    }
  } catch (e) { return '--:--:--'; }
}
function getUTC_Offset(tzObj) {
  try {
    if (!tzObj || !tzObj.type) return 8;
    if (tzObj.type === 'offset') return 8 + (parseFloat(tzObj.value) || 0);
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tzObj.value || 'Asia/Shanghai' }));
    return (tzDate.getTime() - utcDate.getTime()) / 3600000;
  } catch(e) { return 8; }
}
function formatCheckinTime(tzObj) {
  return getTimeInTZ(tzObj, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}
function toMins(t) {
  if (typeof t !== 'string') return NaN;
  const parts = t.split(':');
  if (parts.length < 2) return NaN;
  const h = Number(parts[0]); const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function checkGoal(user, type, timeStr) {
  if (!timeStr) return false;
  const goalStr = (configs.goals?.[user]?.[type]) || (DEFAULT_CONFIGS.goals?.[user]?.[type]);
  const tMins = toMins(timeStr); const gMins = toMins(goalStr);
  if (!Number.isFinite(tMins) || !Number.isFinite(gMins)) return false;
  if (type === 'sleep') {
    let tAdj = tMins;
    if (gMins - tMins > 12 * 60) tAdj += 24 * 60;
    return tAdj <= gMins;
  }
  return tMins <= gMins;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Device';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown Device';
}

function getShichenInfo(hour) {
  let index = Math.floor((hour + 1) / 2) % 12;
  return SHICHEN_DATA[index];
}

let toastTimer;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'show ' + type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500 + msg.length * 120);
}

// ================= 开关联动逻辑 =================
window.handleShichenToggle = function() {
  const shichenChecked = document.getElementById('cfg-show-shichen').checked;
  if (!shichenChecked) {
    document.getElementById('cfg-show-wellness').checked = false;
  }
};

window.handleWellnessToggle = function() {
  const wellnessChecked = document.getElementById('cfg-show-wellness').checked;
  if (wellnessChecked) {
    document.getElementById('cfg-show-shichen').checked = true;
  }
};

// ================= 通知核心逻辑 =================
let lastNotifyCheck = 0;

function notificationSupported() {
  return typeof Notification !== 'undefined';
}

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
  if (!configs.notifications) return;
  if (!notificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  const nowTs = Date.now();
  if (nowTs - lastNotifyCheck < 15000) return;
  lastNotifyCheck = nowTs;

  const today = getLogicalDateStr();
  if (notifyLog.date !== today) {
    notifyLog = { date: today };
    saveNotifyLog();
  }

  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const mName = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生');
  const dName = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');
  
  const nSettings = configs.notifySettings;
  const nTexts = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;

  let items = [];
  if (identity === 'master' || identity === 'both') {
    items.push(
      { key: 'master_sleep', user: 'master', type: 'sleep', tz: configs.timeZones.master, name: mName },
      { key: 'master_wake', user: 'master', type: 'wake', tz: configs.timeZones.master, name: mName }
    );
  }
  if (identity === 'doggy' || identity === 'both') {
    items.push(
      { key: 'doggy_sleep', user: 'doggy', type: 'sleep', tz: configs.timeZones.doggy, name: dName },
      { key: 'doggy_wake', user: 'doggy', type: 'wake', tz: configs.timeZones.doggy, name: dName }
    );
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
      let isOvertime = false;
      let overtimeMins = 0;
      if (it.type === 'sleep') {
        if (offset > 30 || offset < -720) {
          isOvertime = true;
          overtimeMins = offset > 0 ? offset : offset + 1440;
        }
      } else {
        if (offset > 30) {
          isOvertime = true;
          overtimeMins = offset;
        }
      }

      if (isOvertime) {
        const lastNotifyTs = notifyLog[it.key + '_overtime'] || 0;
        const intervalMs = (nSettings.overtimeInterval || 30) * 60000;
        if (nowTs - lastNotifyTs >= intervalMs) {
          let template = it.type === 'sleep' ? nTexts.overtime_sleep : nTexts.overtime_wake;
          if (!template) {
            template = it.type === 'sleep' ? '{name}，已经熬夜 {mins} 分钟了，该睡觉了！' : '{name}，已经赖床 {mins} 分钟了，快起床吧！';
          }
          const body = template.replace(/{name}/g, it.name).replace(/{mins}/g, overtimeMins);
          sendNotify(it.key + '_overtime', it.type === 'sleep' ? '🌙 熬夜警告' : '☀️ 赖床警告', body);
          notifyLog[it.key + '_overtime'] = nowTs;
          saveNotifyLog();
        }
      }
    }
  });
}

window.testNotification = async function() {
  if (!notificationSupported()) return showToast('当前浏览器不支持通知', 'late');
  if (!window.isSecureContext) return showToast('⚠️ 必须在 HTTPS 或 localhost 下才能发送通知', 'late');
  
  let perm = Notification.permission;
  if (perm === 'default') {
    try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; }
  }
  updateNotifyStatus();
  
  if (perm !== 'granted') return showToast('未获得通知权限，请检查浏览器站点设置', 'late');

  const nTexts = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;
  const mName = getPureName(P().texts.masterName) || '主人';
  const dName = getPureName(P().texts.doggyName) || '小狗';
  
  let testBody = '';
  if (identity === 'master') {
    testBody = nTexts.master_sleep ? nTexts.master_sleep.replace(/{name}/g, mName) : '这是一条测试通知。';
  } else if (identity === 'doggy') {
    testBody = nTexts.doggy_sleep ? nTexts.doggy_sleep.replace(/{name}/g, dName) : '这是一条测试通知。';
  } else {
    testBody = '这是一条测试通知。当前是滴滴模式，所有打卡都会提醒您。';
  }

  if (configs.notifySettings.enableOvertime) {
    let ovText = identity === 'master' ? nTexts.overtime_sleep : (identity === 'doggy' ? nTexts.overtime_sleep : '{name}，已经熬夜 {mins} 分钟了');
    testBody += '\n(若超时会提醒：' + ovText.replace(/{name}/g, identity === 'master' ? mName : dName).replace(/{mins}/g, '45') + ')';
  }

  try {
    const uniqueTag = 'dawn-test-' + Date.now();
    const n = new Notification('🔔 测试通知', { body: testBody, tag: uniqueTag, requireInteraction: true });
    setTimeout(() => { try { n.close(); } catch (e) {} }, 15000);
    showToast('测试通知已发送 🔔', 'success');
  } catch (e) {
    showToast('通知发送失败：' + e.message, 'late');
  }
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

// ================= 打卡与渲染 =================
window.toggle = function(user, type) {
  const today = getLogicalDateStr();
  if (!db[user]) db[user] = {};
  if (!db[user][today]) db[user][today] = {};
  if (!db[user][today][type]) db[user][today][type] = { done: false };

  const record = db[user][today][type];
  if (record.done) {
    delete db[user][today][type];
    if (Object.keys(db[user][today]).length === 0) delete db[user][today];
    saveLocalData(); showToast('已取消打卡～', 'late'); return;
  }

  record.done = true;
  record.time = formatCheckinTime(configs.timeZones[user]);
  record.ontime = checkGoal(user, type, record.time);
  
  record.meta = {
    timestamp: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    device: getDeviceInfo()
  };

  const status = record.ontime ? 'success' : 'late';
  const pool = P().msgPool || {};
  const arr = pool?.[user]?.[type]?.[status] || [];
  const msg = arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : (record.ontime ? '打卡成功！(未配置文案)' : '打卡完成，但未达标。');

  showToast(msg, status);
  saveLocalData();
}

function saveLocalData() {
  try { localStorage.setItem('dawn-duo-data', JSON.stringify(db)); } catch (e) { showToast('存储失败', 'late'); }
  render();
  debounceSync();
}

function render() {
  try {
    const today = getLogicalDateStr();
    let total = 0;
    for (const u of ['master', 'doggy']) {
      if (db[u]) {
        for (const d in db[u]) {
          const day = db[u][d];
          if (day.sleep && day.sleep.done) total++;
          if (day.wake && day.wake.done) total++;
        }
      }
    }
    document.getElementById('stat-total').textContent = total;

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = getLogicalDateStr(i);
      const mScore = (db.master?.[dateStr]?.sleep?.done ? 1 : 0) + (db.master?.[dateStr]?.wake?.done ? 1 : 0);
      const dScore = (db.doggy?.[dateStr]?.sleep?.done ? 1 : 0) + (db.doggy?.[dateStr]?.wake?.done ? 1 : 0);
      if (mScore > 0 || dScore > 0) streak++;
      else if (i > 0) break;
    }
    document.getElementById('stat-streak').textContent = streak;

    ['master', 'doggy'].forEach(user => {
      ['sleep', 'wake'].forEach(type => {
        const btn = document.getElementById(`btn-${user}-${type}`);
        const timeLabel = document.getElementById(`time-${user}-${type}`);
        if (!btn || !timeLabel) return;
        const record = db[user]?.[today]?.[type];

        btn.classList.remove('active', 'late');
        if (record && record.done) {
          btn.classList.add(record.ontime ? 'active' : 'late');
          timeLabel.textContent = record.time || '已打卡';
        } else {
          timeLabel.textContent = '未打卡';
        }
      });
    });
    renderHistory();
  } catch(e) { console.warn('渲染异常', e); }
}

function renderHistory() {
  const box = document.getElementById('history-box');
  const viewDays = document.getElementById('history-view-days');
  const viewCal = document.getElementById('history-grid-calendar');
  const emptyState = document.getElementById('history-empty');

  if (!configs.showHistory) { box.style.display = 'none'; return; }
  box.style.display = 'block';

  let hasData = false;
  for (const u of ['master', 'doggy']) {
    if (!db[u]) continue;
    for (const d in db[u]) {
      const rec = db[u][d];
      if (rec && ((rec.wake && rec.wake.done) || (rec.sleep && rec.sleep.done))) { hasData = true; break; }
    }
    if (hasData) break;
  }
  emptyState.style.display = hasData ? 'none' : 'block';

  if (configs.historyType === 'days') {
    viewDays.style.display = 'flex'; viewCal.style.display = 'none';
    const days = Number(configs.historyDays) || 30;
    document.getElementById('history-title-text').textContent = `最近 ${days} 天打卡回顾`;
    const grid = document.getElementById('history-grid-days');
    grid.innerHTML = '';
    for (let i = days - 1; i >= 0; i--) {
      grid.appendChild(createDayBox(getLogicalDateStr(i), false));
    }
  } else {
    viewDays.style.display = 'none'; viewCal.style.display = 'grid';
    document.getElementById('history-title-text').textContent = `${configs.historyYear} 年 ${configs.historyMonth} 月打卡回顾`;
    viewCal.innerHTML = '';
    ['日','一','二','三','四','五','六'].forEach(day => { viewCal.innerHTML += `<div class="calendar-weekday">${day}</div>`; });

    let year = parseInt(configs.historyYear, 10), month = parseInt(configs.historyMonth, 10) - 1;
    if (!Number.isFinite(year)) year = new Date().getFullYear();
    if (!Number.isFinite(month) || month < 0 || month > 11) month = new Date().getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) viewCal.innerHTML += `<div class="calendar-empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEl = createDayBox(dateStr, true);
      dayEl.textContent = d;
      viewCal.appendChild(dayEl);
    }
  }
}

function createDayBox(dateStr, showDateText = false) {
  const mSleep = db['master']?.[dateStr]?.sleep?.done, mWake = db['master']?.[dateStr]?.wake?.done;
  const dSleep = db['doggy']?.[dateStr]?.sleep?.done, dWake = db['doggy']?.[dateStr]?.wake?.done;
  const mScore = (mSleep ? 1 : 0) + (mWake ? 1 : 0), dScore = (dSleep ? 1 : 0) + (dWake ? 1 : 0);

  let statusClass = '';
  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const mPure = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生');
  const dPure = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');
  const tooltip = `${dateStr} | ${mPure}: ${mScore}/2, ${dPure}: ${dScore}/2`;

  if (mScore === 2 && dScore === 2) statusClass = 'done-both';
  else if (mScore === 2) statusClass = 'done-master';
  else if (dScore === 2) statusClass = 'done-doggy';
  else if (mScore > 0 && dScore > 0) statusClass = 'half-both';
  else if (mScore > 0) statusClass = 'half-master';
  else if (dScore > 0) statusClass = 'half-doggy';

  const el = document.createElement('div');
  el.className = `day-box ${statusClass}`.trim();
  el.title = tooltip;
  if (!showDateText) el.textContent = parseInt(dateStr.split('-')[2], 10);
  return el;
}

// ================= 时钟与养生渲染 =================
function updateClocks() {
  try {
    const container = document.getElementById('clock-container');
    const cardMaster = document.getElementById('clock-card-master');
    const cardDoggy = document.getElementById('clock-card-doggy');
    
    container.className = 'grid-clocks'; 
    
    const isMasterIdentity = (identity === 'master' || identity === 'both');
    const isDoggyIdentity = (identity === 'doggy' || identity === 'both');
    
    const showM = configs.showMasterClock && isMasterIdentity;
    const showD = configs.showDoggyClock && isDoggyIdentity;
    
    if (!showM && !showD) {
      container.style.display = 'none';
    } else {
      container.style.display = '';
      cardMaster.style.display = showM ? '' : 'none';
      cardDoggy.style.display = showD ? '' : 'none';
      
      if (configs.clockLayout === 'merge') {
        container.classList.add('merge-layout');
        if (showM && showD) {
          cardMaster.style.borderRadius = '20px 0 0 20px';
          cardMaster.style.borderRight = 'none';
          cardDoggy.style.borderRadius = '0 20px 20px 0';
        } else if (showM && !showD) {
          cardMaster.style.borderRadius = '20px';
          cardMaster.style.borderRight = '1px solid var(--border)';
        } else if (!showM && showD) {
          cardDoggy.style.borderRadius = '20px';
        }
      } else {
        container.classList.remove('merge-layout');
        if (!showM && showD) container.style.gridTemplateColumns = '1fr';
        else if (showM && !showD) container.style.gridTemplateColumns = '1fr';
        else container.style.gridTemplateColumns = '1fr 1fr';
      }
    }

    const timeOpts = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    if (configs.showSeconds) timeOpts.second = '2-digit';
    
    let infoM = null, infoD = null;
    
    if (showM) {
      const nowM = getTimeInTZ(configs.timeZones.master, timeOpts);
      document.getElementById('time-master').textContent = nowM;
      document.getElementById('date-master').textContent = getTimeInTZ(configs.timeZones.master, { month: 'long', day: 'numeric', weekday: 'short' });
      
      if (configs.showShichen) {
        const hM = parseInt(nowM.split(':')[0], 10);
        infoM = getShichenInfo(isNaN(hM) ? 0 : hM);
        const sM = document.getElementById('shichen-master');
        sM.style.display = 'inline-block';
        sM.textContent = `${infoM.name} (${infoM.organ})`;
      } else {
        document.getElementById('shichen-master').style.display = 'none';
      }
    }

    if (showD) {
      const nowD = getTimeInTZ(configs.timeZones.doggy, timeOpts);
      document.getElementById('time-doggy').textContent = nowD;
      document.getElementById('date-doggy').textContent = getTimeInTZ(configs.timeZones.doggy, { month: 'long', day: 'numeric', weekday: 'short' });
      
      if (configs.showShichen) {
        const hD = parseInt(nowD.split(':')[0], 10);
        infoD = getShichenInfo(isNaN(hD) ? 0 : hD);
        const sD = document.getElementById('shichen-doggy');
        sD.style.display = 'inline-block';
        sD.textContent = `${infoD.name} (${infoD.organ})`;
      } else {
        document.getElementById('shichen-doggy').style.display = 'none';
      }
    }

    const wellnessPanel = document.getElementById('wellness-panel');
    const wellnessText = document.getElementById('wellness-text');
    
    if (configs.showShichen && configs.showWellness && (infoM || infoD)) {
      let html = '';
      if (showM && infoM) {
        html += `<div class="wellness-item"><span>🌿</span> <strong>${infoM.name}</strong> (${infoM.time}) · <strong>${infoM.organ}经</strong>当令 <span class="wellness-msg">${infoM.msg}</span></div>`;
      }
      if (showD && infoD) {
        html += `<div class="wellness-item is-doggy"><span>🍃</span> <strong>${infoD.name}</strong> (${infoD.time}) · <strong>${infoD.organ}经</strong>当令 <span class="wellness-msg">${infoD.msg}</span></div>`;
      }
      wellnessText.innerHTML = html;
      wellnessPanel.style.display = 'flex';
    } else {
      wellnessPanel.style.display = 'none';
    }

    let diffHours = '--';
    const offset1 = getUTC_Offset(configs.timeZones.master);
    const offset2 = getUTC_Offset(configs.timeZones.doggy);
    let diff = Math.abs(offset1 - offset2);
    diffHours = Math.round(diff * 10) / 10;
    if (diffHours % 1 === 0) diffHours = diffHours.toString();

    let daysTogether = 0;
    const annDate = new Date(configs.anniversary);
    const currDate = new Date(getLogicalDateStr());
    const d = Math.ceil(Math.abs(currDate - annDate) / (1000 * 60 * 60 * 24));
    if (Number.isFinite(d)) daysTogether = d;

    document.getElementById('diff-text').innerHTML = `相隔 <span>${diffHours}</span> 小时 · 契约已绑定 <span>${daysTogether}</span> 天 💗`;

    const currentLogicalDate = getLogicalDateStr();
    if (currentLogicalDate !== lastLogicalDate) {
      lastLogicalDate = currentLogicalDate;
      render();
    }

    const dateObj = new Date(lastLogicalDate);
    if (!isNaN(dateObj.getTime())) {
      document.getElementById('logical-date-display').textContent = `契约日: ${dateObj.getMonth()+1}月${dateObj.getDate()}日`;
    }
    
    if (localStorage.getItem('dawn-duo-theme-locked') !== 'true') {
      try {
        const hourStr = getTimeInTZ(configs.timeZones.master, { hour: 'numeric', hourCycle: 'h23' });
        const hour = parseInt(hourStr, 10);
        if (!isNaN(hour)) {
          const targetTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
          if (document.documentElement.getAttribute('data-theme') !== targetTheme) {
            document.documentElement.setAttribute('data-theme', targetTheme);
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.textContent = targetTheme === 'dark' ? '🌙' : '☀️';
          }
        }
      } catch (e) {}
    }

    checkNotifications();
  } catch(e) { console.warn("时钟更新异常", e); }
}
setInterval(updateClocks, 1000);
updateClocks();

// ================= 主题、身份与设置逻辑 =================
window.toggleTheme = function() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('dawn-duo-theme', next);
  localStorage.setItem('dawn-duo-theme-locked', 'true');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
};

function updateIdentityLabels() {
  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const m = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生');
  const d = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');
  const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  setText('id-name-master', m); setText('id-desc-master', `只显示 ${m} 的打卡页面`);
  setText('id-name-doggy', d); setText('id-desc-doggy', `只显示 ${d} 的打卡页面`);
  setText('id-pill-label-master', m); setText('id-pill-label-doggy', d);
}

function updateIdentityCards() {
  ['master', 'doggy', 'both'].forEach(id => {
    const b = document.getElementById('id-modal-card-' + id);
    if (b) b.classList.toggle('active', identity === id);
    const p = document.getElementById('id-pill-' + id);
    if (p) p.classList.toggle('active', identity === id);
  });
}

function applyIdentity() {
  const showM = (identity === 'master' || identity === 'both');
  const showD = (identity === 'doggy' || identity === 'both');
  const grid = document.getElementById('grid-users');
  const mCard = document.querySelector('.grid-users .master-card');
  const dCard = document.querySelector('.grid-users .doggy-card');
  
  if (mCard) mCard.style.display = showM ? '' : 'none';
  if (dCard) dCard.style.display = showD ? '' : 'none';
  
  if (grid) {
    if (!showM || !showD) grid.classList.add('single');
    else grid.classList.remove('single');
  }
  
  updateClocks(); 
}

window.chooseIdentity = function(id) {
  if (['master', 'doggy', 'both'].indexOf(id) === -1) return;
  identity = id;
  try { localStorage.setItem(IDENTITY_KEY, id); } catch (e) {}
  
  document.documentElement.classList.remove('no-identity');
  
  const modal = document.getElementById('identity-modal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  applyIdentity(); updateIdentityCards();
  let msg = '身份已选择 💗';
  if (id === 'master') msg = '已切换为 ' + (getPureName(P().texts.masterName) || '先生') + ' 👑';
  else if (id === 'doggy') msg = '已切换为 ' + (getPureName(P().texts.doggyName) || '宝宝') + ' 🎀';
  else msg = '已切换为 滴滴 🍉 两个页面都能看';
  showToast(msg, 'success');
};

function initIdentity() {
  updateIdentityLabels(); updateIdentityCards();
  if (!identity) {
    const modal = document.getElementById('identity-modal');
    if (modal) { modal.classList.add('show'); document.body.style.overflow = 'hidden'; }
  } else {
    document.documentElement.classList.remove('no-identity');
    applyIdentity(); 
  }
}

window.switchTab = function(e, tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById(tabId).classList.add('active');
};

window.toggleHistoryTypeOptions = function() {
  const type = document.getElementById('cfg-history-type').value;
  document.getElementById('group-history-days').style.display = type === 'days' ? 'block' : 'none';
  document.getElementById('group-history-month').style.display = type === 'month' ? 'flex' : 'none';
};

window.toggleTzInput = function(user) {
  const type = document.getElementById(`cfg-tz-${user}-type`).value;
  document.getElementById(`group-tz-${user}-iana`).style.display = type === 'iana' ? 'block' : 'none';
  document.getElementById(`group-tz-${user}-offset`).style.display = type === 'offset' ? 'block' : 'none';
};

function updateModeCards() {
  const d = document.getElementById('mode-card-daily'), s = document.getElementById('mode-card-service');
  if (d) d.classList.toggle('active', configs.mode === 'daily');
  if (s) s.classList.toggle('active', configs.mode === 'service');
  
  const isService = configs.mode === 'service';
  const masterTitle = isService ? '主人' : '先生';
  const doggyTitle = isService ? '小狗' : '宝宝';

  const tl = document.getElementById('cfg-text-mode-label');
  if (tl) tl.textContent = modeLabel();
  const ntl = document.getElementById('cfg-nt-mode-label');
  if (ntl) ntl.textContent = modeLabel();

  const idsToUpdate = {
    'cfg-title-master': masterTitle, 'cfg-title-doggy': doggyTitle,
    'cfg-msg-master-title': masterTitle, 'cfg-msg-doggy-title': doggyTitle,
    'label-tz-master-type': `${masterTitle} 时区设置`, 'label-tz-doggy-type': `${doggyTitle} 时区设置`,
    'label-tz-master-iana': `${masterTitle} 所在时区`, 'label-tz-doggy-iana': `${doggyTitle} 所在时区`,
    'label-tz-master-offset': `${masterTitle} 时差`, 'label-tz-doggy-offset': `${doggyTitle} 时差`,
    'label-goal-master-sleep': `${masterTitle}休息目标`, 'label-goal-master-wake': `${masterTitle}起床目标`,
    'label-goal-doggy-sleep': `${doggyTitle}睡觉目标`, 'label-goal-doggy-wake': `${doggyTitle}起床目标`,
    'label-nt-master-sleep': `${masterTitle} - 休息提醒`, 'label-nt-master-wake': `${masterTitle} - 起床提醒`,
    'label-nt-doggy-sleep': `${doggyTitle} - 睡觉提醒`, 'label-nt-doggy-wake': `${doggyTitle} - 起床提醒`
  };
  for (const [id, text] of Object.entries(idsToUpdate)) {
    const el = document.getElementById(id); if (el) el.textContent = text;
  }
  
  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const dIcon = document.getElementById('mode-icon-daily');
  const sIcon = document.getElementById('mode-icon-service');
  if (dIcon) dIcon.textContent = t.dailyModeIcon || '💕';
  if (sIcon) sIcon.textContent = t.serviceModeIcon || '🐕';
  
  updateIdentityLabels(); updateIdentityCards();
}

window.setMode = function(mode) {
  const next = mode === 'service' ? 'service' : 'daily';
  if (configs.mode === next) { updateModeCards(); return; }
  configs.mode = next;
  try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) { }
  applyConfigsToPage(); updateClocks(); render(); fillTextInputs(); updateColorInputs(); updateMsgCounts(); updateModeCards();
  showToast(next === 'service' ? '已切换到主仆版本 🌙' : '已切换到日常版本 ☀️', 'success');
};

function fillTextInputs() {
  const t = P().texts || DEFAULT_TEXTS_DAILY;
  document.getElementById('cfg-title').value = t.title || '';
  document.getElementById('cfg-subtitle').value = t.subtitle || '';
  document.getElementById('cfg-master-name').value = t.masterName || '';
  document.getElementById('cfg-master-tag').value = t.masterTag || '';
  document.getElementById('cfg-master-region').value = t.masterRegion || '';
  document.getElementById('cfg-doggy-name').value = t.doggyName || '';
  document.getElementById('cfg-doggy-tag').value = t.doggyTag || '';
  document.getElementById('cfg-doggy-region').value = t.doggyRegion || '';
  document.getElementById('cfg-master-sleep-btn').value = t.masterSleepBtn || '';
  document.getElementById('cfg-master-wake-btn').value = t.masterWakeBtn || '';
  document.getElementById('cfg-doggy-sleep-btn').value = t.doggySleepBtn || '';
  document.getElementById('cfg-doggy-wake-btn').value = t.doggyWakeBtn || '';
  
  document.getElementById('cfg-icon-daily').value = t.dailyModeIcon || '💕';
  document.getElementById('cfg-icon-service').value = t.serviceModeIcon || '🐕';
  
  const n = configs.notifySettings;
  document.getElementById('cfg-notify-overtime').checked = n.enableOvertime;
  document.getElementById('cfg-notify-interval').value = n.overtimeInterval;
  
  const nt = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;
  document.getElementById('cfg-nt-master-sleep').value = nt.master_sleep || '';
  document.getElementById('cfg-nt-master-wake').value = nt.master_wake || '';
  document.getElementById('cfg-nt-doggy-sleep').value = nt.doggy_sleep || '';
  document.getElementById('cfg-nt-doggy-wake').value = nt.doggy_wake || '';
  document.getElementById('cfg-nt-overtime-sleep').value = nt.overtime_sleep || '';
  document.getElementById('cfg-nt-overtime-wake').value = nt.overtime_wake || '';
}

function updateColorInputs() {
  const c = P().colors || DEFAULT_CONFIGS.profiles.daily.colors;
  document.getElementById('cfg-color-master').value = c.master || '#38bdf8';
  document.getElementById('cfg-color-doggy').value = c.doggy || '#f472b6';
}

let currentMsgKey = '';
const MSG_KEYS = ['master_sleep_success', 'master_sleep_late', 'master_wake_success', 'master_wake_late', 'doggy_sleep_success', 'doggy_sleep_late', 'doggy_wake_success', 'doggy_wake_late'];

function updateMsgCounts() {
  const pool = P().msgPool || {};
  MSG_KEYS.forEach(key => {
    const [user, type, status] = key.split('_');
    const arr = pool?.[user]?.[type]?.[status] || [];
    const el = document.getElementById(`cnt_${key}`);
    if (el) el.textContent = `${arr.length} 条`;
  });
}

window.openSubMsg = function(key, title) {
  currentMsgKey = key;
  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const name = key.startsWith('master') ? t.masterName : t.doggyName;
  document.getElementById('sub-modal-title').textContent = `${getPureName(name)} - ${title} (${modeLabel()})`;
  const [user, type, status] = key.split('_');
  const arr = (P().msgPool || {})?.[user]?.[type]?.[status] || [];
  const listEl = document.getElementById('sub-msg-list');
  listEl.innerHTML = '';
  arr.forEach(text => addSubMsgItem(text));
  document.getElementById('sub-modal').classList.add('show');
};

window.closeSubMsg = function() { document.getElementById('sub-modal').classList.remove('show'); };

window.addSubMsgItem = function(text = '') {
  const listEl = document.getElementById('sub-msg-list');
  const row = document.createElement('div');
  row.className = 'msg-item';
  const input = document.createElement('input');
  input.type = 'text'; input.value = text; input.placeholder = '输入一条新文案...';
  const delBtn = document.createElement('button');
  delBtn.className = 'btn-del'; delBtn.type = 'button'; delBtn.textContent = '✕'; delBtn.onclick = () => row.remove();
  row.appendChild(input); row.appendChild(delBtn); listEl.appendChild(row);
};

window.saveSubMsg = function() {
  const listEl = document.getElementById('sub-msg-list');
  const inputs = listEl.querySelectorAll('input');
  const newArr = Array.from(inputs).map(inp => inp.value.trim()).filter(v => v !== '');
  const [user, type, status] = currentMsgKey.split('_');
  const prof = P();
  if (!prof.msgPool) prof.msgPool = {};
  if (!prof.msgPool[user]) prof.msgPool[user] = {};
  if (!prof.msgPool[user][type]) prof.msgPool[user][type] = {};
  prof.msgPool[user][type][status] = newArr;
  updateMsgCounts(); closeSubMsg();
  try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) { }
  debounceSync();
};

window.openSettings = function() {
  try {
    fillTextInputs(); updateColorInputs(); updateMsgCounts(); updateModeCards();
    
    document.getElementById('cfg-simple-mode').checked = configs.simpleMode === true;
    document.getElementById('cfg-notifications').checked = configs.notifications === true;
    document.getElementById('cfg-anniversary').value = configs.anniversary;
    document.getElementById('cfg-show-history').checked = configs.showHistory === true;
    document.getElementById('cfg-show-logical-date').checked = configs.showLogicalDate !== false;

    document.getElementById('cfg-clock-layout').value = configs.clockLayout;
    document.getElementById('cfg-show-master-clock').checked = configs.showMasterClock;
    document.getElementById('cfg-show-doggy-clock').checked = configs.showDoggyClock;
    document.getElementById('cfg-show-seconds').checked = configs.showSeconds;
    document.getElementById('cfg-show-shichen').checked = configs.showShichen;
    document.getElementById('cfg-show-wellness').checked = configs.showWellness;

    document.getElementById('cfg-tz-master-type').value = configs.timeZones.master.type || 'iana';
    document.getElementById('cfg-tz-doggy-type').value = configs.timeZones.doggy.type || 'iana';
    if (configs.timeZones.master.type === 'offset') document.getElementById('cfg-tz-master-offset').value = configs.timeZones.master.value;
    else document.getElementById('cfg-tz-master-iana').value = configs.timeZones.master.value;
    if (configs.timeZones.doggy.type === 'offset') document.getElementById('cfg-tz-doggy-offset').value = configs.timeZones.doggy.value;
    else document.getElementById('cfg-tz-doggy-iana').value = configs.timeZones.doggy.value;
    toggleTzInput('master'); toggleTzInput('doggy');

    document.getElementById('cfg-goal-master-sleep').value = configs.goals.master.sleep;
    document.getElementById('cfg-goal-master-wake').value = configs.goals.master.wake;
    document.getElementById('cfg-goal-doggy-sleep').value = configs.goals.doggy.sleep;
    document.getElementById('cfg-goal-doggy-wake').value = configs.goals.doggy.wake;

    document.getElementById('cfg-history-type').value = configs.historyType;
    document.getElementById('cfg-history-days').value = String(configs.historyDays);

    let startYear = new Date().getFullYear();
    try { const y = new Date(configs.anniversary).getFullYear(); if (Number.isFinite(y)) startYear = y; } catch (e) { }
    const endYear = new Date().getFullYear() + 1;
    const yearSelect = document.getElementById('cfg-history-year');
    yearSelect.innerHTML = '';
    for (let y = startYear; y <= endYear; y++) yearSelect.innerHTML += `<option value="${y}">${y} 年</option>`;
    yearSelect.value = configs.historyYear;
    if (!yearSelect.value) yearSelect.selectedIndex = 0;

    const monthSelect = document.getElementById('cfg-history-month');
    monthSelect.innerHTML = '';
    for (let m = 1; m <= 12; m++) monthSelect.innerHTML += `<option value="${String(m).padStart(2,'0')}">${m} 月</option>`;
    monthSelect.value = configs.historyMonth;
    if (!monthSelect.value) monthSelect.selectedIndex = 0;

    toggleHistoryTypeOptions();

    const fixDateInput = document.getElementById('cfg-fix-date');
    if (!fixDateInput.value) fixDateInput.value = getLogicalDateStr();
    renderFixPanel();

    document.getElementById('gh-user').value = ghConfig.user || '';
    document.getElementById('gh-repo').value = ghConfig.repo || '';
    document.getElementById('gh-path').value = ghConfig.path || 'data/records.json';
    document.getElementById('gh-token').value = ghConfig.token || '';

    updateNotifyStatus(); updateIdentityCards();

    document.getElementById('settings-modal').classList.add('show');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab-btn').classList.add('active');
    document.getElementById('tab-general').classList.add('active');
  } catch(e) { showToast('打开设置面板失败', 'late'); }
};

window.closeSettings = function() { document.getElementById('settings-modal').classList.remove('show'); };

function applyConfigsToPage() {
  try {
    const t = P().texts || DEFAULT_TEXTS_DAILY;
    document.title = t.title || '';
    document.getElementById('display-title').textContent = t.title || '';
    document.getElementById('display-subtitle').textContent = t.subtitle || '';

    const masterNameEl = document.getElementById('display-master-name');
    const masterTagEl = document.getElementById('display-master-tag');
    const doggyNameEl = document.getElementById('display-doggy-name');
    const doggyTagEl = document.getElementById('display-doggy-tag');

    if (t.masterName) { masterNameEl.style.display = 'flex'; masterNameEl.textContent = t.masterName; } else masterNameEl.style.display = 'none';
    if (t.masterTag) { masterTagEl.style.display = 'block'; masterTagEl.textContent = t.masterTag; } else masterTagEl.style.display = 'none';
    if (t.doggyName) { doggyNameEl.style.display = 'flex'; doggyNameEl.textContent = t.doggyName; } else doggyNameEl.style.display = 'none';
    if (t.doggyTag) { doggyTagEl.style.display = 'block'; doggyTagEl.textContent = t.doggyTag; } else doggyTagEl.style.display = 'none';

    document.getElementById('display-master-sleep-btn').textContent = t.masterSleepBtn || '休息';
    document.getElementById('display-master-wake-btn').textContent = t.masterWakeBtn || '起床';
    document.getElementById('display-doggy-sleep-btn').textContent = t.doggySleepBtn || '睡觉';
    document.getElementById('display-doggy-wake-btn').textContent = t.doggyWakeBtn || '起床';

    const masterPure = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生');
    const doggyPure = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');
    
    document.getElementById('legend-master-text').textContent = masterPure + '满勤';
    document.getElementById('legend-doggy-text').textContent = doggyPure + '满勤';

    document.getElementById('master-city-text').textContent = `📍 ${masterPure}${t.masterRegion ? ` (${t.masterRegion})` : ''}`;
    document.getElementById('doggy-city-text').textContent = `📍 ${doggyPure}${t.doggyRegion ? ` (${t.doggyRegion})` : ''}`;

    const gm = configs.goals?.master || DEFAULT_CONFIGS.goals.master;
    const gd = configs.goals?.doggy || DEFAULT_CONFIGS.goals.doggy;
    document.getElementById('master-goal-text').textContent = `目标: ${gm.sleep || '--:--'} / ${gm.wake || '--:--'}`;
    document.getElementById('doggy-goal-text').textContent = `目标: ${gd.sleep || '--:--'} / ${gd.wake || '--:--'}`;

    const logicalDateEl = document.getElementById('logical-date-display');
    if (configs.showLogicalDate) {
      logicalDateEl.style.display = 'inline-block';
    } else {
      logicalDateEl.style.display = 'none';
    }

    document.body.classList.toggle('simple-mode', configs.simpleMode);
    applyColors(); updateIdentityLabels(); updateModeCards(); applyIdentity();
  } catch(e) { console.warn('应用配置异常', e); }
}

function applyColors() {
  const colors = P().colors || DEFAULT_CONFIGS.profiles.daily.colors;
  document.documentElement.style.setProperty('--master-color', colors.master);
  document.documentElement.style.setProperty('--doggy-color', colors.doggy);
}

function renderFixPanel() {
  const dateStr = document.getElementById('cfg-fix-date').value;
  const panel = document.getElementById('fix-panel');
  if (!dateStr) { panel.innerHTML = ''; return; }

  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const masterShort = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生');
  const doggyShort = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');

  const types = [
    { user: 'master', type: 'sleep', label: `${masterShort}休息` }, { user: 'master', type: 'wake', label: `${masterShort}起床` },
    { user: 'doggy', type: 'sleep', label: `${doggyShort}睡觉` }, { user: 'doggy', type: 'wake', label: `${doggyShort}起床` }
  ];

  panel.innerHTML = '';
  types.forEach(item => {
    const rec = db[item.user]?.[dateStr]?.[item.type];
    let stateText = '未打卡', cls = '';
    if (rec && rec.done) {
      if (rec.ontime) { stateText = `按时 (${rec.time || '手动'})`; cls = 'active'; }
      else { stateText = `迟到 (${rec.time || '手动'})`; cls = 'late'; }
    }
    const btn = document.createElement('button');
    btn.className = `fix-btn ${cls}`;
    btn.textContent = `${item.label}: ${stateText}`;
    btn.onclick = () => {
      if (!db[item.user]) db[item.user] = {};
      if (!db[item.user][dateStr]) db[item.user][dateStr] = {};
      let cur = db[item.user][dateStr][item.type];
      if (!cur || !cur.done) db[item.user][dateStr][item.type] = { done: true, time: '补卡', ontime: true };
      else if (cur.ontime) db[item.user][dateStr][item.type] = { done: true, time: '补卡', ontime: false };
      else { delete db[item.user][dateStr][item.type]; if (Object.keys(db[item.user][dateStr]).length === 0) delete db[item.user][dateStr]; }
      saveLocalData(); renderFixPanel();
    };
    panel.appendChild(btn);
  });
}

window.saveSettings = function() {
  try {
    const prof = P();
    prof.texts = {
      title: document.getElementById('cfg-title').value.trim(),
      subtitle: document.getElementById('cfg-subtitle').value.trim(),
      masterName: document.getElementById('cfg-master-name').value.trim(),
      masterTag: document.getElementById('cfg-master-tag').value.trim(),
      masterRegion: document.getElementById('cfg-master-region').value.trim(),
      doggyName: document.getElementById('cfg-doggy-name').value.trim(),
      doggyTag: document.getElementById('cfg-doggy-tag').value.trim(),
      doggyRegion: document.getElementById('cfg-doggy-region').value.trim(),
      masterSleepBtn: document.getElementById('cfg-master-sleep-btn').value.trim() || (configs.mode === 'service' ? '主人休息' : '先生休息'),
      masterWakeBtn: document.getElementById('cfg-master-wake-btn').value.trim() || (configs.mode === 'service' ? '主人起床' : '先生起床'),
      doggySleepBtn: document.getElementById('cfg-doggy-sleep-btn').value.trim() || (configs.mode === 'service' ? '小狗睡觉' : '宝宝睡觉'),
      doggyWakeBtn: document.getElementById('cfg-doggy-wake-btn').value.trim() || (configs.mode === 'service' ? '小狗起床' : '宝宝起床'),
      dailyModeIcon: document.getElementById('cfg-icon-daily').value.trim() || '💕',
      serviceModeIcon: document.getElementById('cfg-icon-service').value.trim() || '🐕'
    };
    prof.colors = {
      master: document.getElementById('cfg-color-master').value || '#38bdf8',
      doggy: document.getElementById('cfg-color-doggy').value || '#f472b6'
    };

    const readTimeInput = (id, fallback) => {
      const v = document.getElementById(id).value;
      return /^\d{2}:\d{2}$/.test(v) ? v : fallback;
    };
    const prevGoals = configs.goals;
    configs.goals = {
      master: { sleep: readTimeInput('cfg-goal-master-sleep', prevGoals.master.sleep), wake: readTimeInput('cfg-goal-master-wake', prevGoals.master.wake) },
      doggy: { sleep: readTimeInput('cfg-goal-doggy-sleep', prevGoals.doggy.sleep), wake: readTimeInput('cfg-goal-doggy-wake', prevGoals.doggy.wake) }
    };

    configs.timeZones.master = {
      type: document.getElementById('cfg-tz-master-type').value,
      value: document.getElementById('cfg-tz-master-type').value === 'iana' ? document.getElementById('cfg-tz-master-iana').value : (document.getElementById('cfg-tz-master-offset').value || '0')
    };
    configs.timeZones.doggy = {
      type: document.getElementById('cfg-tz-doggy-type').value,
      value: document.getElementById('cfg-tz-doggy-type').value === 'iana' ? document.getElementById('cfg-tz-doggy-iana').value : (document.getElementById('cfg-tz-doggy-offset').value || '0')
    };

    configs.notifySettings.enableOvertime = document.getElementById('cfg-notify-overtime').checked;
    const intv = parseInt(document.getElementById('cfg-notify-interval').value, 10);
    configs.notifySettings.overtimeInterval = Number.isFinite(intv) && intv >= 10 ? intv : 30;
    
    prof.notifyTexts = {
      master_sleep: document.getElementById('cfg-nt-master-sleep').value.trim(),
      master_wake: document.getElementById('cfg-nt-master-wake').value.trim(),
      doggy_sleep: document.getElementById('cfg-nt-doggy-sleep').value.trim(),
      doggy_wake: document.getElementById('cfg-nt-doggy-wake').value.trim(),
      overtime_sleep: document.getElementById('cfg-nt-overtime-sleep').value.trim(),
      overtime_wake: document.getElementById('cfg-nt-overtime-wake').value.trim()
    };

    configs.simpleMode = document.getElementById('cfg-simple-mode').checked === true;
    configs.showHistory = document.getElementById('cfg-show-history').checked === true;
    configs.showLogicalDate = document.getElementById('cfg-show-logical-date').checked === true;

    configs.clockLayout = document.getElementById('cfg-clock-layout').value;
    configs.showMasterClock = document.getElementById('cfg-show-master-clock').checked;
    configs.showDoggyClock = document.getElementById('cfg-show-doggy-clock').checked;
    configs.showSeconds = document.getElementById('cfg-show-seconds').checked;
    configs.showShichen = document.getElementById('cfg-show-shichen').checked;
    configs.showWellness = document.getElementById('cfg-show-wellness').checked;

    const wantNotify = document.getElementById('cfg-notifications').checked === true;
    if (wantNotify) {
      if (!notificationSupported()) {
        configs.notifications = false; showToast('当前浏览器不支持系统通知', 'late');
      } else if (Notification.permission === 'granted') {
        configs.notifications = true;
      } else if (Notification.permission === 'denied') {
        configs.notifications = false; showToast('通知权限已被浏览器拒绝', 'late');
      } else {
        configs.notifications = true;
        Notification.requestPermission().then(p => {
          if (p === 'granted') { configs.notifications = true; showToast('通知已开启 🔔', 'success'); }
          else { configs.notifications = false; showToast('通知权限被拒绝', 'late'); }
          try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {}
          updateNotifyStatus();
        });
      }
    } else {
      configs.notifications = false;
    }

    configs.anniversary = document.getElementById('cfg-anniversary').value || configs.anniversary || DEFAULT_CONFIGS.anniversary;
    configs.historyType = document.getElementById('cfg-history-type').value === 'month' ? 'month' : 'days';
    const hd = parseInt(document.getElementById('cfg-history-days').value, 10);
    configs.historyDays = [7, 30, 90, 365].includes(hd) ? hd : 30;
    configs.historyYear = document.getElementById('cfg-history-year').value || configs.historyYear;
    configs.historyMonth = document.getElementById('cfg-history-month').value || configs.historyMonth;

    configs.configVersion = 7;
    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) { showToast('保存失败', 'late'); }

    ghConfig = {
      user: document.getElementById('gh-user').value.trim(),
      repo: document.getElementById('gh-repo').value.trim(),
      path: document.getElementById('gh-path').value.trim() || 'data/records.json',
      token: document.getElementById('gh-token').value.trim()
    };
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(ghConfig)); } catch (e) { }

    applyConfigsToPage(); updateClocks(); render(); updateNotifyStatus();
    showToast('设置已保存！💗', 'success');
    closeSettings(); debounceSync();
  } catch (e) {
    showToast('保存时发生错误', 'late');
  }
};

// ================= 导入导出 & 同步 =================
const CONFIG_KEY = 'dawn-duo-gh-config';
let ghConfig = { user: '', repo: '', path: 'data/records.json', token: '' };
try { ghConfig = Object.assign(ghConfig, JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}); } catch (e) { }

function getSyncableData() {
  const syncableConfig = JSON.parse(JSON.stringify(configs));
  
  delete syncableConfig.mode;
  delete syncableConfig.simpleMode;
  delete syncableConfig.notifications;
  delete syncableConfig.showLogicalDate;
  delete syncableConfig.clockLayout;
  delete syncableConfig.showMasterClock;
  delete syncableConfig.showDoggyClock;
  delete syncableConfig.showSeconds;
  delete syncableConfig.showShichen;
  delete syncableConfig.showWellness;
  
  return { db: db, config: syncableConfig };
}

function applySyncData(payload) {
  try {
    if (payload.master || payload.doggy) {
      db = payload;
    } else if (payload.db) {
      db = payload.db || { master: {}, doggy: {} };
      if (payload.config) {
        const localMode = configs.mode;
        const localSimple = configs.simpleMode;
        const localNotify = configs.notifications;
        const localLogicalDate = configs.showLogicalDate;
        const localClockLayout = configs.clockLayout;
        const localShowMasterClock = configs.showMasterClock;
        const localShowDoggyClock = configs.showDoggyClock;
        const localShowSeconds = configs.showSeconds;
        const localShowShichen = configs.showShichen;
        const localShowWellness = configs.showWellness;

        configs = deepMerge(DEFAULT_CONFIGS, payload.config); 
        
        configs.mode = localMode;
        configs.simpleMode = localSimple;
        configs.notifications = localNotify;
        configs.showLogicalDate = localLogicalDate;
        configs.clockLayout = localClockLayout;
        configs.showMasterClock = localShowMasterClock;
        configs.showDoggyClock = localShowDoggyClock;
        configs.showSeconds = localShowSeconds;
        configs.showShichen = localShowShichen;
        configs.showWellness = localShowWellness;
        configs.configVersion = 7;
      }
    }
    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) { }
    saveLocalData(); 
  } catch(e) { console.warn('同步数据应用异常', e); }
}

window.exportJSON = function() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "records.json");
  document.body.appendChild(dlAnchorElem); dlAnchorElem.click(); document.body.removeChild(dlAnchorElem);
  showToast('JSON 导出成功', 'success');
};

window.importData = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.master || data.doggy) db = data;
      else if (data.db) db = data.db;
      else throw new Error('无效的数据格式');
      saveLocalData(); closeSettings(); showToast('数据导入成功！', 'success');
    } catch (err) { showToast('导入失败: ' + err.message, 'late'); }
  };
  reader.readAsText(file);
  event.target.value = '';
};

window.clearLocalData = function() {
  if (confirm('⚠️ 确定要清除本机所有打卡记录吗？\n\n此操作不可逆！')) {
    localStorage.removeItem('dawn-duo-data');
    localStorage.removeItem('dawn-duo-notify-log');
    db = { master: {}, doggy: {} }; notifyLog = {};
    render(); showToast('本机数据已清空。', 'late'); closeSettings(); debounceSync();
  }
};

function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = ''; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(binary);
}
function decodeBase64Utf8(b64) {
  const binary = atob(String(b64).replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

let syncTimer = null;
function debounceSync() {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { autoSyncToGitHub(); }, 2500);
}

async function autoSyncToGitHub() {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
  try {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${ghConfig.path}`;
    let sha = null;
    const getRes = await fetch(url, { headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (getRes.ok) sha = (await getRes.json()).sha;
    const payload = getSyncableData();
    const base64Content = encodeBase64Utf8(JSON.stringify(payload, null, 2));
    await fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '🐾 自动更新契约数据', content: base64Content, sha: sha || undefined })
    });
  } catch (e) { console.warn('自动同步失败', e); }
}

async function autoPullOnLoad() {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
  try {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${ghConfig.path}`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (res.ok) {
      const data = await res.json();
      const payload = JSON.parse(decodeBase64Utf8(data.content));
      applySyncData(payload);
      showToast('已自动同步云端数据 📥', 'success');
    }
  } catch (e) { console.warn('自动拉取失败', e); }
}

window.syncFromGitHub = async function() {
  if (!confirm('⚠️ 确认要拉取云端数据吗？\n\n将覆盖当前本机的打卡记录和文案配置。')) return;
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
  try {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${ghConfig.path}`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (res.ok) {
      const data = await res.json();
      const payload = JSON.parse(decodeBase64Utf8(data.content));
      applySyncData(payload); showToast('拉取成功。📥', 'success'); closeSettings();
    } else showToast('拉取失败，检查权限或网络。', 'late');
  } catch (e) { showToast('网络错误: ' + e.message, 'late'); }
};

window.saveToGitHub = async function() {
  if (!confirm('⚠️ 确认要推送并覆盖云端数据吗？')) return;
  saveSettings();
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
  try {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${ghConfig.path}`;
    let sha = null;
    const getRes = await fetch(url, { headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (getRes.ok) sha = (await getRes.json()).sha;
    const payload = getSyncableData();
    const base64Content = encodeBase64Utf8(JSON.stringify(payload, null, 2));
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '🐾 手动更新契约数据', content: base64Content, sha: sha || undefined })
    });
    if (putRes.ok) { showToast('⬆️ 数据已成功上传。', 'success'); closeSettings(); }
    else showToast('上传失败，检查Token权限。', 'late');
  } catch (e) { showToast('网络错误: ' + e.message, 'late'); }
};

// ================= 启动 =================
try {
  const local = localStorage.getItem('dawn-duo-data');
  if (local) {
    const parsed = JSON.parse(local);
    db.master = parsed.master || {}; db.doggy = parsed.doggy || parsed.dog || {};
  }
} catch (e) { db = { master: {}, doggy: {} }; }

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
autoPullOnLoad();