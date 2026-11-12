window.switchTab = function(e, tabId) { const targetBtn = e.currentTarget || e.target, targetContent = document.getElementById(tabId); if (!targetContent) return; requestAnimationFrame(() => { document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active')); targetBtn.classList.add('active'); targetContent.classList.add('active'); }); };

window.switchDualSettings = function(targetUser, btn) { 
    const card = btn.closest('.config-card');
    if (!card) return;
    const group = card.querySelector('.dual-user-group'); 
    if (group) group.dataset.active = targetUser; 
    card.querySelectorAll('.dual-tab-btn').forEach(b => { 
        const isActive = b.dataset.target === targetUser; 
        b.classList.toggle('active', isActive); 
    }); 
    if (window.applyIdentityFilter) window.applyIdentityFilter(); 
};

function fillTextInputs() { const t = P().texts || DEFAULT_TEXTS_DAILY; const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; }; const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; }; setVal('cfg-title', t.title || ''); setVal('cfg-subtitle', t.subtitle || ''); setVal('cfg-master-name', t.masterName || ''); setVal('cfg-master-tag', t.masterTag || ''); setVal('cfg-master-region', t.masterRegion || ''); setVal('cfg-doggy-name', t.doggyName || ''); setVal('cfg-doggy-tag', t.doggyTag || ''); setVal('cfg-doggy-region', t.doggyRegion || ''); setVal('cfg-master-sleep-btn', t.masterSleepBtn || ''); setVal('cfg-master-wake-btn', t.masterWakeBtn || ''); setVal('cfg-doggy-sleep-btn', t.doggySleepBtn || ''); setVal('cfg-doggy-wake-btn', t.doggyWakeBtn || ''); setVal('cfg-icon-daily', t.dailyModeIcon || '💕'); setVal('cfg-icon-service', t.serviceModeIcon || '🐕'); const n = configs.notifySettings || {}; setVal('cfg-notify-interval', n.overtimeInterval || 30); setChk('cfg-show-partner-card', configs.showPartnerCard !== false); setChk('cfg-show-partner-status', configs.showPartnerStatus !== false); setChk('cfg-auto-sync', ghConfig.autoSync !== false); setVal('cfg-sync-interval', ghConfig.syncInterval !== undefined ? String(ghConfig.syncInterval) : '5'); setChk('cfg-sync-prompt', ghConfig.syncPrompt !== false); setVal('cfg-gh-proxy', ghConfig.apiProxy || ''); setChk('cfg-gh-auto-fallback', ghConfig.autoFallback !== false); setChk('cfg-show-heat-card', configs.showHeatCard === true); setChk('cfg-show-partner-heat', configs.showPartnerHeat !== false); setChk('cfg-heat-notify-feeling', configs.notifySettings?.heatNotifyWithFeeling !== false); setVal('cfg-heat-layout', configs.heatLayout || 'separate'); if (window.togglePartnerNotifyInputs) window.togglePartnerNotifyInputs(); }
function updateColorInputs() { const c = P().colors || DEFAULT_CONFIGS.profiles.daily.colors; const elMaster = document.getElementById('cfg-color-master'); if (elMaster) elMaster.value = c.master || '#38bdf8'; const elDoggy = document.getElementById('cfg-color-doggy'); if (elDoggy) elDoggy.value = c.doggy || '#f472b6'; }

window.showCustomConfirm = function(title, desc, onConfirm) { document.getElementById('custom-confirm-title').textContent = title; document.getElementById('custom-confirm-desc').innerHTML = desc; const btn = document.getElementById('custom-confirm-btn'); const newBtn = btn.cloneNode(true); btn.parentNode.replaceChild(newBtn, btn); newBtn.onclick = () => { closeCustomConfirm(); if (onConfirm) onConfirm(); }; document.getElementById('custom-confirm-modal').classList.add('show'); };
window.closeCustomConfirm = function() { const modal = document.getElementById('custom-confirm-modal'); if (modal) modal.classList.remove('show'); };

window.openSettings = function() { try { fillTextInputs(); updateColorInputs(); if (window.updateMsgCounts) window.updateMsgCounts(); updateModeCards(); const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; }; const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; }; setChk('cfg-simple-mode', configs.simpleMode === true); setChk('cfg-notifications', configs.notifications === true); setVal('cfg-anniversary', configs.anniversary); setChk('cfg-show-history', configs.showHistory === true); setChk('cfg-show-logical-date', configs.showLogicalDate !== false); setVal('cfg-clock-layout', configs.clockLayout); setChk('cfg-show-master-clock', configs.showMasterClock); setChk('cfg-show-doggy-clock', configs.showDoggyClock); setChk('cfg-show-seconds', configs.showSeconds); setChk('cfg-show-shichen', configs.showShichen); setChk('cfg-show-wellness', configs.showWellness); setVal('cfg-tz-master-type', configs.timeZones.master.type || 'iana'); setVal('cfg-tz-doggy-type', configs.timeZones.doggy.type || 'iana'); if (configs.timeZones.master.type === 'offset') setVal('cfg-tz-master-offset', configs.timeZones.master.value); else setVal('cfg-tz-master-iana', configs.timeZones.master.value); if (configs.timeZones.doggy.type === 'offset') setVal('cfg-tz-doggy-offset', configs.timeZones.doggy.value); else setVal('cfg-tz-doggy-iana', configs.timeZones.doggy.value); toggleTzInput('master'); toggleTzInput('doggy'); setVal('cfg-goal-master-sleep', configs.goals.master.sleep); setVal('cfg-goal-master-wake', configs.goals.master.wake); setVal('cfg-goal-doggy-sleep', configs.goals.doggy.sleep); setVal('cfg-goal-doggy-wake', configs.goals.doggy.wake); setVal('cfg-history-type', configs.historyType); setVal('cfg-history-days', String(configs.historyDays)); const nItems = configs.notifySettings?.items || {}; document.querySelectorAll('.notify-item-chk').forEach(chk => { chk.checked = nItems[chk.dataset.key] !== false; }); 
        
        const isMDND = configs.notifySettings?.master_dnd === true;
        const isDDND = configs.notifySettings?.doggy_dnd === true;
        document.querySelectorAll('.dnd-chk').forEach(chk => {
            if (chk.dataset.key === 'master_dnd') chk.checked = isMDND;
            if (chk.dataset.key === 'doggy_dnd') chk.checked = isDDND;
        });
        if (window.toggleDNDState) { window.toggleDNDState('master', isMDND); window.toggleDNDState('doggy', isDDND); }

        setChk('cfg-global-testing', configs.notifySettings?.global_testing === true); 
        setChk('cfg-overtime-window-master', configs.notifySettings?.master_window_enabled !== false); 
        setVal('cfg-on-time-before-master', configs.notifySettings?.master_on_time_before !== undefined ? configs.notifySettings.master_on_time_before : 15); 
        setVal('cfg-on-time-after-master', configs.notifySettings?.master_on_time_after !== undefined ? configs.notifySettings.master_on_time_after : 15); 
        setVal('cfg-overtime-sleep-start-master', configs.notifySettings?.master_sleep_start || '21:00'); 
        setVal('cfg-overtime-sleep-end-master', configs.notifySettings?.master_sleep_end || '05:00'); 
        setVal('cfg-overtime-wake-start-master', configs.notifySettings?.master_wake_start || '05:00'); 
        setVal('cfg-overtime-wake-end-master', configs.notifySettings?.master_wake_end || '12:00'); 
        setVal('cfg-overtime-max-master', configs.notifySettings?.master_max_times !== undefined ? configs.notifySettings.master_max_times : 3); 
        const winDetM = document.getElementById('overtime-window-details-master'); if (winDetM) winDetM.style.display = configs.notifySettings?.master_window_enabled !== false ? 'block' : 'none'; 
        
        setChk('cfg-overtime-window-doggy', configs.notifySettings?.doggy_window_enabled !== false); 
        setVal('cfg-on-time-before-doggy', configs.notifySettings?.doggy_on_time_before !== undefined ? configs.notifySettings.doggy_on_time_before : 15); 
        setVal('cfg-on-time-after-doggy', configs.notifySettings?.doggy_on_time_after !== undefined ? configs.notifySettings.doggy_on_time_after : 15); 
        setVal('cfg-overtime-sleep-start-doggy', configs.notifySettings?.doggy_sleep_start || '21:00'); 
        setVal('cfg-overtime-sleep-end-doggy', configs.notifySettings?.doggy_sleep_end || '05:00'); 
        setVal('cfg-overtime-wake-start-doggy', configs.notifySettings?.doggy_wake_start || '05:00'); 
        setVal('cfg-overtime-wake-end-doggy', configs.notifySettings?.doggy_wake_end || '12:00'); 
        setVal('cfg-overtime-max-doggy', configs.notifySettings?.doggy_max_times !== undefined ? configs.notifySettings.doggy_max_times : 3); 
        const winDetD = document.getElementById('overtime-window-details-doggy'); if (winDetD) winDetD.style.display = configs.notifySettings?.doggy_window_enabled !== false ? 'block' : 'none'; 
        if (window.loadPushDevices) window.loadPushDevices(); 
        
        let startYear = new Date().getFullYear(); try { const y = new Date(configs.anniversary).getFullYear(); if (Number.isFinite(y)) startYear = y; } catch (e) { } const endYear = new Date().getFullYear() + 1; const yearSelect = document.getElementById('cfg-history-year'); if (yearSelect) { yearSelect.innerHTML = ''; let yearOptions = ''; for (let y = startYear; y <= endYear; y++) yearOptions += `<option value="${y}">${y} 年</option>`; yearSelect.innerHTML = yearOptions; yearSelect.value = configs.historyYear; if (!yearSelect.value) yearSelect.selectedIndex = 0; } const monthSelect = document.getElementById('cfg-history-month'); if (monthSelect) { monthSelect.innerHTML = ''; let monthOptions = ''; for (let m = 1; m <= 12; m++) monthOptions += `<option value="${String(m).padStart(2,'0')}">${m} 月</option>`; monthSelect.innerHTML = monthOptions; monthSelect.value = configs.historyMonth; if (!monthSelect.value) monthSelect.selectedIndex = 0; } toggleHistoryTypeOptions(); const fixDateInput = document.getElementById('cfg-fix-date'); if (fixDateInput && !fixDateInput.value) fixDateInput.value = getLogicalDateStr(); if (window.renderFixPanel) window.renderFixPanel(); const heatFixDateInput = document.getElementById('cfg-heat-fix-date'); if (heatFixDateInput && !heatFixDateInput.value) heatFixDateInput.value = getLogicalDateStr(); if (window.renderHeatFixPanel) window.renderHeatFixPanel(); updateNotifyStatus(); updateIdentityCards(); if (window.updateBackendPushStatus) window.updateBackendPushStatus(); if (window.refreshCustomSelects) window.refreshCustomSelects(); const modal = document.getElementById('settings-modal'); if (modal) modal.classList.add('show'); document.body.style.overflow = 'hidden'; document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); const firstTabBtn = document.querySelector('.tab-btn'); if (firstTabBtn) firstTabBtn.classList.add('active'); const firstTab = document.getElementById('tab-general'); if (firstTab) firstTab.classList.add('active'); if (window.applyIdentityFilter) window.applyIdentityFilter(); } catch(e) { console.error('打开设置面板时发生详细错误：', e); showToast('打开设置面板失败: ' + e.message, 'late'); } };
