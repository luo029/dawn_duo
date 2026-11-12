window.syncFromGitHub = async function() {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
    showBar('sync', 'connect', 20);
    try {
        updateBar('sync', getProgressText('auth') || '正在验证...', 40);
        const remoteData = await fetchAllRemoteData();
        if (!remoteData.hasData) { hideBar('sync'); return showToast('云端无数据', 'late'); }
        updateBar('sync', getProgressText('sync') || '正在同步...', 70);
        
        const diff = calculateDiff(getSyncableData(), { db: remoteData.db, heatDb: remoteData.heatDb, config: remoteData.cfg }, false);
        hideBar('sync');
        if (!diff || ((!diff.dbDiff || diff.dbDiff.length === 0) && (!diff.cfgDiff || diff.cfgDiff.length === 0))) return showToast('数据一致，无需拉取', 'success');
        renderDiffModal(diff, false, remoteData.db, remoteData.cfgRaw, remoteData.heatDb);
    } catch(e) { hideBar('sync'); showToast('对比失败: ' + (e.message || '未知错误'), 'late'); console.error(e); }
};

window.saveToGitHub = async function() {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
    saveSettings(true); showBar('sync', 'connect', 20);
    try {
        updateBar('sync', getProgressText('auth') || '正在验证...', 40);
        const remoteData = await fetchAllRemoteData();
        updateBar('sync', getProgressText('sync') || '正在同步...', 70);
        
        const diff = calculateDiff(getSyncableData(), { db: remoteData.db, heatDb: remoteData.heatDb, config: remoteData.cfg }, true);
        hideBar('sync');
        
        if (!diff || ((!diff.dbDiff || diff.dbDiff.length === 0) && (!diff.cfgDiff || diff.cfgDiff.length === 0))) {
            window.showCustomConfirm('⬆️ 强制上传', '本地和云端数据完全一致，是否强制覆盖云端配置？', async () => {
                showBar('sync', 'sync', 30);
                await pushAllData(getSyncableData().db, getSyncableData().heatDb, getSyncableData().config, remoteData.shas);
                updateBar('sync', getProgressText('success') || '上传成功', 100); 
                setTimeout(() => { hideBar('sync'); showToast('⬆️ 上传成功', 'success'); }, 800); 
            });
            return;
        }
        renderDiffModal(diff, true, remoteData.db, remoteData.cfgRaw, remoteData.heatDb);
    } catch(e) { hideBar('sync'); showToast('对比失败: ' + (e.message || '未知错误'), 'late'); console.error(e); }
};

async function fetchAllRemoteData() {
    let mRemote = await fetchGHFile('master_records.json');
    let dRemote = await fetchGHFile('doggy_records.json');
    let mHeat = await fetchGHFile('master_heat.json');
    let dHeat = await fetchGHFile('doggy_heat.json');
    const cfgRemote = await fetchGHFile(ghConfig.configPath);
    const oldRemote = await fetchGHFile('records.json'); 

    let remoteDb = { master: {}, doggy: {} };
    let remoteHeatDb = { master: {}, doggy: {} };
    let hasData = false;
    let cfg = null;

    try {
        if (oldRemote && !mRemote && !dRemote && oldRemote.content) {
            const parsed = JSON.parse(oldRemote.content);
            remoteDb = { master: parsed.master || {}, doggy: parsed.doggy || {} };
            hasData = true;
        } else {
            if (mRemote && mRemote.content) { remoteDb.master = JSON.parse(mRemote.content) || {}; hasData = true; }
            if (dRemote && dRemote.content) { remoteDb.doggy = JSON.parse(dRemote.content) || {}; hasData = true; }
        }
        if (mHeat && mHeat.content) { remoteHeatDb.master = JSON.parse(mHeat.content) || {}; hasData = true; }
        if (dHeat && dHeat.content) { remoteHeatDb.doggy = JSON.parse(dHeat.content) || {}; hasData = true; }
        
        if (cfgRemote && cfgRemote.content) {
            cfg = JSON.parse(cfgRemote.content);
            hasData = true;
        }
    } catch(e) { console.warn('远端数据解析异常，已触发数据重置保护', e); }

    const fullCfg = cfg ? deepMerge(DEFAULT_CONFIGS, cfg) : null;

    return {
        db: remoteDb,
        heatDb: remoteHeatDb,
        cfg: fullCfg,
        cfgRaw: cfg,
        hasData,
        shas: { m: mRemote?.sha, d: dRemote?.sha, mh: mHeat?.sha, dh: dHeat?.sha, cfg: cfgRemote?.sha }
    };
}

