function updateIdentityLabels() {
  const t = P().texts || DEFAULT_TEXTS_DAILY;
  const m = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生');
  const d = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝');
  const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  setText('id-name-master', m); setText('id-desc-master', `只显示 ${m} 的打卡页面`);
  setText('id-name-doggy', d); setText('id-desc-doggy', `只显示 ${d} 的打卡页面`);
  setText('id-pill-label-master', m); setText('id-pill-label-doggy', d);
  setText('label-partner-master-title', m); setText('label-partner-doggy-title', d);
  setText('label-status-master-title', m); setText('label-status-doggy-title', d);
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
    updateClocks(); return;
  }

  const showPartner = configs.showPartnerCard !== false;
  let visibleCount = 0;

  if (identity === 'master') {
    if (mCard) { mCard.style.display = ''; mCard.classList.remove('read-only'); mCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = false; }); visibleCount++; }
    if (dCard) {
      if (showPartner) { dCard.style.display = ''; dCard.classList.add('read-only'); dCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = true; }); visibleCount++; } else dCard.style.display = 'none';
    }
  } else if (identity === 'doggy') {
    if (dCard) { dCard.style.display = ''; dCard.classList.remove('read-only'); dCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = false; }); visibleCount++; }
    if (mCard) {
      if (showPartner) { mCard.style.display = ''; mCard.classList.add('read-only'); mCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = true; }); visibleCount++; } else mCard.style.display = 'none';
    }
  } else {
    if (mCard) { mCard.style.display = ''; mCard.classList.remove('read-only'); mCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = false; }); visibleCount++; }
    if (dCard) { dCard.style.display = ''; dCard.classList.remove('read-only'); dCard.querySelectorAll('.checkin-btn').forEach(btn => { btn.disabled = false; }); visibleCount++; }
  }

  if (grid) { if (visibleCount <= 1) grid.classList.add('single'); else grid.classList.remove('single'); }
  updateClocks(); render(); 
}

