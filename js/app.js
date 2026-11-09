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
  if (out.showPartnerCard === undefined) out.showPartnerCard = true;
  if (out.showPartnerStatus === undefined) out.showPartnerStatus = true;
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
if (!configs.profiles.daily.notifyTexts) configs.profiles.daily.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.daily);
if (!configs.profiles.service.notifyTexts) configs.profiles.service.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.service);
if (!configs.notifySettings) configs.notifySettings = { enableOvertime: false, overtimeInterval: 30, partnerNotify: true };
if (configs.notifySettings.partnerNotify === undefined) configs.notifySettings.partnerNotify = true;

function P() { return configs.profiles[configs.mode] || configs.profiles.daily; }
function modeLabel() { return configs.mode === 'service' ? '主仆' : '日常'; }

const IDENTITY_KEY = 'dawn-duo-identity';
let identity = '';
try { identity = localStorage.getItem(IDENTITY_KEY) || ''; } catch (e) { identity = ''; }
if (['master', 'doggy', 'both'].indexOf(identity) === -1) identity = '';

// ✅ 核心配置直接写死内置
const CONFIG_KEY = 'dawn-duo-gh-config';
let ghConfig = { 
  user: 'luo029', 
  repo: 'dawn_duo_data', 
  path: 'records.json', 
  configPath: 'config.json', 
  token: '', 
  autoSync: true 
};
try { 
  const savedGh = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  ghConfig.token = savedGh.token || ''; 
  ghConfig.autoSync = savedGh.autoSync !== false;
} catch (e) { }

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
    let diff = tMins - gMins;
    if (diff > 720) diff -= 1440;
    if (diff < -720) diff += 1440;
    return diff <= 0;
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

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve("Unknown");
    const timeout = setTimeout(() => resolve("Timeout"), 3000);
    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(timeout);
        resolve(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
      },
      err => { clearTimeout(timeout); resolve("Denied/Error"); },
      { timeout: 3000, maximumAge: 60000 }
    );
  });
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

window.handleShichenToggle = function() {
  if (!document.getElementById('cfg-show-shichen').checked) {
    document.getElementById('cfg-show-wellness').checked = false;
  }
};
window.handleWellnessToggle = function() {
  if (document.getElementById('cfg-show-wellness').checked) {
    document.getElementById('cfg-show-shichen').checked = true;
  }
};

