let currentSleepActionCtx = null;
window.closeSleepModal = function() { document.getElementById('sleep-action-modal').classList.remove('show'); currentSleepActionCtx = null; };
window.handleSleepAction = async function(action) {
  if (!currentSleepActionCtx) return;
  const { user, today, record } = currentSleepActionCtx; const yesterday = getLogicalDateStr(1); closeSleepModal();
  if (action === 'sub') { await doCheckin(user, 'sleep', today, record, 'sub'); } 
  else if (action === 'overwrite') { await doCheckin(user, 'sleep', today, record, 'main'); } 
  else if (action === 'cancel') {
    delete db[user][today].sleep;
    if (Object.keys(db[user][today]).length === 0) delete db[user][today];
    saveLocalData(); showToast('已取消打卡', 'late');
  } 
  else if (action === 'cross') {
    const todayRecs = record.records || [];
    if (todayRecs.length > 0) {
      if (!db[user][yesterday]) db[user][yesterday] = {};
      if (!db[user][yesterday].sleep) db[user][yesterday].sleep = { done: false, records: [] };
      let yRecord = db[user][yesterday].sleep;
      if (!yRecord.records) { yRecord.records = []; if (yRecord.done && yRecord.time) { yRecord.records.push({ time: yRecord.time, ontime: yRecord.ontime, timestamp: yRecord.meta?.timestamp || Date.now(), type: 'main' }); } }
      todayRecs.forEach(r => { yRecord.records.push(Object.assign({}, r, { type: 'sub' })); });
      const yMain = yRecord.records.find(r => r.type === 'main') || yRecord.records[0];
      yRecord.done = true; yRecord.time = yMain.time; yRecord.ontime = yMain.ontime; yRecord.meta = yMain.meta;
    }
    delete db[user][today].sleep;
    await doCheckin(user, 'sleep', today, null, 'main');
    showToast('已归入昨晚，并重新打卡', 'success');
  }
};
window.toggle = async function(user, type) {
  if ((identity === 'master' && user === 'doggy') || (identity === 'doggy' && user === 'master')) { showToast('这是对方的打卡，只能查看哦 👀', 'late'); return; }
  const today = getLogicalDateStr();
  if (!db[user]) db[user] = {};
  if (!db[user][today]) db[user][today] = {};
  let record = db[user][today][type];
  if (type === 'sleep' && record && record.done) {
    currentSleepActionCtx = { user, today, record };
    document.getElementById('sleep-modal-desc').textContent = `你今天已经在 ${record.time} 睡过了。要如何记录呢？`;
    document.getElementById('sleep-action-modal').classList.add('show');
    return;
  }
  if (type === 'wake' && record && record.done) {
    if (!confirm(`今日已打过【起床】卡（${record.time}）。\n\n👉 点击【确定】覆盖为当前时间。\n👉 点击【取消】保留原记录。`)) return;
    record.records = [];
  }
  await doCheckin(user, type, today, record, 'main');
};
async function doCheckin(user, type, dateStr, existingRecord, sleepType = 'main') {
  if (!db[user]) db[user] = {};
  if (!db[user][dateStr]) db[user][dateStr] = {};
  if (!db[user][dateStr][type]) db[user][dateStr][type] = { done: false, records: [] };
  const record = db[user][dateStr][type];
  if (!record.records) { record.records = []; if (record.done && record.time) { record.records.push({ time: record.time, ontime: record.ontime, timestamp: record.meta?.timestamp || Date.now(), type: 'main' }); } }
  const timeStr = formatCheckinTime(configs.timeZones[user]);
  const ontime = checkGoal(user, type, timeStr);
  const meta = { timestamp: Date.now(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, device: getDeviceInfo(), location: "获取中..." };
  const newRec = { time: timeStr, ontime: ontime, timestamp: meta.timestamp, meta: meta, type: sleepType };
  if (type === 'wake') { record.records = [newRec]; record.done = true; record.time = timeStr; record.ontime = ontime; record.meta = meta; }
  else {
    if (sleepType === 'main') { record.records = [newRec]; record.done = true; record.time = timeStr; record.ontime = ontime; record.meta = meta; } 
    else { record.records.push(newRec); if (record.records.length === 1) { record.done = true; record.time = timeStr; record.ontime = ontime; record.meta = meta; } }
  }
  getLocation().then(loc => { newRec.meta.location = loc; saveLocalData(true); });
  if (type === 'wake') {
    let sleepRec = db[user][dateStr].sleep;
    if (!sleepRec || !sleepRec.done) sleepRec = db[user]?.[getLogicalDateStr(1)]?.sleep;
    if (sleepRec && sleepRec.done && sleepRec.records) {
      const validSleeps = sleepRec.records.filter(r => r.timestamp && r.timestamp < newRec.timestamp);
      if (validSleeps.length > 0) { validSleeps.sort((a, b) => b.timestamp - a.timestamp); const closestSleep = validSleeps[0]; record.meta.sleepDuration = Math.floor((newRec.timestamp - closestSleep.timestamp) / 1000); record.meta.sleepStart = closestSleep.timestamp; }
    }
  }
  const status = record.ontime ? 'success' : 'late'; const pool = P().msgPool || {}; const arr = pool?.[user]?.[type]?.[status] || [];
  const msg = arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : (record.ontime ? '打卡成功！' : '打卡完成，但未达标。');
  showToast(msg, status); saveLocalData();
}
let saveTimeout = null;
function saveLocalData(skipSync) {
  try { localStorage.setItem('dawn-duo-data', JSON.stringify(db)); } catch (e) { showToast('存储失败', 'late'); }
  render();
  if (!skipSync) { if (saveTimeout) clearTimeout(saveTimeout); saveTimeout = setTimeout(() => debounceSync(), 1000); }
}
function render() {
  try {
    const today = getLogicalDateStr(); let total = 0;
    for (const u of ['master', 'doggy']) { if (db[u]) { for (const d in db[u]) { if (db[u][d].sleep?.done) total++; if (db[u][d].wake?.done) total++; } } }
    const elTotal = document.getElementById('stat-total'); if (elTotal) elTotal.textContent = total;
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = getLogicalDateStr(i);
      const mScore = (db.master?.[dateStr]?.sleep?.done ? 1 : 0) + (db.master?.[dateStr]?.wake?.done ? 1 : 0);
      const dScore = (db.doggy?.[dateStr]?.sleep?.done ? 1 : 0) + (db.doggy?.[dateStr]?.wake?.done ? 1 : 0);
      if (mScore > 0 || dScore > 0) streak++; else if (i > 0) break;
    }
    const elStreak = document.getElementById('stat-streak'); if (elStreak) elStreak.textContent = streak;
    ['master', 'doggy'].forEach(user => {
      ['sleep', 'wake'].forEach(type => {
        const btn = document.getElementById(`btn-${user}-${type}`), timeLabel = document.getElementById(`time-${user}-${type}`);
        if (!btn || !timeLabel) return;
        const record = db[user]?.[today]?.[type];
        btn.classList.remove('active', 'late');
        if (record && record.done) {
          btn.classList.add(record.ontime ? 'active' : 'late');
          let timeStr = record.time || '已打卡';
          if (type === 'sleep' && record.records && record.records.length > 1) timeStr += ` (共${record.records.length}次)`;
          timeLabel.textContent = timeStr;
        } else timeLabel.textContent = '未打卡';
      });
    });
    updatePartnerStatusPanel(); renderHistory();
  } catch(e) { console.warn('渲染异常', e); }
}
function updatePartnerStatusPanel() {
  const panel = document.getElementById('partner-status-panel'); if (!panel) return;
  if (configs.showPartnerStatus === false || identity === 'both' || !identity) { panel.style.display = 'none'; return; }
  const partnerUser = identity === 'master' ? 'doggy' : 'master'; const today = getLogicalDateStr(); const rec = db[partnerUser]?.[today];
  const pNameRaw = partnerUser === 'master' ? P().texts.masterName : P().texts.doggyName;
  const pName = getPureName(pNameRaw) || (partnerUser === 'master' ? '先生' : '宝宝');
  const nTexts = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;
  if (rec?.sleep?.done && !rec?.wake?.done) {
    panel.style.display = 'flex'; panel.className = 'partner-status-panel sleep-status';
    const tpl = getRandomText(nTexts[`status_${partnerUser}_sleep`] || `🌙 {name} 已经休息啦 ({time})`) || `🌙 {name} 已经休息啦 ({time})`;
    panel.innerHTML = tpl.replace(/{name}/g, pName).replace(/{time}/g, rec.sleep.time || '已休息');
  } else if (rec?.wake?.done) {
    panel.style.display = 'flex'; panel.className = 'partner-status-panel wake-status';
    const tpl = getRandomText(nTexts[`status_${partnerUser}_wake`] || `☀️ {name} 已经醒来啦 ({time})`) || `☀️ {name} 已经醒来啦 ({time})`;
    panel.innerHTML = tpl.replace(/{name}/g, pName).replace(/{time}/g, rec.wake.time || '已起床');
  } else panel.style.display = 'none';
}
function renderHistory() {
  const box = document.getElementById('history-box'), viewDays = document.getElementById('history-view-days'), viewCal = document.getElementById('history-grid-calendar'), emptyState = document.getElementById('history-empty');
  if (!box || !viewDays || !viewCal || !emptyState) return;
  if (!configs.showHistory) { box.style.display = 'none'; return; }
  box.style.display = 'block'; let hasData = false;
  for (const u of ['master', 'doggy']) { if (!db[u]) continue; for (const d in db[u]) { if (db[u][d]?.wake?.done || db[u][d]?.sleep?.done) { hasData = true; break; } } if (hasData) break; }
  emptyState.style.display = hasData ? 'none' : 'block';
  if (configs.historyType === 'days') {
    viewDays.style.display = 'flex'; viewCal.style.display = 'none'; const days = Number(configs.historyDays) || 30;
    const titleEl = document.getElementById('history-title-text'); if (titleEl) titleEl.textContent = `最近 ${days} 天打卡回顾`;
    const grid = document.getElementById('history-grid-days');
    if (grid) { grid.innerHTML = ''; for (let i = days - 1; i >= 0; i--) grid.appendChild(createDayBox(getLogicalDateStr(i), false)); }
  } else {
    viewDays.style.display = 'none'; viewCal.style.display = 'grid';
    const titleEl = document.getElementById('history-title-text'); if (titleEl) titleEl.textContent = `${configs.historyYear} 年 ${configs.historyMonth} 月打卡回顾`;
    viewCal.innerHTML = ''; ['日','一','二','三','四','五','六'].forEach(day => { viewCal.innerHTML += `<div class="calendar-weekday">${day}</div>`; });
    let year = parseInt(configs.historyYear, 10), month = parseInt(configs.historyMonth, 10) - 1;
    if (!Number.isFinite(year)) year = new Date().getFullYear(); if (!Number.isFinite(month) || month < 0 || month > 11) month = new Date().getMonth();
    const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) viewCal.innerHTML += `<div class="calendar-empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEl = createDayBox(dateStr, true); dayEl.textContent = d; viewCal.appendChild(dayEl);
    }
  }
}
function createDayBox(dateStr, showDateText = false) {
  const mScore = (db['master']?.[dateStr]?.sleep?.done ? 1 : 0) + (db['master']?.[dateStr]?.wake?.done ? 1 : 0);
  const dScore = (db['doggy']?.[dateStr]?.sleep?.done ? 1 : 0) + (db['doggy']?.[dateStr]?.wake?.done ? 1 : 0);
  let statusClass = ''; const t = P().texts || DEFAULT_TEXTS_DAILY;
  const mPure = getPureName(t.masterName) || '先生', dPure = getPureName(t.doggyName) || '宝宝';
  const tooltip = `${dateStr} | ${mPure}: ${mScore}/2, ${dPure}: ${dScore}/2`;
  if (mScore === 2 && dScore === 2) statusClass = 'done-both'; else if (mScore === 2) statusClass = 'done-master'; else if (dScore === 2) statusClass = 'done-doggy'; else if (mScore > 0 && dScore > 0) statusClass = 'half-both'; else if (mScore > 0) statusClass = 'half-master'; else if (dScore > 0) statusClass = 'half-doggy';
  const el = document.createElement('div'); el.className = `day-box ${statusClass}`.trim(); el.title = tooltip; if (!showDateText) el.textContent = parseInt(dateStr.split('-')[2], 10); return el;
}