window.chooseIdentity = function(id) {
  if (['master', 'doggy', 'both'].indexOf(id) === -1) return;
  identity = id;
  try { localStorage.setItem(IDENTITY_KEY, id); } catch (e) {}
  
  if (id === 'doggy') configs.showMasterClock = true;
  else if (id === 'master') configs.showDoggyClock = true;
  else if (id === 'both') { configs.showMasterClock = true; configs.showDoggyClock = true; }
  try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch(e) {}

  document.documentElement.classList.remove('no-identity');
  const modal = document.getElementById('identity-modal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  
  document.getElementById('main-wrap').style.display = 'block';
  applyIdentity(); updateIdentityCards();
  
  let msg = '身份已选择 💗';
  if (id === 'master') msg = '已切换为 ' + (getPureName(P().texts.masterName) || '先生') + ' 👑（对方卡片只读）';
  else if (id === 'doggy') msg = '已切换为 ' + (getPureName(P().texts.doggyName) || '宝宝') + ' 🎀（对方卡片只读）';
  else msg = '已切换为 滴滴 🍉 两个页面都能操作';
  showToast(msg, 'success');
  autoPullOnLoad(false);
};

// 优化 Tab 切换逻辑，使用 requestAnimationFrame 避免强制回流卡顿
window.switchTab = function(e, tabId) {
  const targetBtn = e.currentTarget || e.target;
  const targetContent = document.getElementById(tabId);
  if (!targetContent) return;

  requestAnimationFrame(() => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    targetBtn.classList.add('active');
    targetContent.classList.add('active');
  });
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
  const tl = document.getElementById('cfg-text-mode-label'); if (tl) tl.textContent = modeLabel();
  const ntl = document.getElementById('cfg-nt-mode-label'); if (ntl) ntl.textContent = modeLabel();

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
  const dIcon = document.getElementById('mode-icon-daily'); if (dIcon) dIcon.textContent = t.dailyModeIcon || '💕';
  const sIcon = document.getElementById('mode-icon-service'); if (sIcon) sIcon.textContent = t.serviceModeIcon || '🐕';
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
  const pn = document.getElementById('cfg-notify-partner'); if (pn) pn.checked = n.partnerNotify !== false;
  
  const nt = P().notifyTexts || DEFAULT_NOTIFY_TEXTS.daily;
  document.getElementById('cfg-nt-master-sleep').value = nt.master_sleep || '';
  document.getElementById('cfg-nt-master-wake').value = nt.master_wake || '';
  document.getElementById('cfg-nt-doggy-sleep').value = nt.doggy_sleep || '';
  document.getElementById('cfg-nt-doggy-wake').value = nt.doggy_wake || '';
  document.getElementById('cfg-nt-overtime-sleep').value = nt.overtime_sleep || '';
  document.getElementById('cfg-nt-overtime-wake').value = nt.overtime_wake || '';
  
  const pMS = document.getElementById('cfg-nt-partner-master-sleep'); if (pMS) pMS.value = nt.partner_master_sleep || '';
  const pMW = document.getElementById('cfg-nt-partner-master-wake'); if (pMW) pMW.value = nt.partner_master_wake || '';
  const pDS = document.getElementById('cfg-nt-partner-doggy-sleep'); if (pDS) pDS.value = nt.partner_doggy_sleep || '';
  const pDW = document.getElementById('cfg-nt-partner-doggy-wake'); if (pDW) pDW.value = nt.partner_doggy_wake || '';

  const sMS = document.getElementById('cfg-status-master-sleep'); if (sMS) sMS.value = nt.status_master_sleep || '';
  const sMW = document.getElementById('cfg-status-master-wake'); if (sMW) sMW.value = nt.status_master_wake || '';
  const sDS = document.getElementById('cfg-status-doggy-sleep'); if (sDS) sDS.value = nt.status_doggy_sleep || '';
  const sDW = document.getElementById('cfg-status-doggy-wake'); if (sDW) sDW.value = nt.status_doggy_wake || '';

  document.getElementById('cfg-show-partner-card').checked = configs.showPartnerCard !== false;
  document.getElementById('cfg-show-partner-status').checked = configs.showPartnerStatus !== false;
  
  const as = document.getElementById('cfg-auto-sync'); if (as) as.checked = ghConfig.autoSync !== false;
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
    const el = document.getElementById(`cnt_${key}`); if (el) el.textContent = `${arr.length} 条`;
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
  const input = document.createElement('input'); input.type = 'text'; input.value = text; input.placeholder = '输入一条新文案...';
  const delBtn = document.createElement('button'); delBtn.className = 'btn-del'; delBtn.type = 'button'; delBtn.textContent = '✕'; delBtn.onclick = () => row.remove();
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

// ================= 文库导入逻辑 =================
let parsedImportLines = [];

window.readLibraryFile = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const content = e.target.result;
      let lines = [];
      
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) lines = parsed;
          else if (typeof parsed === 'object') {
             const vals = Object.values(parsed).flat(3).filter(v => typeof v === 'string');
             lines = vals;
          }
        } catch(err) { showToast('JSON 解析失败', 'late'); return; }
      } else {
        lines = content.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
      }

      if (lines.length === 0) return showToast('文件中未找到有效文字', 'late');
      
      const pool = P().msgPool || {};
      const allExistingTexts = [];
      for (const u of ['master', 'doggy']) {
        for (const t of ['sleep', 'wake']) {
          for (const s of ['success', 'late']) {
            if (pool[u]?.[t]?.[s]) allExistingTexts.push(...pool[u][t][s]);
          }
        }
      }

      parsedImportLines = lines.map(text => {
        let isDuplicate = false;
        for (const existing of allExistingTexts) {
          if (getSimilarity(text, existing) >= 0.7) {
            isDuplicate = true;
            break;
          }
        }
        return { text, isDuplicate };
      });

      renderImportPreview();
      document.getElementById('import-lib-modal').classList.add('show');
    } catch (err) {
      showToast('文件读取失败', 'late');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
};

