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
      configs.configVersion = 8;
      localStorage.setItem('dawn-duo-configs', JSON.stringify(configs));
    }
    render(); applyConfigsToPage(); updateModeCards(); updateClocks();
  } catch(e) { console.warn('同步数据应用异常', e); }
}

const CONFIG_KEY_MAP = {
  'texts.title': '主标题', 'texts.subtitle': '副标题', 'texts.masterName': '主人名字', 'texts.masterTag': '主人标签',
  'texts.masterRegion': '主人地区', 'texts.masterSleepBtn': '主人休息按钮文案', 'texts.masterWakeBtn': '主人起床按钮文案',
  'texts.doggyName': '小狗名字', 'texts.doggyTag': '小狗标签', 'texts.doggyRegion': '小狗地区',
  'texts.doggySleepBtn': '小狗睡觉按钮文案', 'texts.doggyWakeBtn': '小狗起床按钮文案',
  'goals.master.sleep': '主人目标休息时间', 'goals.master.wake': '主人目标起床时间',
  'goals.doggy.sleep': '小狗目标休息时间', 'goals.doggy.wake': '小狗目标起床时间',
  'timeZones.master.value': '主人所在时区', 'timeZones.doggy.value': '小狗所在时区',
  'notifyTexts.master_sleep': '主人-到点休息提醒', 'notifyTexts.master_wake': '主人-到点起床提醒',
  'notifyTexts.doggy_sleep': '小狗-到点睡觉提醒', 'notifyTexts.doggy_wake': '小狗-到点起床提醒',
  'notifyTexts.overtime_sleep': '超时熬夜提醒', 'notifyTexts.overtime_wake': '超时赖床提醒',
  'notifyTexts.partner_master_sleep': '主人休息-对方通知', 'notifyTexts.partner_master_wake': '主人起床-对方通知',
  'notifyTexts.partner_doggy_sleep': '小狗休息-对方通知', 'notifyTexts.partner_doggy_wake': '小狗起床-对方通知',
  'notifyTexts.status_master_sleep': '主人休息-状态栏文案', 'notifyTexts.status_master_wake': '主人起床-状态栏文案',
  'notifyTexts.status_doggy_sleep': '小狗休息-状态栏文案', 'notifyTexts.status_doggy_wake': '小狗起床-状态栏文案'
};

function calculateDiff(localData, remoteData, isUpload) {
  const dbDiff = [];
  const cfgDiff = [];
  const users = ['master', 'doggy'];
  const t = P().texts || DEFAULT_TEXTS_DAILY;
  
  users.forEach(user => {
    const lUser = localData.db[user] || {};
    const rUser = remoteData.db[user] || {};
    const allDates = new Set([...Object.keys(lUser), ...Object.keys(rUser)]);
    
    // 修复：动态获取名字
    const uName = user === 'master' ? (getPureName(t.masterName) || '主人') : (getPureName(t.doggyName) || '小狗');

    Array.from(allDates).sort().forEach(date => {
      const lDay = lUser[date] || {};
      const rDay = rUser[date] || {};
      ['sleep', 'wake'].forEach(type => {
        const lRec = lDay[type];
        const rRec = rDay[type];
        const tName = type === 'sleep' ? '休息' : '起床';
        if (!lRec && rRec) dbDiff.push({ type: isUpload ? 'remove' : 'add', text: `【${date}】${uName} ${tName}：将${isUpload ? '删除' : '新增'} (${rRec.time})` });
        else if (lRec && !rRec) dbDiff.push({ type: isUpload ? 'add' : 'remove', text: `【${date}】${uName} ${tName}：将${isUpload ? '新增' : '删除'} (${lRec.time})` });
        else if (lRec && rRec) { if (lRec.time !== rRec.time || lRec.done !== rRec.done) { const targetTime = isUpload ? lRec.time : rRec.time; dbDiff.push({ type: 'modify', text: `【${date}】${uName} ${tName}：修改 -> ${targetTime}` }); } }
      });
    });
  });
  
  const localCfg = localData.config; const remoteCfg = remoteData.config || {};
  if (localCfg.profiles) {
    ['daily', 'service'].forEach(mode => {
      const modeName = mode === 'daily' ? '日常' : '主仆';
      const lProf = localCfg.profiles[mode] || {}; const rProf = remoteCfg.profiles?.[mode] || {};
      const lTexts = lProf.texts || {}; const rTexts = rProf.texts || {};
      const textKeys = new Set([...Object.keys(lTexts), ...Object.keys(rTexts)]);
      textKeys.forEach(k => { const lv = lTexts[k]; const rv = rTexts[k]; if (lv !== rv) { const label = CONFIG_KEY_MAP[`texts.${k}`] || `文案 ${k}`; const target = isUpload ? lv : rv; cfgDiff.push({ type: 'modify', text: `[${modeName}] ${label}：修改 -> ${target}` }); } });
      
      const lNt = lProf.notifyTexts || {}; const rNt = rProf.notifyTexts || {};
      const ntKeys = new Set([...Object.keys(lNt), ...Object.keys(rNt)]);
      ntKeys.forEach(k => { const lv = lNt[k]; const rv = rNt[k]; if (lv !== rv) { const label = CONFIG_KEY_MAP[`notifyTexts.${k}`] || `通知 ${k}`; const target = isUpload ? lv : rv; cfgDiff.push({ type: 'modify', text: `[${modeName}] ${label}：修改 -> ${target}` }); } });
      if (JSON.stringify(lProf.msgPool || {}) !== JSON.stringify(rProf.msgPool || {})) cfgDiff.push({ type: 'modify', text: `[${modeName}] 互动弹窗文案池 发生更新` });
    });
  }
  if (localCfg.goals) { ['master', 'doggy'].forEach(user => { ['sleep', 'wake'].forEach(type => { const lv = localCfg.goals[user]?.[type]; const rv = remoteCfg.goals?.[user]?.[type]; if (lv !== rv) { const label = CONFIG_KEY_MAP[`goals.${user}.${type}`]; const target = isUpload ? lv : rv; cfgDiff.push({ type: 'modify', text: `${label}：修改 -> ${target}` }); } }); }); }
  return { dbDiff, cfgDiff };
}