async function pushAllData(localDb, localHeatDb, localCfg, shas = {}) {
    const currentIdentity = identity || 'master';
    if (currentIdentity === 'master' || currentIdentity === 'both') {
        await pushGHFile('master_records.json', JSON.stringify(localDb.master || {}, null, 2), shas.m);
        await pushGHFile('master_heat.json', JSON.stringify(localHeatDb.master || {}, null, 2), shas.mh);
    }
    if (currentIdentity === 'doggy' || currentIdentity === 'both') {
        await pushGHFile('doggy_records.json', JSON.stringify(localDb.doggy || {}, null, 2), shas.d);
        await pushGHFile('doggy_heat.json', JSON.stringify(localHeatDb.doggy || {}, null, 2), shas.dh);
    }
    await pushGHFile(ghConfig.configPath, JSON.stringify(localCfg || {}, null, 2), shas.cfg);
}

let syncTimer = null;
function debounceSync() { if (ghConfig.autoSync === false || !ghConfig.user || !ghConfig.repo || !ghConfig.token) return; if (syncTimer) clearTimeout(syncTimer); syncTimer = setTimeout(() => { autoSyncToGitHub(); }, 3000); }

async function autoSyncToGitHub(force = false) {
    if (ghConfig.autoSync === false && !force) return;
    try {
        const payload = getSyncableData();
        const mStr = JSON.stringify(payload.db.master || {}, null, 2);
        const dStr = JSON.stringify(payload.db.doggy || {}, null, 2);
        const mhStr = JSON.stringify(payload.heatDb.master || {}, null, 2);
        const dhStr = JSON.stringify(payload.heatDb.doggy || {}, null, 2);
        const cfgStr = JSON.stringify(payload.config || {}, null, 2);
        
        const mRemote = await fetchGHFile('master_records.json');
        const dRemote = await fetchGHFile('doggy_records.json');
        const mhRemote = await fetchGHFile('master_heat.json');
        const dhRemote = await fetchGHFile('doggy_heat.json');
        const cfgRemote = await fetchGHFile(ghConfig.configPath);

        let needPushDB_M = true; let needPushDB_D = true; let needPushHeat_M = true; let needPushHeat_D = true; let needPushCfg = true;
        if (!force) {
            if (mRemote && getHash(mRemote.content) === getHash(mStr)) needPushDB_M = false;
            if (dRemote && getHash(dRemote.content) === getHash(dStr)) needPushDB_D = false;
            if (mhRemote && getHash(mhRemote.content) === getHash(mhStr)) needPushHeat_M = false;
            if (dhRemote && getHash(dhRemote.content) === getHash(dhStr)) needPushHeat_D = false;
            if (cfgRemote && getHash(cfgRemote.content) === getHash(cfgStr)) needPushCfg = false;
        }

        const currentIdentity = identity || 'master';
        if (needPushDB_M && (currentIdentity === 'master' || currentIdentity === 'both')) await pushGHFile('master_records.json', mStr, mRemote?.sha);
        if (needPushDB_D && (currentIdentity === 'doggy' || currentIdentity === 'both')) await pushGHFile('doggy_records.json', dStr, dRemote?.sha);
        if (needPushHeat_M && (currentIdentity === 'master' || currentIdentity === 'both')) await pushGHFile('master_heat.json', mhStr, mhRemote?.sha);
        if (needPushHeat_D && (currentIdentity === 'doggy' || currentIdentity === 'both')) await pushGHFile('doggy_heat.json', dhStr, dhRemote?.sha);
        if (needPushCfg) await pushGHFile(ghConfig.configPath, cfgStr, cfgRemote?.sha);
    } catch (e) { console.warn('自动同步失败', e); }
}

