let currentSleepActionCtx = null;
let currentWakeActionCtx = null;
window.closeSleepModal = function() { document.getElementById('sleep-action-modal').classList.remove('show'); currentSleepActionCtx = null; };
window.closeWakeModal = function() { document.getElementById('wake-action-modal').classList.remove('show'); currentWakeActionCtx = null; };
window.handleWakeAction = async function(action) {
  if (!currentWakeActionCtx) return;
  const { user, today, record } = currentWakeActionCtx; closeWakeModal();
  if (action === 'overwrite') { record.records = []; await doCheckin(user, 'wake', today, record, 'main'); }
};
window.handleSleepAction = async function(action) {
  if (!currentSleepActionCtx) return;
  const { user, today, record } = currentSleepActionCtx; const yesterday = getLogicalDateStr(1); closeSleepModal();
  if (action === 'sub') { await doCheckin(user, 'sleep', today, record, 'sub'); if (db[user][today]?.wake) { delete db[user][today].wake; saveLocalData(); } } 
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
    if (db[user][today]?.wake) delete db[user][today].wake;
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
    const role = identity === 'both' ? 'both' : (identity || 'master');
    const prof = P();
    const sTexts = prof.sleepTexts?.[role] || (configs.mode === 'service' ? DEFAULT_SLEEP_TEXTS_SERVICE[role] : DEFAULT_SLEEP_TEXTS_DAILY[role]) || {};
    
    document.getElementById('sleep-modal-title').textContent = sTexts.title || '今日已打过卡';
    document.getElementById('sleep-modal-desc').innerHTML = (sTexts.desc || '今天已经在 {time} 休息过了，如何记录？').replace(/{time}/g, `<span class="time-highlight">${record.time}</span>`);
    
    document.getElementById('btn-sleep-sub').innerHTML = `<span class="icon">➕</span>${sTexts.sub || '新增小睡'}`;
    document.getElementById('btn-sleep-cross').innerHTML = `<span class="icon">🌙</span>${sTexts.cross || '算作昨晚熬夜'}`;
    document.getElementById('btn-sleep-overwrite').innerHTML = `<span class="icon">✏️</span>${sTexts.overwrite || '覆盖当前记录'}`;
    document.getElementById('btn-sleep-cancel').innerHTML = `<span class="icon">🗑️</span>${sTexts.cancel || '取消打卡'}`;
    
    document.getElementById('sleep-action-modal').classList.add('show');
    return;
  }
  if (type === 'wake' && record && record.done) {
    currentWakeActionCtx = { user, today, record };
    const role = identity === 'both' ? 'both' : (identity || 'master');
    const prof = P();
    const wTexts = prof.wakeTexts?.[role] || (configs.mode === 'service' ? DEFAULT_WAKE_TEXTS_SERVICE[role] : DEFAULT_WAKE_TEXTS_DAILY[role]) || {};
    
    document.getElementById('wake-modal-title').textContent = wTexts.title || '今日已起床';
    document.getElementById('wake-modal-desc').innerHTML = (wTexts.desc || '今天已经在 {time} 起过床了，如何记录？').replace(/{time}/g, `<span class="time-highlight">${record.time}</span>`);
    
    document.getElementById('btn-wake-confirm').innerHTML = `<span class="icon">✅</span>${wTexts.confirm || '覆盖当前记录'}`;
    document.getElementById('btn-wake-cancel').innerHTML = `<span class="icon">❌</span>${wTexts.cancel || '保留原记录'}`;
    
    document.getElementById('wake-action-modal').classList.add('show');
    return;
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
  showToast(msg, status); 
  
  triggerPartnerPush();

  saveLocalData();
}
async function triggerPartnerPush() {
    if (configs.notifySettings && configs.notifySettings.global_testing) {
        console.log('测试模式已开启，跳过云端触发');
        return;
    }
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
    try {
        // 强制先上传最新数据到云端，防止云端脚本拉取旧数据防误触跳过，确保对方一定能收到
        if (typeof autoSyncToGitHub === 'function') {
            await autoSyncToGitHub(true); 
        }
        await fetch(`https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/actions/workflows/push.yml/dispatches`, {
            method: 'POST',
            headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref: 'main', inputs: { trigger_from: 'partner', test_mode: 'false' } })
        });
        console.log('已触发对方打卡通知');
    } catch(e) {
        console.warn('触发对方通知失败', e);
    }
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
    const sObj = nTexts[`status_${partnerUser}_sleep`] || { texts: [`🌙 {name} 已经休息啦 ({time})`] };
    const tpl = getRandomText(sObj.texts) || `🌙 {name} 已经休息啦 ({time})`;
    panel.innerHTML = tpl.replace(/{name}/g, pName).replace(/{time}/g, rec.sleep.time || '已休息');
  } else if (rec?.wake?.done) {
    panel.style.display = 'flex'; panel.className = 'partner-status-panel wake-status';
    const wObj = nTexts[`status_${partnerUser}_wake`] || { texts: [`☀️ {name} 已经醒来啦 ({time})`] };
    const tpl = getRandomText(wObj.texts) || `☀️ {name} 已经醒来啦 ({time})`;
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
  const el = document.createElement('div'); el.className = `day-box ${statusClass}`.trim(); el.title = tooltip; if (!showDateText) el.textContent = parseInt(dateStr.split('-')[2], 10); 
  el.onclick = () => { if (window.openHistoryDetail) window.openHistoryDetail(dateStr); };
  return el;
}