function renderImportPreview() {
  const listEl = document.getElementById('import-lib-preview-list');
  listEl.innerHTML = '';
  
  let dupCount = 0;
  const fragment = document.createDocumentFragment(); // 使用文档片段优化 DOM 插入性能
  
  parsedImportLines.forEach((item, index) => {
    if (item.isDuplicate) dupCount++;
    
    const row = document.createElement('div');
    row.className = `import-item-row ${item.isDuplicate ? 'duplicate' : ''}`;
    
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = !item.isDuplicate;
    chk.disabled = item.isDuplicate;
    chk.dataset.index = index;
    
    const txt = document.createElement('span');
    txt.className = 'import-text';
    txt.textContent = item.text;
    txt.style.flex = '1';
    
    row.appendChild(chk);
    row.appendChild(txt);
    
    if (item.isDuplicate) {
      const badge = document.createElement('span');
      badge.className = 'import-badge';
      badge.textContent = '高度重复';
      row.appendChild(badge);
    }
    
    fragment.appendChild(row); // 先放入片段
  });
  
  listEl.appendChild(fragment); // 一次性渲染
  
  if (dupCount > 0) {
    showToast(`发现 ${dupCount} 条重复文案，已自动为您取消勾选`, 'late');
  }
}

window.closeImportLibModal = function() {
  document.getElementById('import-lib-modal').classList.remove('show');
  parsedImportLines = [];
};

window.confirmImportLibrary = function() {
  const targetKey = document.getElementById('import-target-pool').value;
  const [user, type, status] = targetKey.split('_');
  
  const listEl = document.getElementById('import-lib-preview-list');
  const checkedBoxes = listEl.querySelectorAll('input[type="checkbox"]:checked');
  
  if (checkedBoxes.length === 0) return showToast('请至少勾选一条要导入的文案', 'late');
  
  const toAdd = Array.from(checkedBoxes).map(chk => parsedImportLines[Number(chk.dataset.index)].text);
  
  const prof = P();
  if (!prof.msgPool) prof.msgPool = {};
  if (!prof.msgPool[user]) prof.msgPool[user] = {};
  if (!prof.msgPool[user][type]) prof.msgPool[user][type] = {};
  if (!prof.msgPool[user][type][status]) prof.msgPool[user][type][status] = [];
  
  prof.msgPool[user][type][status].push(...toAdd);
  
  try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {}
  updateMsgCounts();
  closeImportLibModal();
  debounceSync();
  showToast(`成功导入 ${toAdd.length} 条文案 💗`, 'success');
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
    const yearSelect = document.getElementById('cfg-history-year'); yearSelect.innerHTML = '';
    let yearOptions = '';
    for (let y = startYear; y <= endYear; y++) yearOptions += `<option value="${y}">${y} 年</option>`;
    yearSelect.innerHTML = yearOptions;
    yearSelect.value = configs.historyYear; if (!yearSelect.value) yearSelect.selectedIndex = 0;

    const monthSelect = document.getElementById('cfg-history-month'); monthSelect.innerHTML = '';
    let monthOptions = '';
    for (let m = 1; m <= 12; m++) monthOptions += `<option value="${String(m).padStart(2,'0')}">${m} 月</option>`;
    monthSelect.innerHTML = monthOptions;
    monthSelect.value = configs.historyMonth; if (!monthSelect.value) monthSelect.selectedIndex = 0;

    toggleHistoryTypeOptions();
    const fixDateInput = document.getElementById('cfg-fix-date');
    if (!fixDateInput.value) fixDateInput.value = getLogicalDateStr();
    renderFixPanel();

    updateNotifyStatus(); updateIdentityCards();
    
    if (window.refreshCustomSelects) window.refreshCustomSelects();

    document.getElementById('settings-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab-btn').classList.add('active');
    document.getElementById('tab-general').classList.add('active');
  } catch(e) { showToast('打开设置面板失败', 'late'); }
};

window.closeSettings = function() { document.getElementById('settings-modal').classList.remove('show'); document.body.style.overflow = ''; };

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

