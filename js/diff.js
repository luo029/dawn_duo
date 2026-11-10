const CONFIG_KEY_MAP = { 'texts.title': '主标题', 'texts.subtitle': '副标题', 'texts.masterName': '主人名字', 'texts.masterTag': '主人标签', 'texts.masterRegion': '主人地区', 'texts.masterSleepBtn': '主人休息按钮文案', 'texts.masterWakeBtn': '主人起床按钮文案', 'texts.doggyName': '小狗名字', 'texts.doggyTag': '小狗标签', 'texts.doggyRegion': '小狗地区', 'texts.doggySleepBtn': '小狗睡觉按钮文案', 'texts.doggyWakeBtn': '小狗起床按钮文案', 'goals.master.sleep': '主人目标休息时间', 'goals.master.wake': '主人目标起床时间', 'goals.doggy.sleep': '小狗目标休息时间', 'goals.doggy.wake': '小狗目标起床时间', 'timeZones.master.value': '主人所在时区', 'timeZones.doggy.value': '小狗所在时区', 'notifyTexts.master_sleep': '主人-到点休息提醒', 'notifyTexts.master_wake': '主人-到点起床提醒', 'notifyTexts.doggy_sleep': '小狗-到点睡觉提醒', 'notifyTexts.doggy_wake': '小狗-到点起床提醒', 'notifyTexts.overtime_sleep': '超时熬夜提醒', 'notifyTexts.overtime_wake': '超时赖床提醒', 'notifyTexts.partner_master_sleep': '主人休息-对方通知', 'notifyTexts.partner_master_wake': '主人起床-对方通知', 'notifyTexts.partner_doggy_sleep': '小狗休息-对方通知', 'notifyTexts.partner_doggy_wake': '小狗起床-对方通知', 'notifyTexts.status_master_sleep': '主人休息-状态栏文案', 'notifyTexts.status_master_wake': '主人起床-状态栏文案', 'notifyTexts.status_doggy_sleep': '小狗休息-状态栏文案', 'notifyTexts.status_doggy_wake': '小狗起床-状态栏文案' };
function isObjectEqual(a, b) { if (a === b) return true; if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false; const keysA = Object.keys(a); const keysB = Object.keys(b); if (keysA.length !== keysB.length) return false; for (let key of keysA) { if (!keysB.includes(key)) return false; if (!isObjectEqual(a[key], b[key])) return false; } return true; }
function calculateDiff(localData, remoteData, isUpload) {
    const dbDiff = []; const cfgDiff = []; const t = P().texts || DEFAULT_TEXTS_DAILY;
    ['master', 'doggy'].forEach(user => {
        const lUser = localData.db[user] || {}; const rUser = remoteData.db[user] || {}; const allDates = new Set([...Object.keys(lUser), ...Object.keys(rUser)]);
        const uName = user === 'master' ? (getPureName(t.masterName) || '主人') : (getPureName(t.doggyName) || '小狗');
        Array.from(allDates).sort().forEach(date => {
            const lDay = lUser[date] || {}; const rDay = rUser[date] || {};
            ['sleep', 'wake'].forEach(type => {
                const lRec = lDay[type]; const rRec = rDay[type]; const tName = type === 'sleep' ? '休息' : '起床';
                if (!lRec && rRec) dbDiff.push({ type: isUpload ? 'remove' : 'add', text: `【${date}】${uName} ${tName}：将${isUpload ? '删除' : '新增'} (${rRec.time})` });
                else if (lRec && !rRec) dbDiff.push({ type: isUpload ? 'add' : 'remove', text: `【${date}】${uName} ${tName}：将${isUpload ? '新增' : '删除'} (${lRec.time})` });
                else if (lRec && rRec) { if (lRec.time !== rRec.time || lRec.done !== rRec.done) { const targetTime = isUpload ? lRec.time : rRec.time; dbDiff.push({ type: 'modify', text: `【${date}】${uName} ${tName}：修改 -> ${targetTime}` }); } }
            });
        });
    });
    if (localData.config && localData.config.profiles) {
        ['daily', 'service'].forEach(mode => {
            const modeName = mode === 'daily' ? '日常' : '主仆'; const lProf = deepMerge(DEFAULT_CONFIGS.profiles[mode], localData.config.profiles?.[mode] || {}); const rProf = deepMerge(DEFAULT_CONFIGS.profiles[mode], remoteData.config?.profiles?.[mode] || {});
            const lTexts = lProf.texts || {}; const rTexts = rProf.texts || {}; const textKeys = new Set([...Object.keys(lTexts), ...Object.keys(rTexts)]);
            textKeys.forEach(k => { const lv = lTexts[k]; const rv = rTexts[k]; if (lv !== rv) { const label = CONFIG_KEY_MAP[`texts.${k}`] || `文案 ${k}`; const target = isUpload ? lv : rv; cfgDiff.push({ type: 'modify', text: `[${modeName}] ${label}：修改 -> ${target}` }); } });
            const lNt = lProf.notifyTexts || {}; const rNt = rProf.notifyTexts || {}; const ntKeys = new Set([...Object.keys(lNt), ...Object.keys(rNt)]);
            ntKeys.forEach(k => { const lv = lNt[k]; const rv = rNt[k]; if (JSON.stringify(lv) !== JSON.stringify(rv)) { const label = CONFIG_KEY_MAP[`notifyTexts.${k}`] || `通知 ${k}`; const target = isUpload ? lv : rv; cfgDiff.push({ type: 'modify', text: `[${modeName}] ${label}：修改 -> ${target}` }); } });
            if (!isObjectEqual(lProf.msgPool || {}, rProf.msgPool || {})) cfgDiff.push({ type: 'modify', text: `[${modeName}] 互动弹窗文案池 发生更新` });
            if (!isObjectEqual(lProf.progressTexts || {}, rProf.progressTexts || {})) cfgDiff.push({ type: 'modify', text: `[${modeName}] 加载进度条文案 发生更新` });
        });
    }
    if (localData.config && localData.config.goals) { ['master', 'doggy'].forEach(user => { ['sleep', 'wake'].forEach(type => { const lv = localData.config.goals[user]?.[type]; const rv = remoteData.config?.goals?.[user]?.[type]; if (lv !== rv) { const label = CONFIG_KEY_MAP[`goals.${user}.${type}`]; const target = isUpload ? lv : rv; cfgDiff.push({ type: 'modify', text: `${label}：修改 -> ${target}` }); } }); }); }
    return { dbDiff, cfgDiff };
}
let pendingSyncData = null;
function renderDiffModal(diff, isUpload, remoteDb = null, remoteCfg = null) {
    document.getElementById('diff-modal-title').textContent = isUpload ? '⬆️ 推送：本地 → 云端' : '⬇️ 拉取：云端 → 本地';
    const modalBox = document.querySelector('#diff-modal .diff-modal-box'); if (modalBox) { modalBox.classList.remove('upload-mode', 'pull-mode'); modalBox.classList.add(isUpload ? 'upload-mode' : 'pull-mode'); }
    const confirmBtn = document.getElementById('diff-confirm-btn'); const forceBtn = document.getElementById('diff-force-btn');
    confirmBtn.textContent = isUpload ? '⬆️ 确认上传' : '⬇️ 应用云端差异'; confirmBtn.className = 'btn ' + (isUpload ? 'upload-btn' : 'pull-btn');
    forceBtn.style.display = 'block'; forceBtn.textContent = isUpload ? '💥 强制覆盖云端' : '💥 直接完全覆盖本地';
    const content = document.getElementById('diff-content'); content.innerHTML = '';
    if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) { content.innerHTML = '<div class="diff-empty">两边数据完全一致。</div>'; confirmBtn.style.display = 'none'; forceBtn.style.display = 'none'; document.getElementById('diff-modal').classList.add('show'); return; }
    confirmBtn.style.display = 'block'; forceBtn.style.display = 'block';
    const stats = { add: 0, remove: 0, modify: 0 }; [...diff.dbDiff, ...diff.cfgDiff].forEach(it => { if (stats[it.type] !== undefined) stats[it.type]++; });
    let summary = '<div class="diff-summary">'; if (stats.add > 0) summary += `<span class="diff-stat add">➕ 新增 ${stats.add}</span>`; if (stats.remove > 0) summary += `<span class="diff-stat remove">➖ 删除 ${stats.remove}</span>`; if (stats.modify > 0) summary += `<span class="diff-stat modify">✏️ 修改 ${stats.modify}</span>`; summary += '</div>'; content.innerHTML = summary;
    const icons = { add: '➕', remove: '➖', modify: '✏️' };
    if (diff.dbDiff.length > 0) { let html = '<div class="diff-section"><div class="diff-section-title">📅 打卡记录变动</div><div class="diff-list">'; diff.dbDiff.forEach(item => { html += `<div class="diff-item ${item.type}"><span class="diff-icon">${icons[item.type]}</span><span class="diff-text">${item.text}</span></div>`; }); html += '</div></div>'; content.innerHTML += html; }
    if (diff.cfgDiff.length > 0) { let html = '<div class="diff-section"><div class="diff-section-title">⚙️ 配置/文案变动</div><div class="diff-list">'; diff.cfgDiff.forEach(item => { html += `<div class="diff-item ${item.type}"><span class="diff-icon">${icons[item.type]}</span><span class="diff-text">${item.text}</span></div>`; }); html += '</div></div>'; content.innerHTML += html; }
    pendingSyncData = { isUpload, localData: getSyncableData(), remoteDb, remoteCfg }; document.getElementById('diff-modal').classList.add('show');
}
window.closeDiffModal = function() { document.getElementById('diff-modal').classList.remove('show'); const modalBox = document.querySelector('#diff-modal .diff-modal-box'); if (modalBox) modalBox.classList.remove('upload-mode', 'pull-mode'); pendingSyncData = null; };
window.confirmSyncDiff = async function(isForce = false) {
    if (!pendingSyncData) return; const { isUpload, localData, remoteDb, remoteCfg } = pendingSyncData; closeDiffModal();
    if (isUpload) {
        showBar('sync', 'sync', 20); const dbStr = JSON.stringify(localData.db, null, 2); const cfgStr = JSON.stringify(localData.config, null, 2);
        const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
        const ok1 = await pushGHFile(ghConfig.path, dbStr, dbRemote?.sha); const ok2 = await pushGHFile(ghConfig.configPath, cfgStr, cfgRemote?.sha);
        if (ok1 && ok2) { updateBar('sync', getProgressText('success') || '✅', 100); setTimeout(() => { hideBar('sync'); showToast('⬆️ 数据上传成功', 'success'); closeSettings(); }, 800); } else { hideBar('sync'); showToast('上传失败，请检查网络/权限', 'late'); }
    } else {
        showBar('sync', 'sync', 60);
        setTimeout(() => { updateBar('sync', getProgressText('success') || '✅', 100); applySyncData(remoteDb, deepMerge(DEFAULT_CONFIGS, remoteCfg), isForce); setTimeout(() => { hideBar('sync'); showToast('⬇️ 数据更新成功', 'success'); closeSettings(); }, 800); }, 500);
    }
};