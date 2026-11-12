const CONFIG_KEY_MAP = { 
    'texts.title': '主标题', 'texts.subtitle': '副标题', 
    'texts.masterName': '主人名字', 'texts.masterTag': '主人标签', 'texts.masterRegion': '主人地区', 'texts.masterSleepBtn': '主人休息按钮', 'texts.masterWakeBtn': '主人起床按钮', 
    'texts.doggyName': '小狗名字', 'texts.doggyTag': '小狗标签', 'texts.doggyRegion': '小狗地区', 'texts.doggySleepBtn': '小狗睡觉按钮', 'texts.doggyWakeBtn': '小狗起床按钮', 
    'goals.master.sleep': '主人休息目标', 'goals.master.wake': '主人起床目标', 'goals.doggy.sleep': '小狗休息目标', 'goals.doggy.wake': '小狗起床目标', 
    'timeZones.master.value': '主人所在时区', 'timeZones.doggy.value': '小狗所在时区', 
    'notifyTexts.master_sleep': '主人-休息提醒', 'notifyTexts.master_wake': '主人-起床提醒', 
    'notifyTexts.doggy_sleep': '小狗-休息提醒', 'notifyTexts.doggy_wake': '小狗-起床提醒', 
    'notifyTexts.master_sleep_overtime': '主人-熬夜警告', 'notifyTexts.master_wake_overtime': '主人-赖床警告', 
    'notifyTexts.doggy_sleep_overtime': '小狗-熬夜警告', 'notifyTexts.doggy_wake_overtime': '小狗-赖床警告', 
    'notifyTexts.partner_master_sleep': '对方动态-主人休息', 'notifyTexts.partner_master_wake': '对方动态-主人起床', 
    'notifyTexts.partner_doggy_sleep': '对方动态-小狗休息', 'notifyTexts.partner_doggy_wake': '对方动态-小狗起床', 
    'notifyTexts.status_master_sleep': '主人状态栏-休息中', 'notifyTexts.status_master_wake': '主人状态栏-已醒', 
    'notifyTexts.status_doggy_sleep': '小狗状态栏-休息中', 'notifyTexts.status_doggy_wake': '小狗状态栏-已醒' 
};

function isObjectEqual(a, b) { if (a === b) return true; if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false; const keysA = Object.keys(a); const keysB = Object.keys(b); if (keysA.length !== keysB.length) return false; for (let key of keysA) { if (!keysB.includes(key)) return false; if (!isObjectEqual(a[key], b[key])) return false; } return true; }