let currentFixTarget = null;
window.openCustomTimeModal = function(user, type, label, dateStr, currentTime) {
  currentFixTarget = { user, type, label, dateStr };
  document.getElementById('custom-time-title').textContent = `修改 ${label} 打卡时间`;
  document.getElementById('custom-time-input').value = currentTime || configs.goals?.[user]?.[type] || '23:00';
  document.getElementById('custom-time-modal').classList.add('show');
};
window.closeCustomTimeModal = function() { document.getElementById('custom-time-modal').classList.remove('show'); currentFixTarget = null; };
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
    if (!/^\d{1,2}:\d{2}$/.test(timeVal)) { showToast('请输入有效的时间格式 (HH:mm)', 'late'); return; }
    const parts = timeVal.split(':');
    const timeFormatted = parts[0].padStart(2, '0') + ':' + parts[1];
    const ontime = checkGoal(user, type, timeFormatted);
    db[user][dateStr][type] = { done: true, time: timeFormatted, ontime: ontime };
    showToast('时间修正成功！', 'success');
  }
  saveLocalData(); renderFixPanel(); closeCustomTimeModal();
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
    const btn = document.createElement('button'); btn.className = `fix-btn ${cls}`; btn.textContent = `${item.label}: ${stateText}`;
    btn.onclick = () => {
      if (!db[item.user]) db[item.user] = {};
      if (!db[item.user][dateStr]) db[item.user][dateStr] = {};
      let cur = db[item.user][dateStr][item.type];
      
      const getGoalTime = (addHour = false) => {
        let goal = configs.goals?.[item.user]?.[item.type] || '00:00';
        if (!addHour) return goal;
        let h = parseInt(goal.split(':')[0]), m = parseInt(goal.split(':')[1]);
        h = (h + 1) % 24; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      };
      if (!cur || !cur.done) { db[item.user][dateStr][item.type] = { done: true, time: getGoalTime(false), ontime: true }; saveLocalData(); renderFixPanel(); }
      else if (cur.ontime) { db[item.user][dateStr][item.type] = { done: true, time: getGoalTime(true), ontime: false }; saveLocalData(); renderFixPanel(); }
      else openCustomTimeModal(item.user, item.type, item.label, dateStr, cur.time);
    };
    panel.appendChild(btn);
  });
}

