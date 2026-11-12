document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .heat-title { display: none; margin-top: 24px; }
        
        /* 发情专属排版：更私密、更暧昧的淡红/微光背景 */
        .heat-box { display: none; gap: 12px; margin-bottom: 24px; }
        .heat-box.separate { flex-wrap: wrap; }
        .heat-box.separate .heat-user-panel { flex: 1; min-width: 140px; }
        
        .heat-box.merge { display: flex; justify-content: center; align-items: stretch; gap: 0; background: linear-gradient(135deg, rgba(239,68,68,0.05), rgba(244,114,182,0.05)); border-radius: 20px; padding: 12px; border: 1px solid rgba(239,68,68,0.2); }
        .heat-box.merge .heat-user-panel { border-radius: 0; flex: 1; box-shadow: none; border: none; padding: 12px; margin: 0; background: transparent; }
        .heat-box.merge .heat-user-panel:first-child { border-right: 1px dashed rgba(239,68,68,0.2); }

        .heat-user-panel { background: linear-gradient(180deg, rgba(239,68,68,0.03) 0%, var(--card-bg) 100%); border-radius: 20px; padding: 16px 12px; text-align: center; border: 1px solid rgba(239,68,68,0.15); position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(239,68,68,0.05); transition: all 0.3s; }
        .heat-user-panel:hover { box-shadow: 0 6px 20px rgba(239,68,68,0.1); }
        .heat-user-panel::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, var(--master-color), var(--doggy-color)); opacity: 0.6; }
        
        .heat-header { font-size: 0.85rem; font-weight: 800; margin-bottom: 8px; display: flex; justify-content: center; align-items: center; gap: 6px; color: var(--text-muted); }
        .heat-user-panel[data-user="master"] .heat-header span:last-child { color: var(--master-color); }
        .heat-user-panel[data-user="doggy"] .heat-header span:last-child { color: var(--doggy-color); }
        
        .heat-days-wrap { display: flex; justify-content: center; align-items: baseline; gap: 4px; }
        .heat-days { font-size: 2.4rem; font-weight: 900; color: var(--text); line-height: 1.1; font-family: 'DIN Alternate', 'Bahnschrift', sans-serif; letter-spacing: 1px; }
        .heat-unit { font-size: 1rem; font-weight: 700; color: var(--text-muted); }
        
        .heat-info { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px; min-height: 18px; margin-top: 4px; }
        .heat-feeling { font-size: 0.75rem; color: var(--warn); background: rgba(239,68,68,0.08); padding: 6px 10px; border-radius: 8px; margin-bottom: 12px; font-style: italic; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; text-align: left; border: 1px dashed rgba(239,68,68,0.3); }
        
        .heat-action-row { display: flex; gap: 8px; justify-content: center; }
        .heat-btn { flex: 1; padding: 10px 4px; border-radius: 12px; font-size: 0.85rem; background: var(--btn-bg); border: 1px solid var(--border); color: var(--warn); font-weight: 700; transition: all 0.2s; cursor: pointer; white-space: nowrap; display: flex; justify-content: center; align-items: center; gap: 4px; }
        .heat-btn:hover { background: rgba(239,68,68,0.1); border-color: var(--warn); }
        .heat-btn.edit { color: var(--tab-active); background: transparent; border-color: var(--border); }
        .heat-btn.edit:hover { background: rgba(56, 189, 248, 0.1); border-color: var(--tab-active); }
    `;
    document.head.appendChild(style);

    const gridUsers = document.getElementById('grid-users');
    if (!gridUsers) return;

    const heatTitle = document.createElement('div');
    heatTitle.className = 'section-title heat-title';
    heatTitle.innerHTML = '🔥 欲望与禁欲';
    
    const heatBox = document.createElement('div');
    heatBox.className = 'heat-box';
    heatBox.id = 'heat-box';
    heatBox.innerHTML = `
        <div class="heat-user-panel" id="heat-panel-master" data-user="master">
            <div class="heat-header"><span>👑</span> <span class="text-master-name"></span></div>
            <div class="heat-days-wrap" id="heat-days-wrap-master">
                <div class="heat-days" id="heat-days-master">--</div>
                <div class="heat-unit" id="heat-unit-master">天</div>
            </div>
            <div class="heat-info" id="heat-info-master">无记录</div>
            <div id="heat-feeling-master"></div>
            <div id="heat-actions-master" class="heat-action-row"></div>
        </div>
        <div class="heat-user-panel" id="heat-panel-doggy" data-user="doggy">
            <div class="heat-header"><span>🎀</span> <span class="text-doggy-name"></span></div>
            <div class="heat-days-wrap" id="heat-days-wrap-doggy">
                <div class="heat-days" id="heat-days-doggy">--</div>
                <div class="heat-unit" id="heat-unit-doggy">天</div>
            </div>
            <div class="heat-info" id="heat-info-doggy">无记录</div>
            <div id="heat-feeling-doggy"></div>
            <div id="heat-actions-doggy" class="heat-action-row"></div>
        </div>
    `;
    
    gridUsers.parentNode.insertBefore(heatTitle, gridUsers.nextSibling);
    gridUsers.parentNode.insertBefore(heatBox, heatTitle.nextSibling);

    // 弹窗：纯自定义的今日记录界面
    const modal = document.createElement('div');
    modal.className = 'sub-modal';
    modal.id = 'heat-input-modal';
    modal.innerHTML = `
        <div class="sub-modal-box" style="max-width: 320px; padding: 24px;">
            <div class="sub-modal-head"><h3 id="heat-modal-title">记录今日发情</h3><button class="close-btn" onclick="document.getElementById('heat-input-modal').classList.remove('show')">✕</button></div>
            <div style="padding: 10px 0;">
                <div class="form-group"><label>今日感受 (可选)</label><input type="text" id="heat-input-feeling" placeholder="例如：非常想要..."></div>
            </div>
            <div class="sub-modal-foot" style="flex-wrap: wrap; gap: 8px;">
                <button class="btn danger outline" id="heat-btn-delete" onclick="window.clearHeatRecord()" style="display: none; flex: 1 1 100%; padding: 8px; font-size: 0.8rem; margin-bottom: 4px;">🗑️ 取消今日发情</button>
                <button class="btn outline" onclick="document.getElementById('heat-input-modal').classList.remove('show')" style="flex: 1;">取消</button>
                <button class="btn primary" onclick="window.saveHeatRecord()" style="flex: 1;">保存</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    let currentHeatTarget = null;

    function getLastHeat(user) {
        if (typeof heatDb === 'undefined' || !heatDb[user]) return null;
        let latestTs = 0, latestDate = '', latestTime = '', latestFeeling = '';
        for (const date in heatDb[user]) {
            if (heatDb[user][date].ts > latestTs) {
                latestTs = heatDb[user][date].ts;
                latestDate = date;
                latestTime = heatDb[user][date].time;
                latestFeeling = heatDb[user][date].feeling || '';
            }
        }
        return latestTs > 0 ? { ts: latestTs, date: latestDate, time: latestTime, feeling: latestFeeling } : null;
    }

    window.updateHeatUI = function() {
        const title = document.querySelector('.heat-title');
        const box = document.getElementById('heat-box');
        const panelM = document.getElementById('heat-panel-master');
        const panelD = document.getElementById('heat-panel-doggy');
        if (!title || !box || !panelM || !panelD) return;

        const currentConfigs = typeof configs !== 'undefined' ? configs : {};
        const currentIdentity = typeof identity !== 'undefined' ? identity : null;

        if (!currentIdentity || !currentConfigs.showHeatCard) {
            title.style.display = 'none';
            box.style.display = 'none';
            return;
        }

        title.style.display = 'flex';
        box.style.display = 'flex';
        box.className = 'heat-box ' + (currentConfigs.heatLayout || 'separate');

        const showPartner = currentConfigs.showPartnerHeat !== false;
        let showM = false, showD = false;
        if (currentIdentity === 'both') { showM = true; showD = true; }
        else if (currentIdentity === 'master') { showM = true; showD = showPartner; }
        else if (currentIdentity === 'doggy') { showM = showPartner; showD = true; }

        panelM.style.display = showM ? 'block' : 'none';
        panelD.style.display = showD ? 'block' : 'none';

        let t = DEFAULT_TEXTS_DAILY;
        if (typeof P !== 'undefined') t = P().texts || DEFAULT_TEXTS_DAILY;
        document.querySelectorAll('.heat-header .text-master-name').forEach(el => el.textContent = getPureName(t.masterName) || '先生');
        document.querySelectorAll('.heat-header .text-doggy-name').forEach(el => el.textContent = getPureName(t.doggyName) || '宝宝');

        ['master', 'doggy'].forEach(user => {
            if ((user === 'master' && !showM) || (user === 'doggy' && !showD)) return;
            
            const daysEl = document.getElementById(`heat-days-${user}`);
            const unitEl = document.getElementById(`heat-unit-${user}`);
            const infoEl = document.getElementById(`heat-info-${user}`);
            const feelEl = document.getElementById(`heat-feeling-${user}`);
            const actEl = document.getElementById(`heat-actions-${user}`);
            if (!daysEl || !infoEl || !feelEl || !actEl) return;

            const lastHeat = getLastHeat(user);
            const today = getLogicalDateStr();
            let todayRecord = heatDb[user]?.[today];

            if (todayRecord) {
                daysEl.textContent = '0';
                daysEl.style.color = 'var(--warn)';
                unitEl.style.color = 'var(--warn)';
                infoEl.innerHTML = `今日已发情 (${todayRecord.time})`;
                feelEl.innerHTML = todayRecord.feeling ? `<div class="heat-feeling">"${todayRecord.feeling}"</div>` : '';
            } else if (lastHeat) {
                const diffMs = Date.now() - lastHeat.ts;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                daysEl.textContent = `${diffDays}`;
                daysEl.style.color = 'var(--text)';
                unitEl.style.color = 'var(--text-muted)';
                infoEl.innerHTML = `禁欲中... (上次 ${lastHeat.date.substring(5)} ${lastHeat.time})`;
                feelEl.innerHTML = lastHeat.feeling ? `<div class="heat-feeling" style="opacity:0.7; background:transparent; padding:0; margin:0; font-size:0.7rem;">上次感受: "${lastHeat.feeling}"</div>` : '';
            } else {
                const annDate = new Date(currentConfigs.anniversary || '2026-11-04');
                const diffMs = Date.now() - annDate.getTime();
                const diffDays = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
                daysEl.textContent = `${diffDays}`;
                daysEl.style.color = 'var(--text)';
                unitEl.style.color = 'var(--text-muted)';
                infoEl.innerHTML = `禁欲中... (尚未记录)`;
                feelEl.innerHTML = '';
            }

            actEl.innerHTML = '';
            const isMe = currentIdentity === 'both' || currentIdentity === user;
            
            if (isMe) {
                if (todayRecord) {
                    actEl.innerHTML = `<button class="heat-btn edit" onclick="window.openHeatModal('${user}', '${todayRecord.feeling || ''}', true)">✏️ 修改今日</button>`;
                } else {
                    actEl.innerHTML = `<button class="heat-btn" onclick="window.openHeatModal('${user}', '', false)">💦 记录发情</button>`;
                }
            } else {
                actEl.innerHTML = `<button class="heat-btn" style="color:var(--text-muted); background:transparent; border-color:transparent; cursor:default; pointer-events:none;">👀 只读</button>`;
            }
        });
    };

    window.openHeatModal = function(user, feeling, isEdit) {
        currentHeatTarget = { user, isEdit };
        document.getElementById('heat-input-feeling').value = feeling || '';
        document.getElementById('heat-modal-title').textContent = isEdit ? '修改今日发情' : '记录今日发情';
        document.getElementById('heat-btn-delete').style.display = isEdit ? 'block' : 'none';
        document.getElementById('heat-input-modal').classList.add('show');
    };

    window.clearHeatRecord = function() {
        if (!currentHeatTarget) return;
        const { user } = currentHeatTarget;
        const today = getLogicalDateStr();
        if (heatDb[user] && heatDb[user][today]) {
            delete heatDb[user][today];
            localStorage.setItem('dawn-duo-heat-data', JSON.stringify(heatDb));
            if (typeof debounceSync === 'function') debounceSync();
            showToast('已取消今日发情记录', 'late');
        }
        document.getElementById('heat-input-modal').classList.remove('show');
        window.updateHeatUI();
        if (typeof render === 'function') render();
        // 修复：同步刷新设置面板里的发情修正列表
        if (window.renderHeatFixPanel) window.renderHeatFixPanel();
    };

    window.saveHeatRecord = function() {
        if (!currentHeatTarget) return;
        const { user, isEdit } = currentHeatTarget;
        const today = getLogicalDateStr();
        const feeling = document.getElementById('heat-input-feeling').value.trim();
        
        // 使用设定时区的时间
        const timeStr = getTimeInTZ(configs.timeZones[user], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
        
        if (!heatDb[user]) heatDb[user] = {};
        heatDb[user][today] = { ts: Date.now(), time: timeStr, feeling };
        localStorage.setItem('dawn-duo-heat-data', JSON.stringify(heatDb));
        
        if (typeof debounceSync === 'function') debounceSync();
        
        document.getElementById('heat-input-modal').classList.remove('show');
        showToast(isEdit ? '发情记录已更新' : '💦 已记录发情，禁欲归零', 'success');
        
        if (configs.notifySettings?.heatNotify !== false) {
            triggerHeatPush(user);
        }

        window.updateHeatUI();
        if (typeof render === 'function') render();
        // 修复：同步刷新设置面板里的发情修正列表
        if (window.renderHeatFixPanel) window.renderHeatFixPanel();
    };

    async function triggerHeatPush(user) {
        if (configs.notifySettings && configs.notifySettings.global_testing) return;
        if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return;
        try {
            if (typeof autoSyncToGitHub === 'function') await autoSyncToGitHub(true);
            await ghFetch(`/repos/${ghConfig.user}/${ghConfig.repo}/actions/workflows/push.yml/dispatches`, {
                method: 'POST',
                headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref: 'main', inputs: { trigger_from: 'heat_' + user, test_mode: 'false' } })
            });
            console.log('已触发发情通知');
        } catch(e) {
            console.warn('触发发情通知失败', e);
        }
    }

    if (window.render) {
        const originalRender = window.render;
        window.render = function() {
            originalRender.apply(this, arguments);
            window.updateHeatUI();
        };
    }
    if (window.chooseIdentity) {
        const originalChooseIdentity = window.chooseIdentity;
        window.chooseIdentity = function() {
            originalChooseIdentity.apply(this, arguments);
            window.updateHeatUI();
        };
    }
    if (window.setMode) {
        const originalSetMode = window.setMode;
        window.setMode = function(mode) {
            originalSetMode.apply(this, arguments);
            if (mode === 'daily' && typeof configs !== 'undefined') {
                configs.showHeatCard = false;
                if (window.saveSettings) window.saveSettings(true);
            }
            window.updateHeatUI();
        };
    }

    setTimeout(window.updateHeatUI, 100);
});