async function autoPullOnLoad(force = false) {
    if (ghConfig.autoSync === false && !force) return;
    try {
        const remoteData = await fetchAllRemoteData();
        
        let dbPayload = null; let heatPayload = null; let cfgPayload = null;
        
        const isEmpty = (!remoteData.db.master || Object.keys(remoteData.db.master).length === 0) && (!remoteData.db.doggy || Object.keys(remoteData.db.doggy).length === 0);
        const localHasData = (db.master && Object.keys(db.master).length > 0) || (db.doggy && Object.keys(db.doggy).length > 0);
        
        if (!(isEmpty && localHasData && !force)) {
            if (force || getHash(JSON.stringify(remoteData.db, null, 2)) !== getHash(JSON.stringify(db, null, 2))) dbPayload = remoteData.db;
        }
        if (force || getHash(JSON.stringify(remoteData.heatDb, null, 2)) !== getHash(JSON.stringify(heatDb, null, 2))) heatPayload = remoteData.heatDb;
        if (remoteData.cfgRaw) { if (force || getHash(JSON.stringify(remoteData.cfgRaw, null, 2)) !== getHash(JSON.stringify(getSyncableData().config, null, 2))) cfgPayload = remoteData.cfgRaw; }
        
        if (dbPayload || heatPayload || cfgPayload) {
            const remoteDbObj = dbPayload || db; const remoteHeatObj = heatPayload || heatDb; const remoteCfgObj = cfgPayload || configs;
            if (ghConfig.syncPrompt) {
                const diff = calculateDiff(getSyncableData(), { db: remoteDbObj, heatDb: remoteHeatObj, config: deepMerge(DEFAULT_CONFIGS, remoteCfgObj) }, false);
                if (!diff || ((!diff.dbDiff || diff.dbDiff.length === 0) && (!diff.cfgDiff || diff.cfgDiff.length === 0))) {
                    // 无差异
                } else {
                    renderDiffModal(diff, false, remoteDbObj, cfgPayload, remoteHeatObj); showToast('发现云端差异，请确认拉取', 'success');
                }
            } else {
                if (dbPayload || heatPayload) detectPartnerCheckin(dbPayload); applySyncData(remoteDbObj, remoteCfgObj, remoteHeatObj, force); showToast('已自动同步 📥', 'success');
            }
        }
    } catch (e) { console.warn('自动拉取失败', e); }
}

let pullIntervalTimer = null;
window.startSyncTimer = function() { if (pullIntervalTimer) clearInterval(pullIntervalTimer); const mins = Number(ghConfig.syncInterval) || 0; if (mins > 0 && ghConfig.autoSync !== false) pullIntervalTimer = setInterval(() => { autoPullOnLoad(false); }, mins * 60 * 1000); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { autoPullOnLoad(false); startSyncTimer(); } else { if (pullIntervalTimer) clearInterval(pullIntervalTimer); } });

function getSyncableData() { 
    const syncableConfig = JSON.parse(JSON.stringify(configs || {})); 
    // 删除所有纯本地界面偏好，不参与同步，防止互相覆盖
    delete syncableConfig.mode; delete syncableConfig.simpleMode; delete syncableConfig.notifications; 
    delete syncableConfig.showLogicalDate; delete syncableConfig.clockLayout; delete syncableConfig.showMasterClock; 
    delete syncableConfig.showDoggyClock; delete syncableConfig.showSeconds; delete syncableConfig.showShichen; 
    delete syncableConfig.showWellness; delete syncableConfig.showPartnerCard; delete syncableConfig.showPartnerStatus; 
    
    // 【修复】发情卡片和日历的展示开关也属于本地偏好，不同步
    delete syncableConfig.showHeatCard; delete syncableConfig.showPartnerHeat; delete syncableConfig.heatLayout;
    delete syncableConfig.showHistory; delete syncableConfig.historyType; delete syncableConfig.historyDays; 
    delete syncableConfig.historyYear; delete syncableConfig.historyMonth;

    return { db: db || { master: {}, doggy: {} }, heatDb: heatDb || { master: {}, doggy: {} }, config: syncableConfig }; 
}

