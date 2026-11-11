const CONFIG_KEY_MAP = { 'texts.title': '主标题', 'texts.subtitle': '副标题', 'texts.masterName': '主人名字', 'texts.masterTag': '主人标签', 'texts.masterRegion': '主人地区', 'texts.masterSleepBtn': '主人休息按钮文案', 'texts.masterWakeBtn': '主人起床按钮文案', 'texts.doggyName': '小狗名字', 'texts.doggyTag': '小狗标签', 'texts.doggyRegion': '小狗地区', 'texts.doggySleepBtn': '小狗睡觉按钮文案', 'texts.doggyWakeBtn': '小狗起床按钮文案', 'goals.master.sleep': '主人目标休息时间', 'goals.master.wake': '主人目标起床时间', 'goals.doggy.sleep': '小狗目标休息时间', 'goals.doggy.wake': '小狗目标起床时间', 'timeZones.master.value': '主人所在时区', 'timeZones.doggy.value': '小狗所在时区', 'notifyTexts.master_sleep': '主人-到点休息提醒', 'notifyTexts.master_wake': '主人-到点起床提醒', 'notifyTexts.doggy_sleep': '小狗-到点睡觉提醒', 'notifyTexts.doggy_wake': '小狗-到点起床提醒', 'notifyTexts.overtime_sleep': '超时熬夜提醒', 'notifyTexts.overtime_wake': '超时赖床提醒', 'notifyTexts.partner_master_sleep': '主人休息-对方通知', 'notifyTexts.partner_master_wake': '主人起床-对方通知', 'notifyTexts.partner_doggy_sleep': '小狗休息-对方通知', 'notifyTexts.partner_doggy_wake': '小狗起床-对方通知', 'notifyTexts.status_master_sleep': '主人休息-状态栏文案', 'notifyTexts.status_master_wake': '主人起床-状态栏文案', 'notifyTexts.status_doggy_sleep': '小狗休息-状态栏文案', 'notifyTexts.status_doggy_wake': '小狗起床-状态栏文案' };
function isObjectEqual(a, b) { if (a === b) return true; if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false; const keysA = Object.keys(a); const keysB = Object.keys(b); if (keysA.length !== keysB.length) return false; for (let key of keysA) { if (!keysB.includes(key)) return false; if (!isObjectEqual(a[key], b[key])) return false; } return true; }
function calculateDiff(localData, remoteData, isUpload) {
    const dbDiff = [], cfgDiff = [], t = P().texts || DEFAULT_TEXTS_DAILY;
    ['master', 'doggy'].forEach(user => {
        const lUser = localData.db[user] || {}, rUser = remoteData.db[user] || {}, allDates = new Set([...Object.keys(lUser), ...Object.keys(rUser)]);
        const uName = user === 'master' ? (getPureName(t.masterName) || '主人') : (getPureName(t.doggyName) || '小狗');
        Array.from(allDates).sort().forEach(date => {
            const lDay = lUser[date] || {}, rDay = rUser[date] || {};
            ['sleep', 'wake'].forEach(type => {
                const lRec = lDay[type], rRec = rDay[type], tName = type === 'sleep' ? '休息' : '起床';
                const id = `db_${user}_${date}_${type}`;
                if (!lRec && rRec) dbDiff.push({ id, path: ['db', user, date, type], type: isUpload ? 'remove' : 'add', local: lRec, remote: rRec, text: `【${date}】${uName} ${tName}：将${isUpload ? '删除' : '新增'} (${rRec.time})` });
                else if (lRec && !rRec) dbDiff.push({ id, path: ['db', user, date, type], type: isUpload ? 'add' : 'remove', local: lRec, remote: rRec, text: `【${date}】${uName} ${tName}：将${isUpload ? '新增' : '删除'} (${lRec.time})` });
                else if (lRec && rRec) { if (lRec.time !== rRec.time || lRec.done !== rRec.done) { const targetTime = isUpload ? lRec.time : rRec.time; dbDiff.push({ id, path: ['db', user, date, type], type: 'modify', local: lRec, remote: rRec, text: `【${date}】${uName} ${tName}：修改 -> ${targetTime}` }); } }
            });
        });
    });
    if (localData.config && localData.config.profiles) {
        ['daily', 'service'].forEach(mode => {
            const modeName = mode === 'daily' ? '日常' : '主仆', lProf = deepMerge(DEFAULT_CONFIGS.profiles[mode], localData.config.profiles?.[mode] || {}), rProf = deepMerge(DEFAULT_CONFIGS.profiles[mode], remoteData.config?.profiles?.[mode] || {});
            const compareObj = (lObj, rObj, pathArr) => {
                for (const k in lObj) {
                    if (typeof lObj[k] === 'object' && lObj[k] !== null && !Array.isArray(lObj[k])) {
                        compareObj(lObj[k], rObj[k] || {}, [...pathArr, k]);
                    } else if (JSON.stringify(lObj[k]) !== JSON.stringify(rObj[k])) {
                        const pStr = [...pathArr, k].join('.');
                        const label = CONFIG_KEY_MAP[pStr.replace(`profiles.${mode}.`, '')] || pStr;
                        cfgDiff.push({ id: `cfg_${mode}_${pStr}`, path: ['config', 'profiles', mode, ...pathArr, k], type: 'modify', local: lObj[k], remote: rObj[k], text: `[${modeName}] ${label}：修改 -> ${JSON.stringify(isUpload ? lObj[k] : rObj[k])}` });
                    }
                }
            };
            compareObj(lProf, rProf, []);
        });
    }
    if (localData.config && localData.config.goals) { ['master', 'doggy'].forEach(user => { ['sleep', 'wake'].forEach(type => { const lv = localData.config.goals[user]?.[type], rv = remoteData.config?.goals[user]?.[type]; if (lv !== rv) { const label = CONFIG_KEY_MAP[`goals.${user}.${type}`], target = isUpload ? lv : rv; cfgDiff.push({ id: `cfg_goals_${user}_${type}`, path: ['config', 'goals', user, type], type: 'modify', local: lv, remote: rv, text: `${label}：修改 -> ${target}` }); } }); }); }
    return { dbDiff, cfgDiff };
}
let pendingSyncData = null;
function toggleAllDiff(checked) { document.querySelectorAll('.diff-chk').forEach(chk => { chk.checked = checked; }); const master = document.getElementById('diff-select-all'); if (master) master.checked = checked; }
window.toggleAllDiff = toggleAllDiff;
function renderDiffModal(diff, isUpload, remoteDb = null, remoteCfg = null) {
    document.getElementById('diff-modal-title').textContent = isUpload ? '⬆️ 推送：本地 → 云端' : '⬇️ 拉取：云端 → 本地';
    const modalBox = document.querySelector('#diff-modal .diff-modal-box'); if (modalBox) { modalBox.classList.remove('upload-mode', 'pull-mode'); modalBox.classList.add(isUpload ? 'upload-mode' : 'pull-mode'); }
    const confirmBtn = document.getElementById('diff-confirm-btn'); confirmBtn.textContent = isUpload ? '⬆️ 应用选中并上传' : '⬇️ 应用选中并拉取'; confirmBtn.className = 'btn ' + (isUpload ? 'upload-btn' : 'pull-btn');
    const content = document.getElementById('diff-content'); content.innerHTML = '';
    if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) { content.innerHTML = '<div class="diff-empty">两边数据完全一致。</div>'; confirmBtn.style.display = 'none'; document.getElementById('diff-modal').classList.add('show'); return; }
    confirmBtn.style.display = 'block';
    const stats = { add: 0, remove: 0, modify: 0 }; [...diff.dbDiff, ...diff.cfgDiff].forEach(it => { if (stats[it.type] !== undefined) stats[it.type]++; });
    let summary = '<div class="diff-summary">'; if (stats.add > 0) summary += `<span class="diff-stat add">➕ 新增 ${stats.add}</span>`; if (stats.remove > 0) summary += `<span class="diff-stat remove">➖ 删除 ${stats.remove}</span>`; if (stats.modify > 0) summary += `<span class="diff-stat modify">✏️ 修改 ${stats.modify}</span>`; summary += '</div>'; content.innerHTML = summary;
    const icons = { add: '➕', remove: '➖', modify: '✏️' };
    const renderList = (arr, title) => {
        if (arr.length === 0) return '';
        let html = `<details open style="margin-bottom:12px; background:var(--card-bg); border:1px solid var(--border); border-radius:12px; overflow:hidden;"><summary style="padding:10px 14px; cursor:pointer; font-weight:800; font-size:0.9rem; color:var(--text); background:var(--btn-bg); user-select:none;">${title} (${arr.length})</summary><div style="padding:6px;">`;
        arr.forEach(item => {
            let detailHtml = '';
            if (item.type === 'modify' && (JSON.stringify(item.local).length > 20 || JSON.stringify(item.remote).length > 20)) {
                detailHtml = `<details class="diff-details"><summary>查看具体变动</summary><div class="diff-content-pre"><b>本地:</b> ${JSON.stringify(item.local, null, 2)}\n<b>云端:</b> ${JSON.stringify(item.remote, null, 2)}</div></details>`;
            }
            html += `<div class="diff-item ${item.type}" style="display:flex; gap:10px; padding:10px 12px;"><input type="checkbox" class="diff-chk" data-id="${item.id}" checked><div style="flex:1;"><div><span class="diff-icon">${icons[item.type]}</span> <span class="diff-text">${item.text}</span></div>${detailHtml}</div></div>`;
        });
        html += '</div></details>';
        return html;
    };
    content.innerHTML += renderList(diff.dbDiff, '📅 打卡记录变动');
    content.innerHTML += renderList(diff.cfgDiff, '⚙️ 配置/文案变动');
    pendingSyncData = { isUpload, localData: getSyncableData(), remoteDb, remoteCfg }; document.getElementById('diff-modal').classList.add('show');
}
window.closeDiffModal = function() { document.getElementById('diff-modal').classList.remove('show'); const modalBox = document.querySelector('#diff-modal .diff-modal-box'); if (modalBox) modalBox.classList.remove('upload-mode', 'pull-mode'); pendingSyncData = null; };
function setDeepValue(obj, pathArr, value) { let cur = obj; for (let i = 1; i < pathArr.length - 1; i++) { const k = pathArr[i]; if (!cur[k]) cur[k] = {}; cur = cur[k]; } cur[pathArr[pathArr.length - 1]] = value; }
window.confirmSyncDiff = async function() {
    if (!pendingSyncData) return; const { isUpload, localData, remoteDb, remoteCfg } = pendingSyncData; closeDiffModal();
    const checkedIds = Array.from(document.querySelectorAll('.diff-chk:checked')).map(chk => chk.dataset.id);
    if (checkedIds.length === 0) return showToast('未选择任何差异', 'late');
    
    showBar('sync', 'sync', 30);
    
    let finalDb = isUpload ? JSON.parse(JSON.stringify(localData.db)) : JSON.parse(JSON.stringify(remoteDb || { master: {}, doggy: {} }));
    let finalCfg = isUpload ? JSON.parse(JSON.stringify(localData.config)) : JSON.parse(JSON.stringify(remoteCfg ? deepMerge(DEFAULT_CONFIGS, remoteCfg) : DEFAULT_CONFIGS));
    
    if (!isUpload) {
        if (!finalDb.master) finalDb.master = {}; if (!finalDb.doggy) finalDb.doggy = {};
        // 如果是拉取，最终合并的是本地，基于云端改动
        finalDb = JSON.parse(JSON.stringify(localData.db));
        finalCfg = JSON.parse(JSON.stringify(localData.config));
    }
    
    const diffData = calculateDiff(localData, { db: remoteDb || { master: {}, doggy: {} }, config: remoteCfg ? deepMerge(DEFAULT_CONFIGS, remoteCfg) : null }, isUpload);
    const allDiffs = [...diffData.dbDiff, ...diffData.cfgDiff];
    
    allDiffs.forEach(item => {
        if (checkedIds.includes(item.id)) {
            const valToSet = isUpload ? item.local : item.remote;
            if (item.id.startsWith('db_')) {
                const [, user, date, type] = item.path;
                if (valToSet) { if (!finalDb[user][date]) finalDb[user][date] = {}; finalDb[user][date][type] = valToSet; }
                else { if (finalDb[user][date]) delete finalDb[user][date][type]; if (Object.keys(finalDb[user][date]).length === 0) delete finalDb[user][date]; }
            } else {
                setDeepValue(finalCfg, item.path, valToSet);
            }
        }
    });
    
    if (isUpload) {
        updateBar('sync', 'sync', 60);
        const dbStr = JSON.stringify(finalDb, null, 2), cfgStr = JSON.stringify(finalCfg, null, 2);
        const dbRemote = await fetchGHFile(ghConfig.path), cfgRemote = await fetchGHFile(ghConfig.configPath);
        const ok1 = await pushGHFile(ghConfig.path, dbStr, dbRemote?.sha), ok2 = await pushGHFile(ghConfig.configPath, cfgStr, cfgRemote?.sha);
        if (ok1 && ok2) { updateBar('sync', getProgressText('success') || '✅', 100); setTimeout(() => { hideBar('sync'); showToast('⬆️ 数据上传成功', 'success'); closeSettings(); }, 800); } else { hideBar('sync'); showToast('上传失败，请检查网络/权限', 'late'); }
    } else {
        updateBar('sync', 'sync', 80);
        setTimeout(() => { updateBar('sync', getProgressText('success') || '✅', 100); applySyncData(finalDb, finalCfg, true); setTimeout(() => { hideBar('sync'); showToast('⬇️ 数据更新成功', 'success'); closeSettings(); }, 800); }, 500);
    }
};