function calculateDiff(localData, remoteData, isUpload) {
    const dbDiff = [], cfgDiff = [], t = P().texts || DEFAULT_TEXTS_DAILY;
    const lDb = localData.db || {}, rDb = remoteData.db || {};
    const lHeat = localData.heatDb || {}, rHeat = remoteData.heatDb || {};
    
    // 打卡记录比对
    ['master', 'doggy'].forEach(user => {
        const lUser = lDb[user] || {}, rUser = rDb[user] || {}, allDates = new Set([...Object.keys(lUser), ...Object.keys(rUser)]);
        const uName = user === 'master' ? (getPureName(t.masterName) || '主人') : (getPureName(t.doggyName) || '小狗');
        Array.from(allDates).sort().forEach(date => {
            const lDay = lUser[date] || {}, rDay = rUser[date] || {};
            ['sleep', 'wake'].forEach(type => {
                const lRec = lDay[type], rRec = rDay[type], tName = type === 'sleep' ? '休息' : '起床';
                const id = `db_${user}_${date}_${type}`;
                if (!lRec && rRec) dbDiff.push({ id, path: ['db', user, date, type], type: isUpload ? 'remove' : 'add', local: lRec, remote: rRec, text: `📅 <b>${date}</b> ${uName} ${tName}：${isUpload ? '将删除云端记录' : '将新增本地记录'} (${rRec.time || '已打卡'})` });
                else if (lRec && !rRec) dbDiff.push({ id, path: ['db', user, date, type], type: isUpload ? 'add' : 'remove', local: lRec, remote: rRec, text: `📅 <b>${date}</b> ${uName} ${tName}：${isUpload ? '将新增到云端' : '将删除本地记录'} (${lRec.time || '已打卡'})` });
                else if (lRec && rRec) { if (lRec.time !== rRec.time || lRec.done !== rRec.done) { const targetTime = isUpload ? (lRec.time || '') : (rRec.time || ''); dbDiff.push({ id, path: ['db', user, date, type], type: 'modify', local: lRec, remote: rRec, text: `📅 <b>${date}</b> ${uName} ${tName}：修改时间为 ${targetTime}` }); } }
            });
        });
    });

    // 发情记录比对
    ['master', 'doggy'].forEach(user => {
        const lUser = lHeat[user] || {}, rUser = rHeat[user] || {}, allDates = new Set([...Object.keys(lUser), ...Object.keys(rUser)]);
        const uName = user === 'master' ? (getPureName(t.masterName) || '主人') : (getPureName(t.doggyName) || '小狗');
        Array.from(allDates).sort().forEach(date => {
            const lRec = lUser[date], rRec = rUser[date];
            const id = `heat_${user}_${date}`;
            const getHeatStr = (r) => `${r.time}${r.feeling ? ` (${r.feeling})` : ''}`;
            if (!lRec && rRec) dbDiff.push({ id, path: ['heatDb', user, date], type: isUpload ? 'remove' : 'add', local: lRec, remote: rRec, text: `🔥 <b>${date}</b> ${uName} 发情：${isUpload ? '将删除云端记录' : '将新增本地记录'} (${getHeatStr(rRec)})` });
            else if (lRec && !rRec) dbDiff.push({ id, path: ['heatDb', user, date], type: isUpload ? 'add' : 'remove', local: lRec, remote: rRec, text: `🔥 <b>${date}</b> ${uName} 发情：${isUpload ? '将新增到云端' : '将删除本地记录'} (${getHeatStr(lRec)})` });
            else if (lRec && rRec) { if (lRec.time !== rRec.time || lRec.feeling !== rRec.feeling) { const targetStr = isUpload ? getHeatStr(lRec) : getHeatStr(rRec); dbDiff.push({ id, path: ['heatDb', user, date], type: 'modify', local: lRec, remote: rRec, text: `🔥 <b>${date}</b> ${uName} 发情：修改为 ${targetStr}` }); } }
        });
    });

    // 配置比对
    if (localData.config && localData.config.profiles) {
        ['daily', 'service'].forEach(mode => {
            const modeName = mode === 'daily' ? '日常' : '主仆', lProf = deepMerge(DEFAULT_CONFIGS.profiles[mode], localData.config.profiles?.[mode] || {}), rProf = deepMerge(DEFAULT_CONFIGS.profiles[mode], (remoteData.config && remoteData.config.profiles) ? remoteData.config.profiles[mode] || {} : {});
            
            const formatVal = (val) => {
                if (val === undefined || val === null || val === '') return '<span style="color:var(--text-muted); font-style:italic;">(空)</span>';
                if (Array.isArray(val)) {
                    if (val.length === 0) return '<span style="color:var(--text-muted); font-style:italic;">(空列表)</span>';
                    return val.map(v => `<div style="margin-bottom:4px; padding-left:4px;">• ${v}</div>`).join('');
                }
                return String(val);
            };

            const compareObj = (lObj, rObj, pathArr) => {
                if (!lObj || typeof lObj !== 'object') return;
                for (const k in lObj) {
                    if (typeof lObj[k] === 'object' && lObj[k] !== null && !Array.isArray(lObj[k])) {
                        compareObj(lObj[k], (rObj && typeof rObj === 'object') ? rObj[k] || {} : {}, [...pathArr, k]);
                    } else if (JSON.stringify(lObj[k]) !== JSON.stringify(rObj ? rObj[k] : undefined)) {
                        const pStr = [...pathArr, k].join('.');
                        const cleanKey = pStr.replace(`profiles.${mode}.`, '');
                        
                        let label = CONFIG_KEY_MAP[cleanKey];
                        if (!label) {
                            if (cleanKey.endsWith('.title')) label = (CONFIG_KEY_MAP[cleanKey.replace('.title','')] || cleanKey) + ' - 自定义标题';
                            else if (cleanKey.endsWith('.texts')) label = (CONFIG_KEY_MAP[cleanKey.replace('.texts','')] || cleanKey) + ' - 随机文案库';
                            else label = pStr;
                        }

                        const lv = lObj[k];
                        const rv = rObj ? rObj[k] : undefined;
                        
                        let diffHtml = '';
                        if (isUpload) {
                            diffHtml = `
                            <details style="margin-top:8px; border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--card-bg);">
                                <summary style="padding:8px 12px; cursor:pointer; font-size:0.75rem; font-weight:700; color:var(--text-muted); background:var(--settings-bg); display:flex; justify-content:space-between; align-items:center; user-select:none;">
                                    <span>展开查看具体变动</span><span>▼</span>
                                </summary>
                                <div style="padding:12px; font-size:0.75rem; line-height:1.5; display:flex; flex-direction:column; gap:8px;">
                                    <div style="background:rgba(251,146,60,0.08); padding:10px; border-radius:6px; border-left:4px solid #fb923c;">
                                        <div style="color:#fb923c; font-weight:800; margin-bottom:6px; letter-spacing:0.5px;">⬆️ 本地数据 (将上传)：</div>
                                        <div style="color:var(--text);">${formatVal(lv)}</div>
                                    </div>
                                    <div style="background:rgba(156,143,166,0.05); padding:10px; border-radius:6px; border-left:4px solid var(--border);">
                                        <div style="color:var(--text-muted); font-weight:800; margin-bottom:6px; letter-spacing:0.5px;">☁️ 云端数据 (将被覆盖)：</div>
                                        <div style="color:var(--text-muted); opacity:0.8;">${formatVal(rv)}</div>
                                    </div>
                                </div>
                            </details>`;
                        } else {
                            diffHtml = `
                            <details style="margin-top:8px; border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--card-bg);">
                                <summary style="padding:8px 12px; cursor:pointer; font-size:0.75rem; font-weight:700; color:var(--text-muted); background:var(--settings-bg); display:flex; justify-content:space-between; align-items:center; user-select:none;">
                                    <span>展开查看具体变动</span><span>▼</span>
                                </summary>
                                <div style="padding:12px; font-size:0.75rem; line-height:1.5; display:flex; flex-direction:column; gap:8px;">
                                    <div style="background:rgba(56,189,248,0.08); padding:10px; border-radius:6px; border-left:4px solid var(--tab-active);">
                                        <div style="color:var(--tab-active); font-weight:800; margin-bottom:6px; letter-spacing:0.5px;">⬇️ 云端数据 (将拉取)：</div>
                                        <div style="color:var(--text);">${formatVal(rv)}</div>
                                    </div>
                                    <div style="background:rgba(156,143,166,0.05); padding:10px; border-radius:6px; border-left:4px solid var(--border);">
                                        <div style="color:var(--text-muted); font-weight:800; margin-bottom:6px; letter-spacing:0.5px;">📱 本地数据 (将被覆盖)：</div>
                                        <div style="color:var(--text-muted); opacity:0.8;">${formatVal(lv)}</div>
                                    </div>
                                </div>
                            </details>`;
                        }

                        cfgDiff.push({ id: `cfg_${mode}_${pStr}`, path: ['config', 'profiles', mode, ...pathArr, k], type: 'modify', local: lv, remote: rv, text: `<span style="color:var(--tab-active);font-weight:800;">【${modeName}】</span> ${label} ${diffHtml}` });
                    }
                }
            };
            compareObj(lProf, rProf, []);
        });
    }
    
    // Goals 比对
    if (localData.config && localData.config.goals) { 
        ['master', 'doggy'].forEach(user => { 
            ['sleep', 'wake'].forEach(type => { 
                const lv = localData.config.goals[user]?.[type], rv = (remoteData.config && remoteData.config.goals) ? remoteData.config.goals[user]?.[type] : undefined; 
                if (lv !== rv) { 
                    const label = CONFIG_KEY_MAP[`goals.${user}.${type}`], target = isUpload ? lv : rv; 
                    cfgDiff.push({ id: `cfg_goals_${user}_${type}`, path: ['config', 'goals', user, type], type: 'modify', local: lv, remote: rv, text: `${label}：修改为 <b>${target || '空'}</b>` }); 
                } 
            }); 
        }); 
    }
    return { dbDiff, cfgDiff };
}