function applySyncData(payloadDB, payloadConfig, payloadHeat = null, force = false) {
    try {
        if (payloadDB && (payloadDB.master || payloadDB.doggy)) { db = payloadDB; localStorage.setItem('dawn-duo-data', JSON.stringify(db)); }
        if (payloadHeat && (payloadHeat.master || payloadHeat.doggy)) { heatDb = payloadHeat; localStorage.setItem('dawn-duo-heat-data', JSON.stringify(heatDb)); }
        const isSettingsOpen = document.getElementById('settings-modal') && document.getElementById('settings-modal').classList.contains('show');
        if (payloadConfig) {
            // 保存所有本地界面偏好
            const localMode = configs.mode; const localSimple = configs.simpleMode; const localNotify = configs.notifications; 
            const localShowMasterClock = configs.showMasterClock; const localShowDoggyClock = configs.showDoggyClock; 
            const localShowSeconds = configs.showSeconds; const localShowShichen = configs.showShichen; 
            const localShowWellness = configs.showWellness; const localClockLayout = configs.clockLayout; 
            const localShowLogicalDate = configs.showLogicalDate; const localShowPartnerCard = configs.showPartnerCard; 
            const localShowPartnerStatus = configs.showPartnerStatus;
            
            // 【修复】保存本地发情卡片和日历偏好
            const localShowHeatCard = configs.showHeatCard; const localShowPartnerHeat = configs.showPartnerHeat; const localHeatLayout = configs.heatLayout;
            const localShowHistory = configs.showHistory; const localHistoryType = configs.historyType; 
            const localHistoryDays = configs.historyDays; const localHistoryYear = configs.historyYear; const localHistoryMonth = configs.historyMonth;

            // 合并云端下发的配置
            configs = deepMerge(DEFAULT_CONFIGS, payloadConfig); 
            
            // 覆盖回本地设置
            configs.mode = localMode; configs.simpleMode = localSimple; configs.notifications = localNotify; 
            configs.showMasterClock = localShowMasterClock; configs.showDoggyClock = localShowDoggyClock; 
            configs.showSeconds = localShowSeconds; configs.showShichen = localShowShichen; 
            configs.showWellness = localShowWellness; configs.clockLayout = localClockLayout; 
            configs.showLogicalDate = localShowLogicalDate; configs.showPartnerCard = localShowPartnerCard; 
            configs.showPartnerStatus = localShowPartnerStatus;
            
            // 【修复】覆盖回本地发情卡片和日历偏好
            configs.showHeatCard = localShowHeatCard; configs.showPartnerHeat = localShowPartnerHeat; configs.heatLayout = localHeatLayout;
            configs.showHistory = localShowHistory; configs.historyType = localHistoryType; 
            configs.historyDays = localHistoryDays; configs.historyYear = localHistoryYear; configs.historyMonth = localHistoryMonth;

            localStorage.setItem('dawn-duo-configs', JSON.stringify(configs));
            if (isSettingsOpen) { fillTextInputs(); updateColorInputs(); updateMsgCounts(); updateModeCards(); if(window.refreshCustomSelects) window.refreshCustomSelects(); renderFixPanel(); }
        }
        render(); applyConfigsToPage(); updateModeCards(); updateClocks();
        if (window.updateHeatUI) window.updateHeatUI();
    } catch(e) { console.warn('应用异常', e); }
}
startSyncTimer();