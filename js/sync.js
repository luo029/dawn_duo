window.syncFromGitHub = async function() {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
    showBar('sync', 'connect', 20);
    try {
        updateBar('sync', getProgressText('auth') || '正在验证...', 40);
        const remoteData = await fetchAllRemoteData();
        if (!remoteData.hasData) { hideBar('sync'); return showToast('云端无数据', 'late'); }
        updateBar('sync', getProgressText('sync') || '正在同步...', 70);
        
        const diff = calculateDiff(getSyncableData(), { db: remoteData.db, config: remoteData.cfg }, false);
        hideBar('sync');
        if (!diff || ((!diff.dbDiff || diff.dbDiff.length === 0) && (!diff.cfgDiff || diff.cfgDiff.length === 0))) return showToast('数据一致，无需拉取', 'success');
        renderDiffModal(diff, false, remoteData.db, remoteData.cfgRaw);
    } catch(e) { hideBar('sync'); showToast('对比失败: ' + (e.message || '未知错误'), 'late'); console.error(e); }
};

window.saveToGitHub = async function() {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
    saveSettings(true); showBar('sync', 'connect', 20);
    try {
        updateBar('sync', getProgressText('auth') || '正在验证...', 40);
        const remoteData = await fetchAllRemoteData();
        updateBar('sync', getProgressText('sync') || '正在同步...', 70);
        
        const diff = calculateDiff(getSyncableData(), { db: remoteData.db, config: remoteData.cfg }, true);
        hideBar('sync');
        
        if (!diff || ((!diff.dbDiff || diff.dbDiff.length === 0) && (!diff.cfgDiff || diff.cfgDiff.length === 0))) {
            window.showCustomConfirm('⬆️ 强制上传', '本地和云端数据完全一致，是否强制覆盖云端配置？', async () => {
                showBar('sync', 'sync', 30);
                await pushAllData(getSyncableData().db, getSyncableData().config, remoteData.shas);
                updateBar('sync', getProgressText('success') || '上传成功', 100); 
                setTimeout(() => { hideBar('sync'); showToast('⬆️ 上传成功', 'success'); closeSettings(); }, 800); 
            });
            return;
        }
        renderDiffModal(diff, true, remoteData.db, remoteData.cfgRaw);
    } catch(e) { hideBar('sync'); showToast('对比失败: ' + (e.message || '未知错误'), 'late'); console.error(e); }
};

async function fetchAllRemoteData() {
    let mRemote = await fetchGHFile('master_records.json');
    let dRemote = await fetchGHFile('doggy_records.json');
    const cfgRemote = await fetchGHFile(ghConfig.configPath);
    const oldRemote = await fetchGHFile('records.json'); 

    let remoteDb = { master: {}, doggy: {} };
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
        if (cfgRemote && cfgRemote.content) {
            cfg = JSON.parse(cfgRemote.content);
            hasData = true;
        }
    } catch(e) { console.warn('远端数据解析异常，已触发数据重置保护', e); }

    const fullCfg = cfg ? deepMerge(DEFAULT_CONFIGS, cfg) : null;

    return {
        db: remoteDb,
        cfg: fullCfg,
        cfgRaw: cfg,
        hasData,
        shas: { m: mRemote?.sha, d: dRemote?.sha, cfg: cfgRemote?.sha }
    };
}

async function pushAllData(localDb, localCfg, shas = {}) {
    const currentIdentity = identity || 'master';
    if (currentIdentity === 'master' || currentIdentity === 'both') {
        await pushGHFile('master_records.json', JSON.stringify(localDb.master || {}, null, 2), shas.m);
    }
    if (currentIdentity === 'doggy' || currentIdentity === 'both') {
        await pushGHFile('doggy_records.json', JSON.stringify(localDb.doggy || {}, null, 2), shas.d);
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
        const cfgStr = JSON.stringify(payload.config || {}, null, 2);
        
        const mRemote = await fetchGHFile('master_records.json');
        const dRemote = await fetchGHFile('doggy_records.json');
        const cfgRemote = await fetchGHFile(ghConfig.configPath);

        let needPushDB_M = true; let needPushDB_D = true; let needPushCfg = true;
        if (!force) {
            if (mRemote && getHash(mRemote.content) === getHash(mStr)) needPushDB_M = false;
            if (dRemote && getHash(dRemote.content) === getHash(dStr)) needPushDB_D = false;
            if (cfgRemote && getHash(cfgRemote.content) === getHash(cfgStr)) needPushCfg = false;
        }

        const currentIdentity = identity || 'master';
        if (needPushDB_M && (currentIdentity === 'master' || currentIdentity === 'both')) {
            await pushGHFile('master_records.json', mStr, mRemote?.sha);
        }
        if (needPushDB_D && (currentIdentity === 'doggy' || currentIdentity === 'both')) {
            await pushGHFile('doggy_records.json', dStr, dRemote?.sha);
        }
        if (needPushCfg) {
            await pushGHFile(ghConfig.configPath, cfgStr, cfgRemote?.sha);
        }
    } catch (e) { console.warn('自动同步失败', e); }
}

