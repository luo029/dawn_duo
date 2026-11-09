window.toggle = async function(user, type) {
  if ((identity === 'master' && user === 'doggy') || (identity === 'doggy' && user === 'master')) {
    showToast('这是对方的打卡，只能查看哦 👀', 'late'); return;
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
  
  // 异步获取位置，避免阻塞 UI
  record.meta = { timestamp: Date.now(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, device: getDeviceInfo(), location: "获取中..." };

  getLocation().then(loc => {
    if (record.meta) {
      record.meta.location = loc;
      saveLocalData(true); 
    }
  });

  if (type === 'wake') {
    let sleepRec = db[user][today].sleep;
    if (!sleepRec || !sleepRec.done) sleepRec = db[user]?.[getLogicalDateStr(1)]?.sleep;
    if (sleepRec && sleepRec.done && sleepRec.meta?.timestamp) {
      const wakeTs = record.meta.timestamp; const sleepTs = sleepRec.meta.timestamp;
      if (wakeTs > sleepTs) { record.meta.sleepDuration = Math.floor((wakeTs - sleepTs) / 1000); record.meta.sleepStart = sleepTs; }
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
      if (mScore > 0 || dScore > 0) streak++; else if (i > 0) break;
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
        } else timeLabel.textContent = '未打卡';
      });
    });
    updatePartnerStatusPanel();
    renderHistory();
  } catch(e) { console.warn('渲染异常', e); }
}

function updatePartnerStatusPanel() {
  const panel = document.getElementById('partner-status-panel');
  if (!panel) return;
  if (configs.showPartnerStatus === false || identity === 'both' || !identity) { panel.style.display = 'none'; return; }

  const partnerUser = identity === 'master' ? 'doggy' : 'master';
  const today = getLogicalDateStr();
  const rec = db[partnerUser]?.[today];
  const pNameRaw = partnerUser === 'master' ? P().texts.masterName : P().texts.doggyName;
  const pName = getPureName(pNameRaw) || (partnerUser === 'master' ? '先生' : '宝宝');
  const nTexts = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;
  
  if (rec?.sleep?.done && !rec?.wake?.done) {
    panel.style.display = 'flex'; panel.className = 'partner-status-panel sleep-status';
    const tpl = nTexts[`status_${partnerUser}_sleep`] || `🌙 {name} 已经休息啦 ({time})`;
    panel.innerHTML = tpl.replace(/{name}/g, pName).replace(/{time}/g, rec.sleep.time || '已休息');
  } else if (rec?.wake?.done) {
    panel.style.display = 'flex'; panel.className = 'partner-status-panel wake-status';
    const tpl = nTexts[`status_${partnerUser}_wake`] || `☀️ {name} 已经醒来啦 ({time})`;
    panel.innerHTML = tpl.replace(/{name}/g, pName).replace(/{time}/g, rec.wake.time || '已起床');
  } else panel.style.display = 'none';
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
    for (const d in db[u]) { if (db[u][d]?.wake?.done || db[u][d]?.sleep?.done) { hasData = true; break; } }
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