let pendingSyncData = null;
function toggleAllDiff(checked) { document.querySelectorAll('.diff-chk').forEach(chk => { chk.checked = checked; }); const master = document.getElementById('diff-select-all'); if (master) master.checked = checked; }
window.toggleAllDiff = toggleAllDiff;

function renderDiffModal(diff, isUpload, remoteDb = null, remoteCfg = null, remoteHeatDb = null) {
    if (!diff || typeof diff !== 'object') diff = { dbDiff: [], cfgDiff: [] };
    if (!Array.isArray(diff.dbDiff)) diff.dbDiff = [];
    if (!Array.isArray(diff.cfgDiff)) diff.cfgDiff = [];
    document.getElementById('diff-modal-title').textContent = isUpload ? '⬆️ 推送：本地 → 云端' : '⬇️ 拉取：云端 → 本地';
    const modalBox = document.querySelector('#diff-modal .diff-modal-box'); if (modalBox) { modalBox.classList.remove('upload-mode', 'pull-mode'); modalBox.classList.add(isUpload ? 'upload-mode' : 'pull-mode'); }
    const confirmBtn = document.getElementById('diff-confirm-btn'); confirmBtn.textContent = isUpload ? '⬆️ 应用选中并上传' : '⬇️ 应用选中并拉取'; confirmBtn.className = 'btn ' + (isUpload ? 'upload-btn' : 'pull-btn');
    const content = document.getElementById('diff-content'); content.innerHTML = '';
    if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) { content.innerHTML = '<div class="diff-empty">两边数据完全一致。</div>'; confirmBtn.style.display = 'none'; document.getElementById('diff-modal').classList.add('show'); return; }
    confirmBtn.style.display = 'block';
    const stats = { add: 0, remove: 0, modify: 0 }; [...diff.dbDiff, ...diff.cfgDiff].forEach(it => { if (stats[it.type] !== undefined) stats[it.type]++; });
    let summary = '<div class="diff-summary">'; if (stats.add > 0) summary += `<span class="diff-stat add">➕ 新增 ${stats.add}</span>`; if (stats.remove > 0) summary += `<span class="diff-stat remove">➖ 删除 ${stats.remove}</span>`; if (stats.modify > 0) summary += `<span class="diff-stat modify">✏️ 修改 ${stats.modify}</span>`; summary += '</div>'; content.innerHTML = summary;
    
    const renderList = (arr, title) => {
        if (!Array.isArray(arr) || arr.length === 0) return '';
        let html = `<details open style="margin-bottom:12px; background:var(--card-bg); border:1px solid var(--border); border-radius:12px; overflow:hidden;"><summary style="padding:10px 14px; cursor:pointer; font-weight:800; font-size:0.9rem; color:var(--text); background:var(--btn-bg); user-select:none;">${title} (${arr.length})</summary><div style="padding:6px;">`;
        arr.forEach(item => {
            html += `<div class="diff-item ${item.type}" style="display:flex; gap:10px; padding:10px 12px; align-items:flex-start;"><input type="checkbox" class="diff-chk" data-id="${item.id}" checked style="margin-top:4px;"><div style="flex:1;"><div class="diff-text" style="word-break: break-word; line-height: 1.5;">${item.text}</div></div></div>`;
        });
        html += '</div></details>';
        return html;
    };
    content.innerHTML += renderList(diff.dbDiff, '📅 记录变动');
    content.innerHTML += renderList(diff.cfgDiff, '⚙️ 配置/文案变动');
    pendingSyncData = { isUpload, localData: getSyncableData(), remoteDb, remoteCfg, remoteHeatDb }; document.getElementById('diff-modal').classList.add('show');
}