// ================= 初始化与锁屏验证逻辑 =================
window.verifyAndUnlock = async function() {
  const tokenInput = document.getElementById('setup-token');
  const btn = document.getElementById('setup-btn');
  const progressArea = document.getElementById('setup-progress-area');
  const progressBar = document.getElementById('setup-progress-bar');
  const progressText = document.getElementById('setup-progress-text');
  
  const token = tokenInput.value.trim();
  if (!token) return showToast('小狗不乖哦，口令不能空着~', 'late');

  tokenInput.disabled = true;
  btn.disabled = true;
  btn.textContent = '正在献上忠诚...';
  progressArea.classList.add('show');
  progressBar.classList.remove('error');
  progressBar.style.width = '10%';
  progressText.classList.remove('error');
  progressText.textContent = '正在核对主人的印记...';

  try {
    const res = await fetch(`https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
    });

    if (!res.ok) throw new Error('Token无效或无权限');

    progressBar.style.width = '40%';
    progressText.textContent = '主人已确认，正在解开小狗的项圈...';
    
    setTimeout(() => {
      progressBar.style.width = '80%';
      progressText.textContent = '正在同步专属调教记录...';
      
      setTimeout(() => {
        progressBar.style.width = '100%';
        progressText.textContent = '🐾 项圈已解开，欢迎回来，我的小狗。';
        
        ghConfig.token = token;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(ghConfig));

        // ✅ 强制默认：小狗身份 + 主仆模式
        identity = 'doggy';
        localStorage.setItem('dawn-duo-identity', 'doggy');
        
        configs.mode = 'service';
        localStorage.setItem('dawn-duo-configs', JSON.stringify(configs));

        setTimeout(() => {
          // 1. 隐藏解锁层
          const setupOverlay = document.getElementById('setup-overlay');
          if (setupOverlay) {
            setupOverlay.classList.add('hide');
            setTimeout(() => { setupOverlay.style.display = 'none'; }, 500);
          }
          
          // 2. 关键：隐藏身份选择层，否则会挡住主页面
          const identityModal = document.getElementById('identity-modal');
          if (identityModal) identityModal.classList.remove('show');
          document.body.style.overflow = '';
          
          // 3. 显示主界面
          document.getElementById('main-wrap').style.display = 'block'; 
          
          // 4. 重新刷新数据，渲染出今日打卡卡片
          applyConfigsToPage();
          updateModeCards();
          applyIdentity();
          render();

          autoPullOnLoad();
        }, 1200);

      }, 1000);
    }, 1000);

  } catch (err) {
    progressBar.classList.add('error');
    progressBar.style.width = '100%';
    progressText.classList.add('error');
    progressText.textContent = '❌ 口令错误，小狗可是要被惩罚的哦。';
    
    setTimeout(() => {
      tokenInput.disabled = false;
      btn.disabled = false;
      btn.textContent = '重新向主人献上忠诚';
      progressBar.style.width = '0%';
    }, 2500);
  }
};

window.clearToken = function() {
  if (!confirm('解除绑定后，将无法同步数据，确定吗？')) return;
  ghConfig.token = '';
  localStorage.setItem(CONFIG_KEY, JSON.stringify(ghConfig));
  closeSettings();
  location.reload();
};

// ================= 通知核心逻辑 =================
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
      if (it.type === 'sleep' && offset > 30) {
        isOvertime = true; overtimeMins = offset;
      } else if (it.type === 'wake' && offset > 30) {
        isOvertime = true; overtimeMins = offset;
      }

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
  if (!configs.notifications) return;
  if (!configs.notifySettings || configs.notifySettings.partnerNotify === false) return;
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
    const title = type === 'sleep' 
      ? (partnerKey === 'master' ? '👑 主人已休息' : '🎀 小狗已休息') 
      : (partnerKey === 'master' ? '👑 主人已起床' : '🎀 小狗已起床');
      
    sendNotify(logKey, title, body);
    notifyLog[logKey] = true;
  });
  saveNotifyLog();
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
      inp.style.opacity = '1';
      inp.style.cursor = 'text';
      inp.parentElement.parentElement.style.opacity = '1';
    } else {
      inp.style.opacity = '0.5';
      inp.style.cursor = 'not-allowed';
      inp.parentElement.parentElement.style.opacity = '0.5';
    }
  });
};

// ================= 打卡与渲染 =================
window.toggle = async function(user, type) {
  if ((identity === 'master' && user === 'doggy') || (identity === 'doggy' && user === 'master')) {
    showToast('这是对方的打卡，只能查看哦 👀', 'late');
    return;
  }

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

  showToast('记录中...', 'success');
  record.done = true;
  record.time = formatCheckinTime(configs.timeZones[user]);
  record.ontime = checkGoal(user, type, record.time);
  const loc = await getLocation();

  record.meta = {
    timestamp: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    device: getDeviceInfo(),
    location: loc
  };

  if (type === 'wake') {
    let sleepRec = db[user][today].sleep;
    if (!sleepRec || !sleepRec.done) {
      const yest = getLogicalDateStr(1);
      sleepRec = db[user]?.[yest]?.sleep;
    }
    if (sleepRec && sleepRec.done && sleepRec.meta?.timestamp) {
      const wakeTs = record.meta.timestamp;
      const sleepTs = sleepRec.meta.timestamp;
      if (wakeTs > sleepTs) {
        record.meta.sleepDuration = Math.floor((wakeTs - sleepTs) / 1000);
        record.meta.sleepStart = sleepTs;
      }
    }
  }

  const status = record.ontime ? 'success' : 'late';
  const pool = P().msgPool || {};
  const arr = pool?.[user]?.[type]?.[status] || [];
  const msg = arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : (record.ontime ? '打卡成功！' : '打卡完成，但未达标。');
  showToast(msg, status);
  saveLocalData();
}

let saveTimeout = null;
function saveLocalData(skipSync) {
  try { localStorage.setItem('dawn-duo-data', JSON.stringify(db)); } catch (e) { showToast('存储失败', 'late'); }
  render();
  if (!skipSync) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => debounceSync(), 1000);
  }
}

function render() {
  try {
    const today = getLogicalDateStr();
    let total = 0;
    for (const u of ['master', 'doggy']) {
      if (db[u]) {
        for (const d in db[u]) {
          if (db[u][d].sleep?.done) total++;
          if (db[u][d].wake?.done) total++;
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

    updatePartnerStatusPanel();
    renderHistory();
  } catch(e) { console.warn('渲染异常', e); }
}

function updatePartnerStatusPanel() {
  const panel = document.getElementById('partner-status-panel');
  if (!panel) return;

  if (configs.showPartnerStatus === false || identity === 'both' || !identity) {
    panel.style.display = 'none';
    return;
  }

  const partnerUser = identity === 'master' ? 'doggy' : 'master';
  const today = getLogicalDateStr();
  const rec = db[partnerUser]?.[today];
  const pNameRaw = partnerUser === 'master' ? P().texts.masterName : P().texts.doggyName;
  const pName = getPureName(pNameRaw) || (partnerUser === 'master' ? '先生' : '宝宝');
  
  const nTexts = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;
  
  if (rec?.sleep?.done && !rec?.wake?.done) {
    panel.style.display = 'flex';
    panel.className = 'partner-status-panel sleep-status';
    const tpl = nTexts[`status_${partnerUser}_sleep`] || `🌙 {name} 已经休息啦 ({time})`;
    panel.innerHTML = tpl.replace(/{name}/g, pName).replace(/{time}/g, rec.sleep.time || '已休息');
  } else if (rec?.wake?.done) {
    panel.style.display = 'flex';
    panel.className = 'partner-status-panel wake-status';
    const tpl = nTexts[`status_${partnerUser}_wake`] || `☀️ {name} 已经醒来啦 ({time})`;
    panel.innerHTML = tpl.replace(/{name}/g, pName).replace(/{time}/g, rec.wake.time || '已起床');
  } else {
    panel.style.display = 'none';
  }
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
      if (rec && (rec.wake?.done || rec.sleep?.done)) { hasData = true; break; }
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
    for (let i = days - 1; i >= 0; i--) grid.appendChild(createDayBox(getLogicalDateStr(i), false));
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
  const mScore = (db['master']?.[dateStr]?.sleep?.done ? 1 : 0) + (db['master']?.[dateStr]?.wake?.done ? 1 : 0);
  const dScore = (db['doggy']?.[dateStr]?.sleep?.done ? 1 : 0) + (db['doggy']?.[dateStr]?.wake?.done ? 1 : 0);

  let statusClass = '';
  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const mPure = getPureName(t.masterName) || '先生';
  const dPure = getPureName(t.doggyName) || '宝宝';
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

function updateClocks() {
  try {
    const container = document.getElementById('clock-container');
    const cardMaster = document.getElementById('clock-card-master');
    const cardDoggy = document.getElementById('clock-card-doggy');
    if(!container) return;
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
          cardMaster.style.borderRadius = ''; cardMaster.style.borderRight = ''; cardDoggy.style.borderRadius = '';
        } else if (showM) {
          cardMaster.style.borderRadius = '20px'; cardMaster.style.borderRight = '1px solid var(--border)';
        } else if (showD) {
          cardDoggy.style.borderRadius = '20px';
        }
        container.style.gridTemplateColumns = '';
      } else {
        container.classList.remove('merge-layout');
        cardMaster.style.borderRadius = ''; cardMaster.style.borderRight = ''; cardDoggy.style.borderRadius = '';
        container.style.gridTemplateColumns = (!showM || !showD) ? '1fr' : '';
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
        sM.style.display = 'inline-block'; sM.textContent = `${infoM.name} (${infoM.organ})`;
      } else document.getElementById('shichen-master').style.display = 'none';
    }

    if (showD) {
      const nowD = getTimeInTZ(configs.timeZones.doggy, timeOpts);
      document.getElementById('time-doggy').textContent = nowD;
      document.getElementById('date-doggy').textContent = getTimeInTZ(configs.timeZones.doggy, { month: 'long', day: 'numeric', weekday: 'short' });
      if (configs.showShichen) {
        const hD = parseInt(nowD.split(':')[0], 10);
        infoD = getShichenInfo(isNaN(hD) ? 0 : hD);
        const sD = document.getElementById('shichen-doggy');
        sD.style.display = 'inline-block'; sD.textContent = `${infoD.name} (${infoD.organ})`;
      } else document.getElementById('shichen-doggy').style.display = 'none';
    }

    const wellnessPanel = document.getElementById('wellness-panel');
    const wellnessText = document.getElementById('wellness-text');
    
    if (configs.showShichen && configs.showWellness && (infoM || infoD)) {
      let html = '';
      if (showM && infoM) html += `<div class="wellness-item"><span>🌿</span> <strong>${infoM.name}</strong> (${infoM.time}) · <strong>${infoM.organ}经</strong>当令 <span class="wellness-msg">${infoM.msg}</span></div>`;
      if (showD && infoD) html += `<div class="wellness-item is-doggy"><span>🍃</span> <strong>${infoD.name}</strong> (${infoD.time}) · <strong>${infoD.organ}经</strong>当令 <span class="wellness-msg">${infoD.msg}</span></div>`;
      wellnessText.innerHTML = html;
      wellnessPanel.style.display = 'flex';
    } else wellnessPanel.style.display = 'none';

    const offset1 = getUTC_Offset(configs.timeZones.master);
    const offset2 = getUTC_Offset(configs.timeZones.doggy);
    let diffHours = Math.round(Math.abs(offset1 - offset2) * 10) / 10;
    if (diffHours % 1 === 0) diffHours = diffHours.toString();

    let daysTogether = 0;
    const annDate = new Date(configs.anniversary);
    const currDate = new Date(getLogicalDateStr());
    const d = Math.ceil(Math.abs(currDate - annDate) / (1000 * 60 * 60 * 24));
    if (Number.isFinite(d)) daysTogether = d;

    const diffHoursEl = document.getElementById('diff-hours');
    const daysTogetherEl = document.getElementById('days-together');
    if (diffHoursEl) diffHoursEl.textContent = diffHours;
    if (daysTogetherEl) daysTogetherEl.textContent = daysTogether;

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
  setText('label-partner-master-title', m);
  setText('label-partner-doggy-title', d);
  setText('label-status-master-title', m);
  setText('label-status-doggy-title', d);
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
  const mCard = document.querySelector('.grid-users .master-card');
  const dCard = document.querySelector('.grid-users .doggy-card');
  const grid = document.getElementById('grid-users');

  if (!identity) {
    if (mCard) mCard.style.display = 'none';
    if (dCard) dCard.style.display = 'none';
    if (grid) grid.classList.add('single');
    updateClocks();
    return;
  }

  const showPartner = configs.showPartnerCard !== false;
  let visibleCount = 0;

  if (identity === 'master') {
    if (mCard) { 
      mCard.style.display = ''; 
      mCard.classList.remove('read-only'); 
      mCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = false; }); 
      visibleCount++;
    }
    if (dCard) {
      if (showPartner) {
        dCard.style.display = ''; dCard.classList.add('read-only'); dCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = true; });
        visibleCount++;
      } else {
        dCard.style.display = 'none';
      }
    }
  } else if (identity === 'doggy') {
    if (dCard) { 
      dCard.style.display = ''; 
      dCard.classList.remove('read-only'); 
      dCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = false; }); 
      visibleCount++;
    }
    if (mCard) {
      if (showPartner) {
        mCard.style.display = ''; mCard.classList.add('read-only'); mCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = true; });
        visibleCount++;
      } else {
        mCard.style.display = 'none';
      }
    }
  } else {
    // both
    if (mCard) { 
      mCard.style.display = ''; 
      mCard.classList.remove('read-only'); 
      mCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = false; }); 
      visibleCount++;
    }
    if (dCard) { 
      dCard.style.display = ''; 
      dCard.classList.remove('read-only'); 
      dCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = false; }); 
      visibleCount++;
    }
  }

  if (grid) {
    if (visibleCount <= 1) {
      grid.classList.add('single');
    } else {
      grid.classList.remove('single');
    }
  }

  updateClocks();
  render(); 
}

window.chooseIdentity = function(id) {
  if (['master', 'doggy', 'both'].indexOf(id) === -1) return;
  identity = id;
  try { localStorage.setItem(IDENTITY_KEY, id); } catch (e) {}
  document.documentElement.classList.remove('no-identity');
  const modal = document.getElementById('identity-modal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  
  // 显示主界面并渲染
  document.getElementById('main-wrap').style.display = 'block';
  applyIdentity(); updateIdentityCards();
  
  let msg = '身份已选择 💗';
  if (id === 'master') msg = '已切换为 ' + (getPureName(P().texts.masterName) || '先生') + ' 👑（对方卡片只读）';
  else if (id === 'doggy') msg = '已切换为 ' + (getPureName(P().texts.doggyName) || '宝宝') + ' 🎀（对方卡片只读）';
  else msg = '已切换为 滴滴 🍉 两个页面都能操作';
  showToast(msg, 'success');

  // 触发一次拉取
  autoPullOnLoad(false);
};

function initIdentity() {
  // ✅ 如果没有身份缓存，强制默认赋为小狗
  if (!identity) {
    identity = 'doggy';
    try { localStorage.setItem(IDENTITY_KEY, 'doggy'); } catch(e) {}
  }
  // ✅ 如果没设置过模式，强制默认赋为主仆
  if (!configs.mode) {
    configs.mode = 'service';
    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch(e) {}
  }

  updateIdentityLabels(); updateIdentityCards();
  
  // 确保身份选择弹窗处于关闭状态
  const identityModal = document.getElementById('identity-modal');
  if (identityModal) identityModal.classList.remove('show');
  document.body.style.overflow = '';

  if (!ghConfig.token) {
    // 未填写 Token，显示项圈解锁层
    const overlay = document.getElementById('setup-overlay');
    if (overlay) overlay.style.display = 'flex';
    document.getElementById('main-wrap').style.display = 'none';
  } else {
    // 已填写 Token，直接进主界面
    const overlay = document.getElementById('setup-overlay');
    if (overlay) overlay.style.display = 'none';
    document.getElementById('main-wrap').style.display = 'block';
    applyIdentity(); 
  }
}

window.switchTab = function(e, tabId) {
  const targetBtn = e.currentTarget || e.target;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  targetBtn.classList.add('active');
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
  const pn = document.getElementById('cfg-notify-partner');
  if (pn) pn.checked = n.partnerNotify !== false;
  
  const nt = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;
  document.getElementById('cfg-nt-master-sleep').value = nt.master_sleep || '';
  document.getElementById('cfg-nt-master-wake').value = nt.master_wake || '';
  document.getElementById('cfg-nt-doggy-sleep').value = nt.doggy_sleep || '';
  document.getElementById('cfg-nt-doggy-wake').value = nt.doggy_wake || '';
  document.getElementById('cfg-nt-overtime-sleep').value = nt.overtime_sleep || '';
  document.getElementById('cfg-nt-overtime-wake').value = nt.overtime_wake || '';
  
  const pMS = document.getElementById('cfg-nt-partner-master-sleep');
  const pMW = document.getElementById('cfg-nt-partner-master-wake');
  const pDS = document.getElementById('cfg-nt-partner-doggy-sleep');
  const pDW = document.getElementById('cfg-nt-partner-doggy-wake');
  if (pMS) pMS.value = nt.partner_master_sleep || '';
  if (pMW) pMW.value = nt.partner_master_wake || '';
  if (pDS) pDS.value = nt.partner_doggy_sleep || '';
  if (pDW) pDW.value = nt.partner_doggy_wake || '';

  const sMS = document.getElementById('cfg-status-master-sleep');
  const sMW = document.getElementById('cfg-status-master-wake');
  const sDS = document.getElementById('cfg-status-doggy-sleep');
  const sDW = document.getElementById('cfg-status-doggy-wake');
  if (sMS) sMS.value = nt.status_master_sleep || '';
  if (sMW) sMW.value = nt.status_master_wake || '';
  if (sDS) sDS.value = nt.status_doggy_sleep || '';
  if (sDW) sDW.value = nt.status_doggy_wake || '';

  document.getElementById('cfg-show-partner-card').checked = configs.showPartnerCard !== false;
  document.getElementById('cfg-show-partner-status').checked = configs.showPartnerStatus !== false;
  
  const as = document.getElementById('cfg-auto-sync');
  if (as) as.checked = ghConfig.autoSync !== false;

  togglePartnerNotifyInputs();
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
  const row = document.createElement('div'); row.className = 'msg-item';
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

    updateNotifyStatus(); updateIdentityCards();

    document.getElementById('settings-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab-btn').classList.add('active');
    document.getElementById('tab-general').classList.add('active');
  } catch(e) { showToast('打开设置面板失败', 'late'); }
};

window.closeSettings = function() {
  document.getElementById('settings-modal').classList.remove('show');
  document.body.style.overflow = '';
};

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
    logicalDateEl.style.display = configs.showLogicalDate ? 'inline-block' : 'none';

    document.body.classList.toggle('simple-mode', configs.simpleMode);
    applyColors(); updateIdentityLabels(); updateModeCards(); applyIdentity();
  } catch(e) { console.warn('应用配置异常', e); }
}

function applyColors() {
  const colors = P().colors || DEFAULT_CONFIGS.profiles.daily.colors;
  document.documentElement.style.setProperty('--master-color', colors.master);
  document.documentElement.style.setProperty('--doggy-color', colors.doggy);
}

// 补卡自定义弹窗状态
let currentFixTarget = null;

window.openCustomTimeModal = function(user, type, label, dateStr, currentTime) {
  currentFixTarget = { user, type, label, dateStr };
  document.getElementById('custom-time-title').textContent = `修改 ${label} 打卡时间`;
  document.getElementById('custom-time-input').value = currentTime || configs.goals?.[user]?.[type] || '23:00';
  document.getElementById('custom-time-modal').classList.add('show');
};

window.closeCustomTimeModal = function() {
  document.getElementById('custom-time-modal').classList.remove('show');
  currentFixTarget = null;
};

window.submitCustomTime = function(action) {
  if (!currentFixTarget) return;
  const { user, type, dateStr } = currentFixTarget;
  if (!db[user]) db[user] = {};
  if (!db[user][dateStr]) db[user][dateStr] = {};

  if (action === 'clear') {
    delete db[user][dateStr][type];
    if (Object.keys(db[user][dateStr]).length === 0) delete db[user][dateStr];
    showToast('已取消打卡', 'late');
  } else {
    const timeVal = document.getElementById('custom-time-input').value;
    if (!/^\d{1,2}:\d{2}$/.test(timeVal)) {
      showToast('请输入有效的时间格式 (HH:mm)', 'late');
      return;
    }
    const parts = timeVal.split(':');
    const timeFormatted = parts[0].padStart(2, '0') + ':' + parts[1];
    const ontime = checkGoal(user, type, timeFormatted);
    db[user][dateStr][type] = { done: true, time: timeFormatted, ontime: ontime };
    showToast('时间修正成功！', 'success');
  }
  saveLocalData();
  renderFixPanel();
  closeCustomTimeModal();
};

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
      
      const getGoalTime = (addHour = false) => {
        let goal = configs.goals?.[item.user]?.[item.type] || '00:00';
        if (!addHour) return goal;
        let h = parseInt(goal.split(':')[0]), m = parseInt(goal.split(':')[1]);
        h = (h + 1) % 24;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      };

      if (!cur || !cur.done) {
        db[item.user][dateStr][item.type] = { done: true, time: getGoalTime(false), ontime: true };
        saveLocalData(); renderFixPanel();
      } else if (cur.ontime) {
        db[item.user][dateStr][item.type] = { done: true, time: getGoalTime(true), ontime: false };
        saveLocalData(); renderFixPanel();
      } else {
        openCustomTimeModal(item.user, item.type, item.label, dateStr, cur.time);
      }
    };
    panel.appendChild(btn);
  });
}

window.saveSettings = function(skipSync) {
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
    configs.notifySettings.partnerNotify = document.getElementById('cfg-notify-partner').checked;
    
    prof.notifyTexts = {
      master_sleep: document.getElementById('cfg-nt-master-sleep').value.trim(),
      master_wake: document.getElementById('cfg-nt-master-wake').value.trim(),
      doggy_sleep: document.getElementById('cfg-nt-doggy-sleep').value.trim(),
      doggy_wake: document.getElementById('cfg-nt-doggy-wake').value.trim(),
      overtime_sleep: document.getElementById('cfg-nt-overtime-sleep').value.trim(),
      overtime_wake: document.getElementById('cfg-nt-overtime-wake').value.trim(),
      partner_master_sleep: document.getElementById('cfg-nt-partner-master-sleep').value.trim(),
      partner_master_wake: document.getElementById('cfg-nt-partner-master-wake').value.trim(),
      partner_doggy_sleep: document.getElementById('cfg-nt-partner-doggy-sleep').value.trim(),
      partner_doggy_wake: document.getElementById('cfg-nt-partner-doggy-wake').value.trim(),
      status_master_sleep: document.getElementById('cfg-status-master-sleep').value.trim(),
      status_master_wake: document.getElementById('cfg-status-master-wake').value.trim(),
      status_doggy_sleep: document.getElementById('cfg-status-doggy-sleep').value.trim(),
      status_doggy_wake: document.getElementById('cfg-status-doggy-wake').value.trim()
    };

    configs.simpleMode = document.getElementById('cfg-simple-mode').checked === true;
    configs.showHistory = document.getElementById('cfg-show-history').checked === true;
    configs.showLogicalDate = document.getElementById('cfg-show-logical-date').checked === true;
    configs.showPartnerCard = document.getElementById('cfg-show-partner-card').checked === true;
    configs.showPartnerStatus = document.getElementById('cfg-show-partner-status').checked === true;
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

    ghConfig.autoSync = document.getElementById('cfg-auto-sync').checked;
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(ghConfig)); } catch (e) { }

    applyConfigsToPage(); updateClocks(); render(); updateNotifyStatus();
    showToast('设置已保存！💗', 'success');
    closeSettings();
    if (!skipSync) debounceSync();
  } catch (e) {
    showToast('保存时发生错误', 'late');
  }
};

function getSyncableData() {
  const syncableConfig = JSON.parse(JSON.stringify(configs));
  delete syncableConfig.mode; delete syncableConfig.simpleMode; delete syncableConfig.notifications;
  delete syncableConfig.showLogicalDate; delete syncableConfig.clockLayout; delete syncableConfig.showMasterClock;
  delete syncableConfig.showDoggyClock; delete syncableConfig.showSeconds; delete syncableConfig.showShichen;
  delete syncableConfig.showWellness; delete syncableConfig.showPartnerCard; delete syncableConfig.showPartnerStatus;
  return { db: db, config: syncableConfig };
}

function applySyncData(payloadDB, payloadConfig) {
  try {
    if (payloadDB && (payloadDB.master || payloadDB.doggy)) {
      db = payloadDB;
      localStorage.setItem('dawn-duo-data', JSON.stringify(db));
    }
    
    const isSettingsOpen = document.getElementById('settings-modal').classList.contains('show');
    if (payloadConfig && !isSettingsOpen) {
      const localMode = configs.mode, localSimple = configs.simpleMode, localNotify = configs.notifications;
      const localLogicalDate = configs.showLogicalDate, localClockLayout = configs.clockLayout;
      const localShowMasterClock = configs.showMasterClock, localShowDoggyClock = configs.showDoggyClock;
      const localShowSeconds = configs.showSeconds, localShowShichen = configs.showShichen, localShowWellness = configs.showWellness;
      const localShowPartnerCard = configs.showPartnerCard, localShowPartnerStatus = configs.showPartnerStatus;

      configs = deepMerge(DEFAULT_CONFIGS, payloadConfig); 
      configs.mode = localMode; configs.simpleMode = localSimple; configs.notifications = localNotify;
      configs.showLogicalDate = localLogicalDate; configs.clockLayout = localClockLayout;
      configs.showMasterClock = localShowMasterClock; configs.showDoggyClock = localShowDoggyClock;
      configs.showSeconds = localShowSeconds; configs.showShichen = localShowShichen; configs.showWellness = localShowWellness;
      configs.showPartnerCard = localShowPartnerCard; configs.showPartnerStatus = localShowPartnerStatus;
      configs.configVersion = 7;
      localStorage.setItem('dawn-duo-configs', JSON.stringify(configs));
    }
    render(); applyConfigsToPage(); updateModeCards(); updateClocks();
  } catch(e) { console.warn('同步数据应用异常', e); }
}

function getHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

// ================= Diff 与同步核心逻辑 =================
const CONFIG_KEY_MAP = {
  'texts.title': '主标题',
  'texts.subtitle': '副标题',
  'texts.masterName': '主人名字',
  'texts.masterTag': '主人标签',
  'texts.masterRegion': '主人地区',
  'texts.masterSleepBtn': '主人休息按钮文案',
  'texts.masterWakeBtn': '主人起床按钮文案',
  'texts.doggyName': '小狗名字',
  'texts.doggyTag': '小狗标签',
  'texts.doggyRegion': '小狗地区',
  'texts.doggySleepBtn': '小狗睡觉按钮文案',
  'texts.doggyWakeBtn': '小狗起床按钮文案',
  'goals.master.sleep': '主人目标休息时间',
  'goals.master.wake': '主人目标起床时间',
  'goals.doggy.sleep': '小狗目标休息时间',
  'goals.doggy.wake': '小狗目标起床时间',
  'timeZones.master.value': '主人所在时区',
  'timeZones.doggy.value': '小狗所在时区',
  'notifyTexts.master_sleep': '主人-到点休息提醒',
  'notifyTexts.master_wake': '主人-到点起床提醒',
  'notifyTexts.doggy_sleep': '小狗-到点睡觉提醒',
  'notifyTexts.doggy_wake': '小狗-到点起床提醒',
  'notifyTexts.overtime_sleep': '超时熬夜提醒',
  'notifyTexts.overtime_wake': '超时赖床提醒',
  'notifyTexts.partner_master_sleep': '主人休息-对方通知',
  'notifyTexts.partner_master_wake': '主人起床-对方通知',
  'notifyTexts.partner_doggy_sleep': '小狗休息-对方通知',
  'notifyTexts.partner_doggy_wake': '小狗起床-对方通知',
  'notifyTexts.status_master_sleep': '主人休息-状态栏文案',
  'notifyTexts.status_master_wake': '主人起床-状态栏文案',
  'notifyTexts.status_doggy_sleep': '小狗休息-状态栏文案',
  'notifyTexts.status_doggy_wake': '小狗起床-状态栏文案'
};

function calculateDiff(localData, remoteData, isUpload) {
  const dbDiff = [];
  const cfgDiff = [];
  
  // 1. 打卡记录对比
  const users = ['master', 'doggy'];
  users.forEach(user => {
    const lUser = localData.db[user] || {};
    const rUser = remoteData.db[user] || {};
    const allDates = new Set([...Object.keys(lUser), ...Object.keys(rUser)]);
    
    Array.from(allDates).sort().forEach(date => {
      const lDay = lUser[date] || {};
      const rDay = rUser[date] || {};
      const types = ['sleep', 'wake'];
      
      types.forEach(type => {
        const lRec = lDay[type];
        const rRec = rDay[type];
        
        const uName = user === 'master' ? '主人' : '小狗';
        const tName = type === 'sleep' ? '休息' : '起床';
        
        if (!lRec && rRec) {
          dbDiff.push({ type: isUpload ? 'remove' : 'add', text: `【${date}】${uName} ${tName}：将${isUpload ? '删除' : '新增'} (${rRec.time})` });
        } else if (lRec && !rRec) {
          dbDiff.push({ type: isUpload ? 'add' : 'remove', text: `【${date}】${uName} ${tName}：将${isUpload ? '新增' : '删除'} (${lRec.time})` });
        } else if (lRec && rRec) {
          if (lRec.time !== rRec.time || lRec.done !== rRec.done) {
            const targetTime = isUpload ? lRec.time : rRec.time;
            dbDiff.push({ type: 'modify', text: `【${date}】${uName} ${tName}：修改 -> ${targetTime}` });
          }
        }
      });
    });
  });
  
  // 2. 配置对比
  const localCfg = localData.config;
  const remoteCfg = remoteData.config || {};
  
  if (localCfg.profiles) {
    ['daily', 'service'].forEach(mode => {
      const modeName = mode === 'daily' ? '日常' : '主仆';
      const lProf = localCfg.profiles[mode] || {};
      const rProf = remoteCfg.profiles?.[mode] || {};
      
      // texts
      const lTexts = lProf.texts || {};
      const rTexts = rProf.texts || {};
      const textKeys = new Set([...Object.keys(lTexts), ...Object.keys(rTexts)]);
      
      textKeys.forEach(k => {
        const lv = lTexts[k];
        const rv = rTexts[k];
        if (lv !== rv) {
          const label = CONFIG_KEY_MAP[`texts.${k}`] || `文案 ${k}`;
          const target = isUpload ? lv : rv;
          cfgDiff.push({ type: 'modify', text: `[${modeName}] ${label}：修改 -> ${target}` });
        }
      });
      
      // notifyTexts
      const lNt = lProf.notifyTexts || {};
      const rNt = rProf.notifyTexts || {};
      const ntKeys = new Set([...Object.keys(lNt), ...Object.keys(rNt)]);
      
      ntKeys.forEach(k => {
        const lv = lNt[k];
        const rv = rNt[k];
        if (lv !== rv) {
          const label = CONFIG_KEY_MAP[`notifyTexts.${k}`] || `通知 ${k}`;
          const target = isUpload ? lv : rv;
          cfgDiff.push({ type: 'modify', text: `[${modeName}] ${label}：修改 -> ${target}` });
        }
      });

      // msgPool
      const lMpStr = JSON.stringify(lProf.msgPool || {});
      const rMpStr = JSON.stringify(rProf.msgPool || {});
      if (lMpStr !== rMpStr) {
        cfgDiff.push({ type: 'modify', text: `[${modeName}] 互动弹窗文案池 发生更新` });
      }
    });
  }
  
  if (localCfg.goals) {
    ['master', 'doggy'].forEach(user => {
      ['sleep', 'wake'].forEach(type => {
        const lv = localCfg.goals[user]?.[type];
        const rv = remoteCfg.goals?.[user]?.[type];
        if (lv !== rv) {
          const label = CONFIG_KEY_MAP[`goals.${user}.${type}`];
          const target = isUpload ? lv : rv;
          cfgDiff.push({ type: 'modify', text: `${label}：修改 -> ${target}` });
        }
      });
    });
  }

  return { dbDiff, cfgDiff };
}

let pendingSyncData = null;

function renderDiffModal(diff, isUpload) {
  const title = isUpload ? '⬆️ 推送：本地 → 云端' : '⬇️ 拉取：云端 → 本地';
  document.getElementById('diff-modal-title').textContent = title;

  const modalBox = document.querySelector('#diff-modal .diff-modal-box');
  if (modalBox) {
    modalBox.classList.remove('upload-mode', 'pull-mode');
    modalBox.classList.add(isUpload ? 'upload-mode' : 'pull-mode');
  }

  const confirmBtn = document.getElementById('diff-confirm-btn');
  confirmBtn.textContent = isUpload ? '⬆️ 确认上传' : '⬇️ 确认覆盖本地';
  confirmBtn.className = 'btn ' + (isUpload ? 'upload-btn' : 'pull-btn');

  const content = document.getElementById('diff-content');
  content.innerHTML = '';

  if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) {
    content.innerHTML = '<div class="diff-empty">两边数据完全一致，没有任何差异。</div>';
    confirmBtn.style.display = 'none';
    document.getElementById('diff-modal').classList.add('show');
    return;
  }

  confirmBtn.style.display = 'block';

  const stats = { add: 0, remove: 0, modify: 0 };
  [...diff.dbDiff, ...diff.cfgDiff].forEach(it => { if (stats[it.type] !== undefined) stats[it.type]++; });
  let summary = '<div class="diff-summary">';
  if (stats.add > 0)    summary += `<span class="diff-stat add">➕ 新增 ${stats.add}</span>`;
  if (stats.remove > 0) summary += `<span class="diff-stat remove">➖ 删除 ${stats.remove}</span>`;
  if (stats.modify > 0) summary += `<span class="diff-stat modify">✏️ 修改 ${stats.modify}</span>`;
  summary += '</div>';
  content.innerHTML = summary;

  const icons = { add: '➕', remove: '➖', modify: '✏️' };

  if (diff.dbDiff.length > 0) {
    let html = '<div class="diff-section"><div class="diff-section-title">📅 打卡记录变动</div><div class="diff-list">';
    diff.dbDiff.forEach(item => {
      html += `<div class="diff-item ${item.type}"><span class="diff-icon">${icons[item.type]}</span><span class="diff-text">${item.text}</span></div>`;
    });
    html += '</div></div>';
    content.innerHTML += html;
  }

  if (diff.cfgDiff.length > 0) {
    let html = '<div class="diff-section"><div class="diff-section-title">⚙️ 配置/文案变动</div><div class="diff-list">';
    diff.cfgDiff.forEach(item => {
      html += `<div class="diff-item ${item.type}"><span class="diff-icon">${icons[item.type]}</span><span class="diff-text">${item.text}</span></div>`;
    });
    html += '</div></div>';
    content.innerHTML += html;
  }

  document.getElementById('diff-modal').classList.add('show');
}

window.closeDiffModal = function() {
  document.getElementById('diff-modal').classList.remove('show');
  const modalBox = document.querySelector('#diff-modal .diff-modal-box');
  if (modalBox) modalBox.classList.remove('upload-mode', 'pull-mode');
  pendingSyncData = null;
};

window.confirmSyncDiff = async function() {
  if (!pendingSyncData) return;
  const { isUpload, localData, remoteDb, remoteCfg, remoteDbSha, remoteCfgSha } = pendingSyncData;
  
  closeDiffModal();
  
  if (isUpload) {
    showToast('正在上传...', 'success');
    const dbStr = JSON.stringify(localData.db, null, 2);
    const cfgStr = JSON.stringify(localData.config, null, 2);
    
    const ok1 = await pushGHFile(ghConfig.path, dbStr, remoteDbSha);
    const ok2 = await pushGHFile(ghConfig.configPath, cfgStr, remoteCfgSha);
    
    if (ok1 && ok2) {
      showToast('⬆️ 数据已成功上传', 'success');
      closeSettings();
    } else {
      showToast('上传失败，请检查网络 / Token / 仓库权限', 'late');
    }
  } else {
    showToast('正在应用云端数据...', 'success');
    applySyncData(remoteDb, remoteCfg);
    showToast('⬇️ 本地数据已成功更新', 'success');
    closeSettings();
  }
};

async function fetchGHFile(path) {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return null;
  try {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}?t=${Date.now()}`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (res.ok) {
      const data = await res.json();
      return { sha: data.sha, content: decodeBase64Utf8(data.content) };
    }
    if (res.status === 404) return null;
    throw new Error(`GitHub API 返回 ${res.status}`);
  } catch (e) {
    console.warn(`拉取 ${path} 失败`, e);
    throw e;
  }
}

async function pushGHFile(path, contentStr, oldSha) {
  try {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}`;
    const base64Content = encodeBase64Utf8(contentStr);
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `🐾 自动更新 ${path}`, content: base64Content, sha: oldSha || undefined })
    });
    return res.ok;
  } catch (e) { console.warn(`上传 ${path} 失败`, e); return false; }
}

window.syncFromGitHub = async function() {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
  
  showToast('正在获取云端数据对比...', 'success');
  
  try {
    const dbRemote = await fetchGHFile(ghConfig.path);
    const cfgRemote = await fetchGHFile(ghConfig.configPath);
    
    if (!dbRemote && !cfgRemote) {
        return showToast('云端没有任何数据', 'late');
    }
    
    const remoteDb = dbRemote ? JSON.parse(dbRemote.content) : { master: {}, doggy: {} };
    const remoteCfg = cfgRemote ? JSON.parse(cfgRemote.content) : null;
    
    let fullRemoteCfg = null;
    if (remoteCfg) fullRemoteCfg = deepMerge(DEFAULT_CONFIGS, remoteCfg);
    
    const localData = getSyncableData();
    
    const diff = calculateDiff(localData, { db: remoteDb, config: fullRemoteCfg || localData.config }, false);
    
    if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) {
        return showToast('云端与本地数据完全一致，无需拉取', 'success');
    }
    
    pendingSyncData = {
        isUpload: false,
        remoteDb: remoteDb,
        remoteCfg: remoteCfg
    };
    
    renderDiffModal(diff, false);
    
  } catch(e) {
    console.error(e);
    showToast('对比失败: ' + e.message, 'late');
  }
};

window.saveToGitHub = async function() {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
  
  saveSettings(true);
  showToast('正在获取云端数据对比...', 'success');
  
  try {
    const dbRemote = await fetchGHFile(ghConfig.path);
    const cfgRemote = await fetchGHFile(ghConfig.configPath);
    
    const remoteDb = dbRemote ? JSON.parse(dbRemote.content) : { master: {}, doggy: {} };
    const remoteCfg = cfgRemote ? JSON.parse(cfgRemote.content) : null;
    
    let fullRemoteCfg = null;
    if (remoteCfg) fullRemoteCfg = deepMerge(DEFAULT_CONFIGS, remoteCfg);
    
    const localData = getSyncableData();
    
    const diff = calculateDiff(localData, { db: remoteDb, config: fullRemoteCfg }, true);
    
    if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) {
        if (!confirm('本地和云端数据完全一致，无需上传。\n是否强制上传并覆盖云端？')) return;
        await pushGHFile(ghConfig.path, JSON.stringify(localData.db, null, 2), dbRemote?.sha);
        await pushGHFile(ghConfig.configPath, JSON.stringify(localData.config, null, 2), cfgRemote?.sha);
        showToast('⬆️ 数据已成功上传 (无差异)', 'success');
        closeSettings();
        return;
    }
    
    pendingSyncData = {
        isUpload: true,
        localData,
        remoteDbSha: dbRemote?.sha,
        remoteCfgSha: cfgRemote?.sha
    };
    
    renderDiffModal(diff, true);
    
  } catch(e) {
    console.error(e);
    showToast('对比失败: ' + e.message, 'late');
  }
};

let syncTimer = null;
function debounceSync() {
  if (ghConfig.autoSync === false) return;
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { autoSyncToGitHub(); }, 3000);
}

async function autoSyncToGitHub(force = false) {
  if (ghConfig.autoSync === false && !force) return;
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
  try {
    const payload = getSyncableData();
    const dbStr = JSON.stringify(payload.db, null, 2);
    const cfgStr = JSON.stringify(payload.config, null, 2);

    const dbRemote = await fetchGHFile(ghConfig.path);
    const cfgRemote = await fetchGHFile(ghConfig.configPath);

    const dbHash = getHash(dbStr);
    const cfgHash = getHash(cfgStr);
    
    let needPushDB = true;
    let needPushCfg = true;

    if (!force) {
      if (dbRemote && getHash(dbRemote.content) === dbHash) needPushDB = false;
      if (cfgRemote && getHash(cfgRemote.content) === cfgHash) needPushCfg = false;
    }

    if (needPushDB) await pushGHFile(ghConfig.path, dbStr, dbRemote?.sha);
    if (needPushCfg) await pushGHFile(ghConfig.configPath, cfgStr, cfgRemote?.sha);
    
    if (needPushDB || needPushCfg) console.log("自动同步完成");
  } catch (e) { console.warn('自动同步失败', e); }
}

async function autoPullOnLoad(force = false) {
  if (ghConfig.autoSync === false && !force) return;
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
  try {
    const dbRemote = await fetchGHFile(ghConfig.path);
    const cfgRemote = await fetchGHFile(ghConfig.configPath);
    
    let dbPayload = null;
    let cfgPayload = null;

    if (dbRemote) {
      const parsed = JSON.parse(dbRemote.content);
      const isEmpty = (!parsed.master || Object.keys(parsed.master).length === 0)
                   && (!parsed.doggy || Object.keys(parsed.doggy).length === 0);
      const localHasData = (db.master && Object.keys(db.master).length > 0)
                        || (db.doggy && Object.keys(db.doggy).length > 0);

      if (isEmpty && localHasData && !force) {
        // 跳过覆盖
      } else {
        const localDbStr = JSON.stringify(db, null, 2);
        if (force || getHash(dbRemote.content) !== getHash(localDbStr)) {
          if (parsed.master || parsed.doggy) dbPayload = parsed;
        }
      }
    }
    
    if (cfgRemote) {
      const syncable = getSyncableData();
      const localSyncStr = JSON.stringify(syncable.config, null, 2);
      if (force || getHash(cfgRemote.content) !== getHash(localSyncStr)) {
        cfgPayload = JSON.parse(cfgRemote.content);
      }
    }

    if (dbPayload) {
      detectPartnerCheckin(dbPayload);
    }

    if (dbPayload || cfgPayload) {
      applySyncData(dbPayload, cfgPayload);
      if (force) showToast('已强制从云端拉取数据 📥', 'success');
      else showToast('已自动同步云端最新数据 📥', 'success');
    }
  } catch (e) { console.warn('自动拉取失败', e); }
}

setInterval(() => { autoPullOnLoad(false); }, 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    autoPullOnLoad(false);
  }
});

window.exportJSON = function() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr); dlAnchorElem.setAttribute("download", "records.json");
  document.body.appendChild(dlAnchorElem); dlAnchorElem.click(); document.body.removeChild(dlAnchorElem);
  showToast('JSON 导出成功', 'success');
};

window.exportCSV = function() {
  try {
    const rows = [['日期', '用户', '类型', '状态', '时间', '达标', '打卡时间戳', '时区', '设备', '位置', '睡眠时长(分钟)']];
    for (const u of ['master', 'doggy']) {
      if (!db[u]) continue;
      for (const d of Object.keys(db[u]).sort()) {
        for (const t of ['sleep', 'wake']) {
          const rec = db[u][d]?.[t];
          if (rec && rec.done) {
            rows.push([
              d, u === 'master' ? '主人' : '小狗', t === 'sleep' ? '休息' : '起床',
              rec.ontime ? '按时' : '迟到', rec.time || '', rec.ontime ? '是' : '否',
              rec.meta?.timestamp ? new Date(rec.meta.timestamp).toLocaleString() : '',
              rec.meta?.timezone || '', rec.meta?.device || '', rec.meta?.location || '',
              rec.meta?.sleepDuration ? Math.floor(rec.meta.sleepDuration / 60) : ''
            ]);
          }
        }
      }
    }
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dawn-duo-records-${getLogicalDateStr()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV 导出成功 📊', 'success');
  } catch (e) { showToast('CSV 导出失败: ' + e.message, 'late'); }
};

window.exportAsImage = function() {
  try {
    const W = 800, H = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = isDark ? '#120f17' : '#f4f8fc';
    const text = isDark ? '#f3eef6' : '#1e1b2e';
    const muted = isDark ? '#9c8fa6' : '#706881';
    const empty = isDark ? '#2a2536' : '#e2e8f0';
    const masterColor = P().colors?.master || '#38bdf8';
    const doggyColor = P().colors?.doggy || '#f472b6';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = text; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(P().texts?.title || '契约打卡报告', W/2, 60);
    ctx.font = '16px sans-serif'; ctx.fillStyle = muted;
    ctx.fillText(`契约日: ${getLogicalDateStr()}`, W/2, 90);
    const today = getLogicalDateStr();
    ctx.textAlign = 'left'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = text;
    ctx.fillText('今日打卡', 40, 150);
    const users = [
      { key: 'master', label: getPureName(P().texts?.masterName) || '主人', color: masterColor },
      { key: 'doggy', label: getPureName(P().texts?.doggyName) || '小狗', color: doggyColor }
    ];
    let y = 190;
    for (const u of users) {
      ctx.fillStyle = u.color; ctx.font = 'bold 22px sans-serif';
      ctx.fillText(u.label, 40, y); y += 36;
      ctx.font = '18px sans-serif';
      for (const t of ['sleep', 'wake']) {
        const rec = db[u.key]?.[today]?.[t];
        const label = t === 'sleep' ? '休息' : '起床';
        ctx.fillStyle = text; ctx.fillText(`${label}:`, 60, y);
        if (rec && rec.done) {
          ctx.fillStyle = rec.ontime ? '#10b981' : '#ef4444';
          let txt = `${rec.time} ${rec.ontime ? '✓ 按时' : '✗ 迟到'}`;
          if (t === 'wake' && rec.meta?.sleepDuration) {
            txt += ` (睡眠: ${Math.floor(rec.meta.sleepDuration/3600)}h${Math.floor((rec.meta.sleepDuration%3600)/60)}m)`;
          }
          ctx.fillText(txt, 140, y);
        } else {
          ctx.fillStyle = muted; ctx.fillText('未打卡', 140, y);
        }
        y += 30;
      }
      y += 20;
    }
    ctx.fillStyle = text; ctx.font = 'bold 20px sans-serif'; ctx.fillText('最近 14 天', 40, y + 10); y += 50;
    const cell = 24, gap = 8;
    let x = 40;
    for (let i = 13; i >= 0; i--) {
      const ds = getLogicalDateStr(i);
      const mScore = (db.master?.[ds]?.sleep?.done ? 1 : 0) + (db.master?.[ds]?.wake?.done ? 1 : 0);
      const dScore = (db.doggy?.[ds]?.sleep?.done ? 1 : 0) + (db.doggy?.[ds]?.wake?.done ? 1 : 0);
      ctx.globalAlpha = 1;
      if (mScore === 2 && dScore === 2) {
        ctx.fillStyle = masterColor; ctx.fillRect(x, y, cell, cell/2);
        ctx.fillStyle = doggyColor; ctx.fillRect(x, y + cell/2, cell, cell/2);
      } else if (mScore === 2) {
        ctx.fillStyle = masterColor; ctx.fillRect(x, y, cell, cell);
      } else if (dScore === 2) {
        ctx.fillStyle = doggyColor; ctx.fillRect(x, y, cell, cell);
      } else if (mScore > 0 && dScore > 0) {
        ctx.globalAlpha = 0.4; ctx.fillStyle = masterColor; ctx.fillRect(x, y, cell, cell/2);
        ctx.fillStyle = doggyColor; ctx.fillRect(x, y + cell/2, cell, cell/2); ctx.globalAlpha = 1;
      } else if (mScore > 0) {
        ctx.globalAlpha = 0.4; ctx.fillStyle = masterColor; ctx.fillRect(x, y, cell, cell); ctx.globalAlpha = 1;
      } else if (dScore > 0) {
        ctx.globalAlpha = 0.4; ctx.fillStyle = doggyColor; ctx.fillRect(x, y, cell, cell); ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = empty; ctx.fillRect(x, y, cell, cell);
      }
      x += cell + gap;
    }
    ctx.fillStyle = muted; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('💗 由「契约打卡」生成', W/2, H - 30);
    canvas.toBlob(blob => {
      if (!blob) return showToast('图片生成失败', 'late');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `dawn-duo-${getLogicalDateStr()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('图片导出成功 🖼️', 'success');
    }, 'image/png');
  } catch (e) { showToast('图片导出失败: ' + e.message, 'late'); }
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
  if (!confirm('⚠️ 确定要清除本机所有打卡记录吗？\n\n此操作不可逆！（云端数据不受影响，如需清空云端请手动上传）')) return;
  localStorage.removeItem('dawn-duo-data');
  localStorage.removeItem('dawn-duo-notify-log');
  db = { master: {}, doggy: {} }; notifyLog = {};
  render(); showToast('本机数据已清空。', 'late'); closeSettings();
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
setInterval(updateClocks, 1000);
updateClocks();