async function autoPullOnLoad(force = false) {
    if (ghConfig.autoSync === false && !force) return;
    try {
        const remoteData = await fetchAllRemoteData();
        
        let dbPayload = null; let cfgPayload = null;
        
        const isEmpty = (!remoteData.db.master || Object.keys(remoteData.db.master).length === 0) && (!remoteData.db.doggy || Object.keys(remoteData.db.doggy).length === 0);
        const localHasData = (db.master && Object.keys(db.master).length > 0) || (db.doggy && Object.keys(db.doggy).length > 0);
        
        if (!(isEmpty && localHasData && !force)) {
            if (force || getHash(JSON.stringify(remoteData.db, null, 2)) !== getHash(JSON.stringify(db, null, 2))) {
                dbPayload = remoteData.db;
            }
        }
        if (remoteData.cfgRaw) { if (force || getHash(JSON.stringify(remoteData.cfgRaw, null, 2)) !== getHash(JSON.stringify(getSyncableData().config, null, 2))) cfgPayload = remoteData.cfgRaw; }
        
        if (dbPayload || cfgPayload) {
            const remoteDbObj = dbPayload || db; const remoteCfgObj = cfgPayload || configs;
            if (ghConfig.syncPrompt) {
                const diff = calculateDiff(getSyncableData(), { db: remoteDbObj, config: deepMerge(DEFAULT_CONFIGS, remoteCfgObj) }, false);
                if (!diff || ((!diff.dbDiff || diff.dbDiff.length === 0) && (!diff.cfgDiff || diff.cfgDiff.length === 0))) {
                    // 无差异
                } else {
                    renderDiffModal(diff, false, remoteDbObj, cfgPayload); showToast('发现云端差异，请确认拉取', 'success');
                }
            } else {
                if (dbPayload) detectPartnerCheckin(dbPayload); applySyncData(dbPayload, cfgPayload, force); showToast('已自动同步 📥', 'success');
            }
        }
    } catch (e) { console.warn('自动拉取失败', e); }
}

let pullIntervalTimer = null;
window.startSyncTimer = function() { if (pullIntervalTimer) clearInterval(pullIntervalTimer); const mins = Number(ghConfig.syncInterval) || 0; if (mins > 0 && ghConfig.autoSync !== false) pullIntervalTimer = setInterval(() => { autoPullOnLoad(false); }, mins * 60 * 1000); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { autoPullOnLoad(false); startSyncTimer(); } else { if (pullIntervalTimer) clearInterval(pullIntervalTimer); } });

function getSyncableData() { 
    const syncableConfig = JSON.parse(JSON.stringify(configs || {})); 
    delete syncableConfig.mode; delete syncableConfig.simpleMode; delete syncableConfig.notifications; delete syncableConfig.showLogicalDate; delete syncableConfig.clockLayout; delete syncableConfig.showMasterClock; delete syncableConfig.showDoggyClock; delete syncableConfig.showSeconds; delete syncableConfig.showShichen; delete syncableConfig.showWellness; delete syncableConfig.showPartnerCard; delete syncableConfig.showPartnerStatus; 
    return { db: db || { master: {}, doggy: {} }, config: syncableConfig }; 
}

function applySyncData(payloadDB, payloadConfig, force = false) {
    try {
        if (payloadDB && (payloadDB.master || payloadDB.doggy)) { db = payloadDB; localStorage.setItem('dawn-duo-data', JSON.stringify(db)); }
        const isSettingsOpen = document.getElementById('settings-modal') && document.getElementById('settings-modal').classList.contains('show');
        if (payloadConfig) {
            const localMode = configs.mode; const localSimple = configs.simpleMode; const localNotify = configs.notifications; const localShowMasterClock = configs.showMasterClock; const localShowDoggyClock = configs.showDoggyClock; const localShowSeconds = configs.showSeconds; const localShowShichen = configs.showShichen; const localShowWellness = configs.showWellness; const localClockLayout = configs.clockLayout; const localShowLogicalDate = configs.showLogicalDate; const localShowPartnerCard = configs.showPartnerCard; const localShowPartnerStatus = configs.showPartnerStatus;
            configs = deepMerge(DEFAULT_CONFIGS, payloadConfig); configs.mode = localMode; configs.simpleMode = localSimple; configs.notifications = localNotify; configs.showMasterClock = localShowMasterClock; configs.showDoggyClock = localShowDoggyClock; configs.showSeconds = localShowSeconds; configs.showShichen = localShowShichen; configs.showWellness = localShowWellness; configs.clockLayout = localClockLayout; configs.showLogicalDate = localShowLogicalDate; configs.showPartnerCard = localShowPartnerCard; configs.showPartnerStatus = localShowPartnerStatus;
            localStorage.setItem('dawn-duo-configs', JSON.stringify(configs));
            if (isSettingsOpen) { fillTextInputs(); updateColorInputs(); updateMsgCounts(); updateModeCards(); if(window.refreshCustomSelects) window.refreshCustomSelects(); renderFixPanel(); }
        }
        render(); applyConfigsToPage(); updateModeCards(); updateClocks();
    } catch(e) { console.warn('应用异常', e); }
}
startSyncTimer();