window.closeDiffModal = function() { document.getElementById('diff-modal').classList.remove('show'); const modalBox = document.querySelector('#diff-modal .diff-modal-box'); if (modalBox) { modalBox.classList.remove('upload-mode', 'pull-mode'); } pendingSyncData = null; };
function setDeepValue(obj, pathArr, value) { if (!obj || !Array.isArray(pathArr)) return; let cur = obj; for (let i = 1; i < pathArr.length - 1; i++) { const k = pathArr[i]; if (!cur[k]) cur[k] = {}; cur = cur[k]; } cur[pathArr[pathArr.length - 1]] = value; }

window.confirmSyncDiff = async function() {
    if (!pendingSyncData) return; const { isUpload, localData, remoteDb, remoteCfg, remoteHeatDb } = pendingSyncData; closeDiffModal();
    const checkedIds = Array.from(document.querySelectorAll('.diff-chk:checked')).map(chk => chk.dataset.id);
    if (checkedIds.length === 0) return showToast('未选择任何差异', 'late');
    
    showBar('sync', 'sync', 30);
    
    let finalDb = isUpload ? JSON.parse(JSON.stringify(localData.db)) : JSON.parse(JSON.stringify(remoteDb || { master: {}, doggy: {} }));
    let finalHeatDb = isUpload ? JSON.parse(JSON.stringify(localData.heatDb)) : JSON.parse(JSON.stringify(remoteHeatDb || { master: {}, doggy: {} }));
    let finalCfg = isUpload ? JSON.parse(JSON.stringify(localData.config)) : JSON.parse(JSON.stringify(remoteCfg ? deepMerge(DEFAULT_CONFIGS, remoteCfg) : DEFAULT_CONFIGS));
    
    if (!isUpload) {
        if (!finalDb.master) finalDb.master = {}; if (!finalDb.doggy) finalDb.doggy = {};
        if (!finalHeatDb.master) finalHeatDb.master = {}; if (!finalHeatDb.doggy) finalHeatDb.doggy = {};
        finalDb = JSON.parse(JSON.stringify(localData.db));
        finalHeatDb = JSON.parse(JSON.stringify(localData.heatDb));
        finalCfg = JSON.parse(JSON.stringify(localData.config));
    }
    
    const diffData = calculateDiff(localData, { db: remoteDb || { master: {}, doggy: {} }, heatDb: remoteHeatDb || { master: {}, doggy: {} }, config: remoteCfg ? deepMerge(DEFAULT_CONFIGS, remoteCfg) : null }, isUpload);
    const allDiffs = [...(diffData.dbDiff || []), ...(diffData.cfgDiff || [])];
    
    allDiffs.forEach(item => {
        if (checkedIds.includes(item.id)) {
            const valToSet = isUpload ? item.local : item.remote;
            if (item.id.startsWith('db_')) {
                const [, user, date, type] = item.path;
                if (!finalDb[user]) finalDb[user] = {};
                if (!finalDb[user][date]) finalDb[user][date] = {};
                if (valToSet) { finalDb[user][date][type] = valToSet; }
                else { if (finalDb[user] && finalDb[user][date]) delete finalDb[user][date][type]; if (finalDb[user] && finalDb[user][date] && Object.keys(finalDb[user][date]).length === 0) delete finalDb[user][date]; }
            } else if (item.id.startsWith('heat_')) {
                const [, user, date] = item.path;
                if (!finalHeatDb[user]) finalHeatDb[user] = {};
                if (valToSet) { finalHeatDb[user][date] = valToSet; }
                else { if (finalHeatDb[user]) delete finalHeatDb[user][date]; }
            } else {
                setDeepValue(finalCfg, item.path, valToSet);
            }
        }
    });
    
    if (isUpload) {
        updateBar('sync', 'sync', 60);
        const dbStrM = JSON.stringify(finalDb.master || {}, null, 2);
        const dbStrD = JSON.stringify(finalDb.doggy || {}, null, 2);
        const heatStrM = JSON.stringify(finalHeatDb.master || {}, null, 2);
        const heatStrD = JSON.stringify(finalHeatDb.doggy || {}, null, 2);
        const cfgStr = JSON.stringify(finalCfg || {}, null, 2);
        
        const mRemote = await fetchGHFile('master_records.json');
        const dRemote = await fetchGHFile('doggy_records.json');
        const mhRemote = await fetchGHFile('master_heat.json');
        const dhRemote = await fetchGHFile('doggy_heat.json');
        const cfgRemote = await fetchGHFile(ghConfig.configPath);
        
        const currentIdentity = identity || 'master';
        let ok1 = true, ok2 = true, ok3 = true;
        if (currentIdentity === 'master' || currentIdentity === 'both') {
            ok1 = await pushGHFile('master_records.json', dbStrM, mRemote?.sha);
            ok2 = await pushGHFile('master_heat.json', heatStrM, mhRemote?.sha);
        }
        if (currentIdentity === 'doggy' || currentIdentity === 'both') {
            ok1 = await pushGHFile('doggy_records.json', dbStrD, dRemote?.sha);
            ok2 = await pushGHFile('doggy_heat.json', heatStrD, dhRemote?.sha);
        }
        ok3 = await pushGHFile(ghConfig.configPath, cfgStr, cfgRemote?.sha);
        
        if (ok1 && ok2 && ok3) { 
            updateBar('sync', getProgressText('success') || '✅', 100); 
            setTimeout(() => { 
                hideBar('sync'); 
                showToast('⬆️ 数据上传成功', 'success'); 
            }, 800); 
        } else { 
            hideBar('sync'); showToast('上传失败，请检查网络/权限', 'late'); 
        }
    } else {
        updateBar('sync', 'sync', 80);
        setTimeout(() => { 
            updateBar('sync', getProgressText('success') || '✅', 100); 
            applySyncData(finalDb, finalCfg, finalHeatDb, true); 
            setTimeout(() => { 
                hideBar('sync'); 
                showToast('⬇️ 数据更新成功', 'success'); 
            }, 800); 
        }, 500);
    }
};