let pendingSyncData = null;

function renderDiffModal(diff, isUpload) {
  const title = isUpload ? '⬆️ 推送：本地 → 云端' : '⬇️ 拉取：云端 → 本地';
  document.getElementById('diff-modal-title').textContent = title;
  const modalBox = document.querySelector('#diff-modal .diff-modal-box');
  if (modalBox) { modalBox.classList.remove('upload-mode', 'pull-mode'); modalBox.classList.add(isUpload ? 'upload-mode' : 'pull-mode'); }

  const confirmBtn = document.getElementById('diff-confirm-btn');
  confirmBtn.textContent = isUpload ? '⬆️ 确认上传' : '⬇️ 确认覆盖本地';
  confirmBtn.className = 'btn ' + (isUpload ? 'upload-btn' : 'pull-btn');
  const content = document.getElementById('diff-content'); content.innerHTML = '';

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
  if (stats.add > 0) summary += `<span class="diff-stat add">➕ 新增 ${stats.add}</span>`;
  if (stats.remove > 0) summary += `<span class="diff-stat remove">➖ 删除 ${stats.remove}</span>`;
  if (stats.modify > 0) summary += `<span class="diff-stat modify">✏️ 修改 ${stats.modify}</span>`;
  summary += '</div>'; content.innerHTML = summary;

  const icons = { add: '➕', remove: '➖', modify: '✏️' };
  if (diff.dbDiff.length > 0) { let html = '<div class="diff-section"><div class="diff-section-title">📅 打卡记录变动</div><div class="diff-list">'; diff.dbDiff.forEach(item => { html += `<div class="diff-item ${item.type}"><span class="diff-icon">${icons[item.type]}</span><span class="diff-text">${item.text}</span></div>`; }); html += '</div></div>'; content.innerHTML += html; }
  if (diff.cfgDiff.length > 0) { let html = '<div class="diff-section"><div class="diff-section-title">⚙️ 配置/文案变动</div><div class="diff-list">'; diff.cfgDiff.forEach(item => { html += `<div class="diff-item ${item.type}"><span class="diff-icon">${icons[item.type]}</span><span class="diff-text">${item.text}</span></div>`; }); html += '</div></div>'; content.innerHTML += html; }
  document.getElementById('diff-modal').classList.add('show');
}

window.closeDiffModal = function() { document.getElementById('diff-modal').classList.remove('show'); const modalBox = document.querySelector('#diff-modal .diff-modal-box'); if (modalBox) modalBox.classList.remove('upload-mode', 'pull-mode'); pendingSyncData = null; };

window.confirmSyncDiff = async function() {
  if (!pendingSyncData) return;
  const { isUpload, localData, remoteDb, remoteCfg, remoteDbSha, remoteCfgSha } = pendingSyncData;
  closeDiffModal();
  
  if (isUpload) {
    showToast('正在上传...', 'success');
    const dbStr = JSON.stringify(localData.db, null, 2); const cfgStr = JSON.stringify(localData.config, null, 2);
    const ok1 = await pushGHFile(ghConfig.path, dbStr, remoteDbSha); const ok2 = await pushGHFile(ghConfig.configPath, cfgStr, remoteCfgSha);
    if (ok1 && ok2) { showToast('⬆️ 数据已成功上传', 'success'); closeSettings(); } 
    else showToast('上传失败，请检查网络 / Token / 仓库权限', 'late');
  } else {
    showToast('正在应用云端数据...', 'success'); applySyncData(remoteDb, remoteCfg); showToast('⬇️ 本地数据已成功更新', 'success'); closeSettings();
  }
};

async function fetchGHFile(path) {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return null;
  try {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}?t=${Date.now()}`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (res.ok) { const data = await res.json(); return { sha: data.sha, content: decodeBase64Utf8(data.content) }; }
    if (res.status === 404) return null;
    throw new Error(`GitHub API 返回 ${res.status}`);
  } catch (e) { console.warn(`拉取 ${path} 失败`, e); throw e; }
}

async function pushGHFile(path, contentStr, oldSha) {
  try {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}`;
    const base64Content = encodeBase64Utf8(contentStr);
    const res = await fetch(url, { method: 'PUT', headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `🐾 自动更新 ${path}`, content: base64Content, sha: oldSha || undefined }) });
    return res.ok;
  } catch (e) { console.warn(`上传 ${path} 失败`, e); return false; }
}

