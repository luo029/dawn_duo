window.syncFromGitHub = async function() {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
    showBar('sync', 'connect', 20);
    try {
        updateBar('sync', getProgressText('auth') || '正在验证...', 40);
        const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
        if (!dbRemote && !cfgRemote) { hideBar('sync'); return showToast('云端无数据', 'late'); }
        updateBar('sync', getProgressText('sync') || '正在同步...', 70);
        const remoteDb = dbRemote ? JSON.parse(dbRemote.content) : { master: {}, doggy: {} };
        const remoteCfg = cfgRemote ? JSON.parse(cfgRemote.content) : null;
        let fullRemoteCfg = remoteCfg ? deepMerge(DEFAULT_CONFIGS, remoteCfg) : null;
        const diff = calculateDiff(getSyncableData(), { db: remoteDb, config: fullRemoteCfg || getSyncableData().config }, false);
        hideBar('sync');
        if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) return showToast('数据一致，无需拉取', 'success');
        renderDiffModal(diff, false, remoteDb, remoteCfg);
    } catch(e) { hideBar('sync'); showToast('对比失败: ' + e.message, 'late'); }
};
window.saveToGitHub = async function() {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先填写完整配置！', 'late');
    saveSettings(true); showBar('sync', 'connect', 20);
    try {
        updateBar('sync', getProgressText('auth') || '正在验证...', 40);
        const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
        updateBar('sync', getProgressText('sync') || '正在同步...', 70);
        const remoteDb = dbRemote ? JSON.parse(dbRemote.content) : { master: {}, doggy: {} };
        const remoteCfg = cfgRemote ? JSON.parse(cfgRemote.content) : null;
        const diff = calculateDiff(getSyncableData(), { db: remoteDb, config: remoteCfg ? deepMerge(DEFAULT_CONFIGS, remoteCfg) : null }, true);
        hideBar('sync');
        if (diff.dbDiff.length === 0 && diff.cfgDiff.length === 0) {
            if (!confirm('本地和云端一致，是否强制覆盖云端？')) return;
            showBar('sync', 'sync', 30); await pushGHFile(ghConfig.path, JSON.stringify(getSyncableData().db, null, 2), dbRemote?.sha); await pushGHFile(ghConfig.configPath, JSON.stringify(getSyncableData().config, null, 2), cfgRemote?.sha);
            updateBar('sync', getProgressText('success') || '上传成功', 100); setTimeout(() => { hideBar('sync'); showToast('⬆️ 上传成功', 'success'); closeSettings(); }, 800); return;
        }
        renderDiffModal(diff, true, remoteDb, remoteCfg);
    } catch(e) { hideBar('sync'); showToast('对比失败: ' + e.message, 'late'); }
};
let syncTimer = null;
function debounceSync() { if (ghConfig.autoSync === false || !ghConfig.user || !ghConfig.repo || !ghConfig.token) return; if (syncTimer) clearTimeout(syncTimer); syncTimer = setTimeout(() => { autoSyncToGitHub(); }, 3000); }
async function autoSyncToGitHub(force = false) {
    if (ghConfig.autoSync === false && !force) return;
    try {
        const payload = getSyncableData(); const dbStr = JSON.stringify(payload.db, null, 2); const cfgStr = JSON.stringify(payload.config, null, 2);
        const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
        const dbHash = getHash(dbStr); const cfgHash = getHash(cfgStr); let needPushDB = true; let needPushCfg = true;
        if (!force) { if (dbRemote && getHash(dbRemote.content) === dbHash) needPushDB = false; if (cfgRemote && getHash(cfgRemote.content) === cfgHash) needPushCfg = false; }
        if (needPushDB) await pushGHFile(ghConfig.path, dbStr, dbRemote?.sha); if (needPushCfg) await pushGHFile(ghConfig.configPath, cfgStr, cfgRemote?.sha);
    } catch (e) { console.warn('自动同步失败', e); }
}
async function autoPullOnLoad(force = false) {
    if (ghConfig.autoSync === false && !force) return;
    try {
        const dbRemote = await fetchGHFile(ghConfig.path); const cfgRemote = await fetchGHFile(ghConfig.configPath);
        let dbPayload = null; let cfgPayload = null;
        if (dbRemote) { const parsed = JSON.parse(dbRemote.content); const isEmpty = (!parsed.master || Object.keys(parsed.master).length === 0) && (!parsed.doggy || Object.keys(parsed.doggy).length === 0); const localHasData = (db.master && Object.keys(db.master).length > 0) || (db.doggy && Object.keys(db.doggy).length > 0); if (!(isEmpty && localHasData && !force)) { if (force || getHash(dbRemote.content) !== getHash(JSON.stringify(db, null, 2))) { if (parsed.master || parsed.doggy) dbPayload = parsed; } } }
        if (cfgRemote) { if (force || getHash(cfgRemote.content) !== getHash(JSON.stringify(getSyncableData().config, null, 2))) cfgPayload = JSON.parse(cfgRemote.content); }
        if (dbPayload || cfgPayload) {
            const remoteDb = dbPayload || db; const remoteCfg = cfgPayload || configs;
            if (ghConfig.syncPrompt) {
                const diff = calculateDiff(getSyncableData(), { db: remoteDb, config: deepMerge(DEFAULT_CONFIGS, remoteCfg) }, false);
                if (diff.dbDiff.length > 0 || diff.cfgDiff.length > 0) { renderDiffModal(diff, false, remoteDb, cfgPayload); showToast('发现云端差异，请确认拉取', 'success'); }
            } else {
                if (dbPayload) detectPartnerCheckin(dbPayload); applySyncData(dbPayload, cfgPayload, force); showToast('已自动同步 📥', 'success');
            }
        }
    } catch (e) { console.warn('自动拉取失败', e); }
}
let pullIntervalTimer = null;
window.startSyncTimer = function() { if (pullIntervalTimer) clearInterval(pullIntervalTimer); const mins = Number(ghConfig.syncInterval) || 0; if (mins > 0 && ghConfig.autoSync !== false) pullIntervalTimer = setInterval(() => { autoPullOnLoad(false); }, mins * 60 * 1000); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { autoPullOnLoad(false); startSyncTimer(); } else { if (pullIntervalTimer) clearInterval(pullIntervalTimer); } });
function getSyncableData() { const syncableConfig = JSON.parse(JSON.stringify(configs)); delete syncableConfig.mode; delete syncableConfig.simpleMode; delete syncableConfig.notifications; delete syncableConfig.showLogicalDate; delete syncableConfig.clockLayout; delete syncableConfig.showMasterClock; delete syncableConfig.showDoggyClock; delete syncableConfig.showSeconds; delete syncableConfig.showShichen; delete syncableConfig.showWellness; delete syncableConfig.showPartnerCard; delete syncableConfig.showPartnerStatus; return { db: db, config: syncableConfig }; }
function applySyncData(payloadDB, payloadConfig, force = false) {
    try {
        if (payloadDB && (payloadDB.master || payloadDB.doggy)) { db = payloadDB; localStorage.setItem('dawn-duo-data', JSON.stringify(db)); }
        const isSettingsOpen = document.getElementById('settings-modal').classList.contains('show');
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