window.saveSettings = function(skipSync) {
  try {
    const prof = P();
    prof.texts = {
      title: document.getElementById('cfg-title').value.trim(), subtitle: document.getElementById('cfg-subtitle').value.trim(),
      masterName: document.getElementById('cfg-master-name').value.trim(), masterTag: document.getElementById('cfg-master-tag').value.trim(),
      masterRegion: document.getElementById('cfg-master-region').value.trim(), doggyName: document.getElementById('cfg-doggy-name').value.trim(),
      doggyTag: document.getElementById('cfg-doggy-tag').value.trim(), doggyRegion: document.getElementById('cfg-doggy-region').value.trim(),
      masterSleepBtn: document.getElementById('cfg-master-sleep-btn').value.trim() || (configs.mode === 'service' ? '主人休息' : '先生休息'),
      masterWakeBtn: document.getElementById('cfg-master-wake-btn').value.trim() || (configs.mode === 'service' ? '主人起床' : '先生起床'),
      doggySleepBtn: document.getElementById('cfg-doggy-sleep-btn').value.trim() || (configs.mode === 'service' ? '小狗睡觉' : '宝宝睡觉'),
      doggyWakeBtn: document.getElementById('cfg-doggy-wake-btn').value.trim() || (configs.mode === 'service' ? '小狗起床' : '宝宝起床'),
      dailyModeIcon: document.getElementById('cfg-icon-daily').value.trim() || '💕', serviceModeIcon: document.getElementById('cfg-icon-service').value.trim() || '🐕'
    };
    prof.colors = { master: document.getElementById('cfg-color-master').value || '#38bdf8', doggy: document.getElementById('cfg-color-doggy').value || '#f472b6' };

    const readTimeInput = (id, fallback) => { const v = document.getElementById(id).value; return /^\d{2}:\d{2}$/.test(v) ? v : fallback; };
    const prevGoals = configs.goals;
    configs.goals = {
      master: { sleep: readTimeInput('cfg-goal-master-sleep', prevGoals.master.sleep), wake: readTimeInput('cfg-goal-master-wake', prevGoals.master.wake) },
      doggy: { sleep: readTimeInput('cfg-goal-doggy-sleep', prevGoals.doggy.sleep), wake: readTimeInput('cfg-goal-doggy-wake', prevGoals.doggy.wake) }
    };

    configs.timeZones.master = { type: document.getElementById('cfg-tz-master-type').value, value: document.getElementById('cfg-tz-master-type').value === 'iana' ? document.getElementById('cfg-tz-master-iana').value : (document.getElementById('cfg-tz-master-offset').value || '0') };
    configs.timeZones.doggy = { type: document.getElementById('cfg-tz-doggy-type').value, value: document.getElementById('cfg-tz-doggy-type').value === 'iana' ? document.getElementById('cfg-tz-doggy-iana').value : (document.getElementById('cfg-tz-doggy-offset').value || '0') };

    configs.notifySettings.enableOvertime = document.getElementById('cfg-notify-overtime').checked;
    const intv = parseInt(document.getElementById('cfg-notify-interval').value, 10);
    configs.notifySettings.overtimeInterval = Number.isFinite(intv) && intv >= 10 ? intv : 30;
    configs.notifySettings.partnerNotify = document.getElementById('cfg-notify-partner').checked;
    
    prof.notifyTexts = {
      master_sleep: document.getElementById('cfg-nt-master-sleep').value.trim(), master_wake: document.getElementById('cfg-nt-master-wake').value.trim(),
      doggy_sleep: document.getElementById('cfg-nt-doggy-sleep').value.trim(), doggy_wake: document.getElementById('cfg-nt-doggy-wake').value.trim(),
      overtime_sleep: document.getElementById('cfg-nt-overtime-sleep').value.trim(), overtime_wake: document.getElementById('cfg-nt-overtime-wake').value.trim(),
      partner_master_sleep: document.getElementById('cfg-nt-partner-master-sleep').value.trim(), partner_master_wake: document.getElementById('cfg-nt-partner-master-wake').value.trim(),
      partner_doggy_sleep: document.getElementById('cfg-nt-partner-doggy-sleep').value.trim(), partner_doggy_wake: document.getElementById('cfg-nt-partner-doggy-wake').value.trim(),
      status_master_sleep: document.getElementById('cfg-status-master-sleep').value.trim(), status_master_wake: document.getElementById('cfg-status-master-wake').value.trim(),
      status_doggy_sleep: document.getElementById('cfg-status-doggy-sleep').value.trim(), status_doggy_wake: document.getElementById('cfg-status-doggy-wake').value.trim()
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
      if (!notificationSupported()) { configs.notifications = false; showToast('当前浏览器不支持系统通知', 'late'); }
      else if (Notification.permission === 'granted') { configs.notifications = true; }
      else if (Notification.permission === 'denied') { configs.notifications = false; showToast('通知权限已被浏览器拒绝', 'late'); }
      else {
        configs.notifications = true;
        Notification.requestPermission().then(p => {
          if (p === 'granted') { configs.notifications = true; showToast('通知已开启 🔔', 'success'); }
          else { configs.notifications = false; showToast('通知权限被拒绝', 'late'); }
          try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {}
          updateNotifyStatus();
        });
      }
    } else configs.notifications = false;

    configs.anniversary = document.getElementById('cfg-anniversary').value || configs.anniversary || DEFAULT_CONFIGS.anniversary;
    configs.historyType = document.getElementById('cfg-history-type').value === 'month' ? 'month' : 'days';
    const hd = parseInt(document.getElementById('cfg-history-days').value, 10);
    configs.historyDays = [7, 30, 90, 365].includes(hd) ? hd : 30;
    configs.historyYear = document.getElementById('cfg-history-year').value || configs.historyYear;
    configs.historyMonth = document.getElementById('cfg-history-month').value || configs.historyMonth;
    configs.configVersion = 8;
    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) { showToast('保存失败', 'late'); }

    ghConfig.autoSync = document.getElementById('cfg-auto-sync').checked;
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(ghConfig)); } catch (e) { }

    applyConfigsToPage(); updateClocks(); render(); updateNotifyStatus();
    showToast('设置已保存！💗', 'success');
    closeSettings();
    if (!skipSync) debounceSync();
  } catch (e) { showToast('保存时发生错误', 'late'); }
};