window.syncFromGitHub = async function() {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
  showToast('正在获取云端数据对比...', 'success');
  try {
    const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
    if (!dbRemote && !cfgRemote) return showToast('云端没有任何数据', 'late');
    const remoteDb = dbRemote ? JSON.parse(dbRemote.content) : { master: {}, doggy: {} };
    const remoteCfg = cfgRemote ? JSON.parse(cfgRemote.content) : null;
    let fullRemoteCfg = null; if (remoteCfg) fullRemoteCfg = deepMerge(DEFAULT_CONFIGS, remoteCfg);
    const localData = getSyncableData();
    const diff = calculateDiff(localData, { db: remoteDb, config: fullRemoteCfg || localData.config }, false);
    if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) return showToast('云端与本地数据完全一致，无需拉取', 'success');
    pendingSyncData = { isUpload: false, remoteDb: remoteDb, remoteCfg: remoteCfg };
    renderDiffModal(diff, false);
  } catch(e) { console.error(e); showToast('对比失败: ' + e.message, 'late'); }
};

window.saveToGitHub = async function() {
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
  saveSettings(true);
  showToast('正在获取云端数据对比...', 'success');
  try {
    const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
    const remoteDb = dbRemote ? JSON.parse(dbRemote.content) : { master: {}, doggy: {} };
    const remoteCfg = cfgRemote ? JSON.parse(cfgRemote.content) : null;
    let fullRemoteCfg = null; if (remoteCfg) fullRemoteCfg = deepMerge(DEFAULT_CONFIGS, remoteCfg);
    const localData = getSyncableData();
    const diff = calculateDiff(localData, { db: remoteDb, config: fullRemoteCfg }, true);
    if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) {
        if (!confirm('本地和云端数据完全一致，无需上传。\n是否强制上传并覆盖云端？')) return;
        await pushGHFile(ghConfig.path, JSON.stringify(localData.db, null, 2), dbRemote?.sha);
        await pushGHFile(ghConfig.configPath, JSON.stringify(localData.config, null, 2), cfgRemote?.sha);
        showToast('⬆️ 数据已成功上传 (无差异)', 'success'); closeSettings(); return;
    }
    pendingSyncData = { isUpload: true, localData, remoteDbSha: dbRemote?.sha, remoteCfgSha: cfgRemote?.sha };
    renderDiffModal(diff, true);
  } catch(e) { console.error(e); showToast('对比失败: ' + e.message, 'late'); }
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
    const payload = getSyncableData(); const dbStr = JSON.stringify(payload.db, null, 2); const cfgStr = JSON.stringify(payload.config, null, 2);
    const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
    const dbHash = getHash(dbStr); const cfgHash = getHash(cfgStr);
    let needPushDB = true; let needPushCfg = true;
    if (!force) {
      if (dbRemote && getHash(dbRemote.content) === dbHash) needPushDB = false;
      if (cfgRemote && getHash(cfgRemote.content) === cfgHash) needPushCfg = false;
    }
    if (needPushDB) await pushGHFile(ghConfig.path, dbStr, dbRemote?.sha);
    if (needPushCfg) await pushGHFile(ghConfig.configPath, cfgStr, cfgRemote?.sha);
  } catch (e) { console.warn('自动同步失败', e); }
}

async function autoPullOnLoad(force = false) {
  if (ghConfig.autoSync === false && !force) return;
  if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
  try {
    const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
    let dbPayload = null; let cfgPayload = null;
    if (dbRemote) {
      const parsed = JSON.parse(dbRemote.content);
      const isEmpty = (!parsed.master || Object.keys(parsed.master).length === 0) && (!parsed.doggy || Object.keys(parsed.doggy).length === 0);
      const localHasData = (db.master && Object.keys(db.master).length > 0) || (db.doggy && Object.keys(db.doggy).length > 0);
      if (!(isEmpty && localHasData && !force)) {
        const localDbStr = JSON.stringify(db, null, 2);
        if (force || getHash(dbRemote.content) !== getHash(localDbStr)) { if (parsed.master || parsed.doggy) dbPayload = parsed; }
      }
    }
    if (cfgRemote) {
      const syncable = getSyncableData(); const localSyncStr = JSON.stringify(syncable.config, null, 2);
      if (force || getHash(cfgRemote.content) !== getHash(localSyncStr)) cfgPayload = JSON.parse(cfgRemote.content);
    }
    if (dbPayload) detectPartnerCheckin(dbPayload);
    if (dbPayload || cfgPayload) {
      applySyncData(dbPayload, cfgPayload);
      if (force) showToast('已强制从云端拉取数据 📥', 'success'); else showToast('已自动同步云端最新数据 📥', 'success');
    }
  } catch (e) { console.warn('自动拉取失败', e); }
}

setInterval(() => { autoPullOnLoad(false); }, 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') autoPullOnLoad(false); });