window.closeSettings = function() { const modal = document.getElementById('settings-modal'); if (modal) modal.classList.remove('show'); document.body.style.overflow = ''; };

window.saveSettings = function(skipSync) { 
    try { 
        const getVal = (id, fallback) => { const el = document.getElementById(id); return el && el.value != null ? String(el.value).trim() : fallback; }; 
        const getChk = (id, fallback) => { const el = document.getElementById(id); return el ? el.checked : fallback; }; 
        const prof = P(); 
        prof.texts = { title: getVal('cfg-title', ''), subtitle: getVal('cfg-subtitle', ''), masterName: getVal('cfg-master-name', ''), masterTag: getVal('cfg-master-tag', ''), masterRegion: getVal('cfg-master-region', ''), doggyName: getVal('cfg-doggy-name', ''), doggyTag: getVal('cfg-doggy-tag', ''), doggyRegion: getVal('cfg-doggy-region', ''), masterSleepBtn: getVal('cfg-master-sleep-btn', '') || (configs.mode === 'service' ? '主人休息' : '先生休息'), masterWakeBtn: getVal('cfg-master-wake-btn', '') || (configs.mode === 'service' ? '主人起床' : '先生起床'), doggySleepBtn: getVal('cfg-doggy-sleep-btn', '') || (configs.mode === 'service' ? '小狗休息' : '宝宝休息'), doggyWakeBtn: getVal('cfg-doggy-wake-btn', '') || (configs.mode === 'service' ? '小狗起床' : '宝宝起床'), dailyModeIcon: getVal('cfg-icon-daily', '') || '💕', serviceModeIcon: getVal('cfg-icon-service', '') || '🐕' }; 
        prof.colors = { master: getVal('cfg-color-master', '#38bdf8'), doggy: getVal('cfg-color-doggy', '#f472b6') }; 
        const readTimeInput = (id, fallback) => { const v = getVal(id, ''); return /^\d{2}:\d{2}$/.test(v) ? v : fallback; }; 
        const prevGoals = configs.goals; 
        configs.goals = { master: { sleep: readTimeInput('cfg-goal-master-sleep', prevGoals.master.sleep), wake: readTimeInput('cfg-goal-master-wake', prevGoals.master.wake) }, doggy: { sleep: readTimeInput('cfg-goal-doggy-sleep', prevGoals.doggy.sleep), wake: readTimeInput('cfg-goal-doggy-wake', prevGoals.doggy.wake) } }; 
        configs.timeZones.master = { type: getVal('cfg-tz-master-type', 'iana'), value: getVal('cfg-tz-master-type', 'iana') === 'iana' ? getVal('cfg-tz-master-iana', 'Asia/Shanghai') : (getVal('cfg-tz-master-offset', '0') || '0') }; 
        configs.timeZones.doggy = { type: getVal('cfg-tz-doggy-type', 'iana'), value: getVal('cfg-tz-doggy-type', 'iana') === 'iana' ? getVal('cfg-tz-doggy-iana', 'America/New_York') : (getVal('cfg-tz-doggy-offset', '0') || '0') }; 
        const intv = parseInt(getVal('cfg-notify-interval', '30'), 10); 
        configs.notifySettings.overtimeInterval = Number.isFinite(intv) && intv >= 10 ? intv : 30; 
        configs.simpleMode = getChk('cfg-simple-mode', false) === true; 
        configs.showHistory = getChk('cfg-show-history', false) === true; 
        configs.showLogicalDate = getChk('cfg-show-logical-date', true) === true; 
        configs.showPartnerCard = getChk('cfg-show-partner-card', true) === true; 
        configs.showPartnerStatus = getChk('cfg-show-partner-status', true) === true; 
        configs.clockLayout = getVal('cfg-clock-layout', 'separate'); 
        configs.showMasterClock = getChk('cfg-show-master-clock', true); 
        configs.showDoggyClock = getChk('cfg-show-doggy-clock', true); 
        configs.showSeconds = getChk('cfg-show-seconds', true); 
        configs.showShichen = getChk('cfg-show-shichen', false); 
        configs.showWellness = getChk('cfg-show-wellness', false); 
        
        configs.showHeatCard = getChk('cfg-show-heat-card', false) === true;
        const elPartnerHeat = document.getElementById('cfg-show-partner-heat');
        if (elPartnerHeat) configs.showPartnerHeat = elPartnerHeat.checked;
        const elHeatNotifyFeeling = document.getElementById('cfg-heat-notify-feeling');
        if (elHeatNotifyFeeling) configs.notifySettings.heatNotifyWithFeeling = elHeatNotifyFeeling.checked;
        configs.heatLayout = getVal('cfg-heat-layout', 'separate');

        const wantNotify = getChk('cfg-notifications', false) === true; 
        if (wantNotify) { 
            if (!notificationSupported()) { configs.notifications = false; showToast('当前浏览器不支持系统通知', 'late'); } 
            else if (Notification.permission === 'granted') { configs.notifications = true; } 
            else if (Notification.permission === 'denied') { configs.notifications = false; showToast('通知权限已被浏览器拒绝', 'late'); } 
            else { 
                configs.notifications = true; 
                Notification.requestPermission().then(p => { 
                    if (p === 'granted') { configs.notifications = true; showToast('页面通知已开启 🔔', 'success'); } 
                    else { configs.notifications = false; showToast('通知权限被拒绝', 'late'); } 
                    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {} 
                    updateNotifyStatus(); 
                }); 
            } 
        } else configs.notifications = false; 
        configs.anniversary = getVal('cfg-anniversary', '') || configs.anniversary || DEFAULT_CONFIGS.anniversary; 
        configs.historyType = getVal('cfg-history-type', 'days') === 'month' ? 'month' : 'days'; 
        const hd = parseInt(getVal('cfg-history-days', '30'), 10); 
        configs.historyDays = [7, 30, 90, 365].includes(hd) ? hd : 30; 
        configs.historyYear = getVal('cfg-history-year', '') || configs.historyYear; 
        configs.historyMonth = getVal('cfg-history-month', '') || configs.historyMonth; 
        configs.configVersion = 18; 
        if (!configs.notifySettings.items) configs.notifySettings.items = {}; 
        document.querySelectorAll('.notify-item-chk').forEach(chk => { configs.notifySettings.items[chk.dataset.key] = chk.checked; }); 
        
        document.querySelectorAll('.dnd-chk').forEach(chk => {
            configs.notifySettings[chk.dataset.key] = chk.checked;
        });

        configs.notifySettings.global_testing = getChk('cfg-global-testing', false); 
        
        configs.notifySettings.master_window_enabled = getChk('cfg-overtime-window-master', true); 
        configs.notifySettings.master_on_time_before = parseInt(getVal('cfg-on-time-before-master', '15'), 10) || 0;
        configs.notifySettings.master_on_time_after = parseInt(getVal('cfg-on-time-after-master', '15'), 10) || 0;
        configs.notifySettings.master_sleep_start = getVal('cfg-overtime-sleep-start-master', '21:00'); 
        configs.notifySettings.master_sleep_end = getVal('cfg-overtime-sleep-end-master', '05:00'); 
        configs.notifySettings.master_wake_start = getVal('cfg-overtime-wake-start-master', '05:00'); 
        configs.notifySettings.master_wake_end = getVal('cfg-overtime-wake-end-master', '12:00'); 
        const maxM = parseInt(getVal('cfg-overtime-max-master', '3'), 10); 
        configs.notifySettings.master_max_times = Number.isFinite(maxM) && maxM >= 0 ? maxM : 3; 

        configs.notifySettings.doggy_window_enabled = getChk('cfg-overtime-window-doggy', true); 
        configs.notifySettings.doggy_on_time_before = parseInt(getVal('cfg-on-time-before-doggy', '15'), 10) || 0;
        configs.notifySettings.doggy_on_time_after = parseInt(getVal('cfg-on-time-after-doggy', '15'), 10) || 0;
        configs.notifySettings.doggy_sleep_start = getVal('cfg-overtime-sleep-start-doggy', '21:00'); 
        configs.notifySettings.doggy_sleep_end = getVal('cfg-overtime-sleep-end-doggy', '05:00'); 
        configs.notifySettings.doggy_wake_start = getVal('cfg-overtime-wake-start-doggy', '05:00'); 
        configs.notifySettings.doggy_wake_end = getVal('cfg-overtime-wake-end-doggy', '12:00'); 
        const maxD = parseInt(getVal('cfg-overtime-max-doggy', '3'), 10); 
        configs.notifySettings.doggy_max_times = Number.isFinite(maxD) && maxD >= 0 ? maxD : 3; 

        try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) { showToast('保存失败', 'late'); } 
        ghConfig.autoSync = getChk('cfg-auto-sync', true); 
        ghConfig.syncInterval = parseInt(getVal('cfg-sync-interval', '5'), 10) || 0; 
        ghConfig.syncPrompt = getChk('cfg-sync-prompt', true); 
        ghConfig.apiProxy = getVal('cfg-gh-proxy', '');
        ghConfig.autoFallback = getChk('cfg-gh-auto-fallback', true);
        try { localStorage.setItem(CONFIG_KEY, JSON.stringify(ghConfig)); } catch (e) { } 
        applyConfigsToPage(); 
        updateClocks(); 
        render(); 
        updateNotifyStatus(); 
        showToast('设置已保存！💗', 'success'); 
        if (!skipSync) closeSettings(); 
        if (window.startSyncTimer) window.startSyncTimer(); 
        if (!skipSync && window.debounceSync) debounceSync(); 
    } catch (e) { 
        console.error(e); 
        showToast('保存时发生错误: ' + e.message, 'late'); 
    } 
};

function applyIdentityFilter() { 
    const role = identity || 'both'; 
    // 修复：严格限制作用域在设置面板内，防止误伤主界面的发情卡片
    document.querySelectorAll('#settings-modal .config-card').forEach(card => {
        const group = card.querySelector('.dual-user-group');
        if (group) {
            const active = group.dataset.active || 'master';
            group.querySelectorAll('[data-user]').forEach(el => {
                if (role === 'both') { el.style.display = (el.dataset.user === active) ? '' : 'none'; }
                else { el.style.display = (el.dataset.user === role) ? '' : 'none'; }
            });
            const tabs = card.querySelector('.dual-tabs');
            if (tabs) tabs.style.display = role === 'both' ? 'flex' : 'none';
        }
    });
    
    document.querySelectorAll('#settings-modal [data-user]').forEach(el => {
        if (el.closest('.dual-user-group')) return; 
        if (role === 'both') el.style.display = '';
        else el.style.display = (el.dataset.user === role) ? '' : 'none';
    });
}