let currentFixTarget = null;

window.setQuickTime = function(type) {
    if (!currentFixTarget) return;
    const { user, type: recType } = currentFixTarget;
    let goal = configs.goals?.[user]?.[recType] || '00:00';
    if (type === 'ontime') {
        document.getElementById('custom-time-input').value = goal;
    } else {
        let h = parseInt(goal.split(':')[0]), m = parseInt(goal.split(':')[1]);
        h = (h + 1) % 24;
        document.getElementById('custom-time-input').value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
};

window.editFixRecord = function(user, type, label, dateStr, currentTime) {
    currentFixTarget = { user, type, label, dateStr };
    const titleEl = document.getElementById('custom-time-title');
    if (titleEl) titleEl.textContent = `修改 ${label} 打卡时间`;
    const inputEl = document.getElementById('custom-time-input');
    if (inputEl) {
        inputEl.value = currentTime || configs.goals?.[user]?.[type] || '23:00';
    }
    const modal = document.getElementById('custom-time-modal');
    if (modal) modal.classList.add('show');
};

// 特殊处理：针对多段睡眠的小睡记录修改
window.editSubSleepRecord = function(user, dateStr, index) {
    const rec = db[user]?.[dateStr]?.sleep?.records?.[index];
    if (!rec) return;
    currentFixTarget = { user, type: 'sleep_sub', label: '小睡', dateStr, index };
    const titleEl = document.getElementById('custom-time-title');
    if (titleEl) titleEl.textContent = `修改小睡时间`;
    const inputEl = document.getElementById('custom-time-input');
    if (inputEl) {
        inputEl.value = rec.time || '12:00';
    }
    const modal = document.getElementById('custom-time-modal');
    if (modal) modal.classList.add('show');
};

window.deleteSubSleepRecord = function(user, dateStr, index) {
    window.showCustomConfirm('🗑️ 删除小睡记录', '确定要删除这条小睡记录吗？', () => {
        if (!db[user]?.[dateStr]?.sleep?.records) return;
        db[user][dateStr].sleep.records.splice(index, 1);
        // 如果删空了，清理整个睡眠记录
        if (db[user][dateStr].sleep.records.length === 0) {
            delete db[user][dateStr].sleep;
            if (Object.keys(db[user][dateStr]).length === 0) delete db[user][dateStr];
        } else {
            // 重新计算主记录时间
            const mainRec = db[user][dateStr].sleep.records.find(r => r.type === 'main') || db[user][dateStr].sleep.records[0];
            db[user][dateStr].sleep.time = mainRec.time;
            db[user][dateStr].sleep.ontime = mainRec.ontime;
        }
        saveLocalData();
        window.renderFixPanel();
        showToast('已删除小睡记录', 'late');
    });
};

window.closeCustomTimeModal = function() { 
    const modal = document.getElementById('custom-time-modal'); 
    if (modal) modal.classList.remove('show'); 
    currentFixTarget = null; 
};

window.submitCustomTime = function(action) { 
    if (!currentFixTarget) return; 
    const { user, type, dateStr, index } = currentFixTarget; 
    if (!db[user]) db[user] = {}; 
    if (!db[user][dateStr]) db[user][dateStr] = {}; 
    
    if (action === 'clear') { 
        if (type === 'sleep_sub') {
            window.deleteSubSleepRecord(user, dateStr, index);
            closeCustomTimeModal();
            return;
        }
        delete db[user][dateStr][type]; 
        if (Object.keys(db[user][dateStr]).length === 0) delete db[user][dateStr]; 
        showToast('已取消打卡', 'late'); 
    } else { 
        const inputEl = document.getElementById('custom-time-input'); 
        if (!inputEl) return; 
        const timeVal = inputEl.value; 
        if (!/^\d{1,2}:\d{2}$/.test(timeVal)) { 
            showToast('请输入有效的时间格式 (HH:mm)', 'late'); 
            return; 
        } 
        const parts = timeVal.split(':'); 
        const timeFormatted = parts[0].padStart(2, '0') + ':' + parts[1]; 
        const ontime = checkGoal(user, type === 'sleep_sub' ? 'sleep' : type, timeFormatted); 
        
        if (type === 'sleep_sub') {
            // 修改现有的小睡记录
            const rec = db[user][dateStr].sleep.records[index];
            if (rec) {
                rec.time = timeFormatted;
                rec.ontime = ontime;
                rec.timestamp = new Date(`${dateStr}T${timeFormatted}:00`).getTime();
            }
        } else {
            // 如果是整体睡眠，直接覆盖主记录
            db[user][dateStr][type] = { done: true, time: timeFormatted, ontime: ontime, records: [{ time: timeFormatted, ontime: ontime, timestamp: Date.now(), type: 'main' }] }; 
        }
        showToast('时间修正成功！', 'success'); 
    } 
    saveLocalData(); 
    window.renderFixPanel(); 
    closeCustomTimeModal(); 
};

window.toggleFixStatus = function(user, type, dateStr) {
    if (!db[user]) db[user] = {};
    if (!db[user][dateStr]) db[user][dateStr] = {};
    let cur = db[user][dateStr][type];
    
    const getGoalTime = (addHour = false) => {
        let goal = configs.goals?.[user]?.[type] || '00:00';
        if (!addHour) return goal;
        let h = parseInt(goal.split(':')[0]), m = parseInt(goal.split(':')[1]);
        h = (h + 1) % 24;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    };

    if (!cur || !cur.done) {
        db[user][dateStr][type] = { done: true, time: getGoalTime(false), ontime: true, records: [{ time: getGoalTime(false), ontime: true, timestamp: Date.now(), type: 'main' }] };
    } else if (cur.ontime) {
        db[user][dateStr][type] = { done: true, time: getGoalTime(true), ontime: false, records: [{ time: getGoalTime(true), ontime: false, timestamp: Date.now(), type: 'main' }] };
    } else {
        delete db[user][dateStr][type];
        if (Object.keys(db[user][dateStr]).length === 0) delete db[user][dateStr];
    }
    saveLocalData();
    window.renderFixPanel();
    showToast('状态已快捷切换', 'success');
};

window.renderFixPanel = function() { 
    const dateEl = document.getElementById('cfg-fix-date'); 
    const panel = document.getElementById('fix-panel'); 
    if (!dateEl || !panel) return; 
    const dateStr = dateEl.value; 
    if (!dateStr) { panel.innerHTML = ''; return; } 
    const t = P().texts || DEFAULT_TEXTS_DAILY; 
    const masterShort = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生'); 
    const doggyShort = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝'); 
    const isService = configs.mode === 'service';
    
    const buildItem = (user, type, label, icon) => {
        const rec = db[user]?.[dateStr]?.[type];
        const isDone = rec && rec.done;
        
        let mainTime = isDone ? (rec.time || '手动') : '--:--';
        let subSleepsHtml = '';
        
        // 如果是睡眠，且存在多条记录，展示详细列表
        if (type === 'sleep' && isDone && rec.records && rec.records.length > 1) {
            const subs = rec.records.filter(r => r.type === 'sub');
            if (subs.length > 0) {
                subSleepsHtml = `<div style="width:100%; margin-top: 8px; background: var(--settings-bg); border-radius: 8px; padding: 8px; display:flex; flex-direction:column; gap:6px; border: 1px dashed var(--border);">
                    <div style="font-size:0.75rem; font-weight:bold; color:var(--text-muted);">包含以下小睡：</div>
                    ${subs.map((r, i) => {
                        // 找到在原数组中的真实索引
                        const realIndex = rec.records.indexOf(r);
                        return `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding: 4px 8px; background:var(--card-bg); border-radius:6px;">
                            <span style="color:var(--text);">💤 ${r.time}</span>
                            <div>
                                <button class="fix-action-btn edit" style="padding:2px 6px;" onclick="event.stopPropagation(); window.editSubSleepRecord('${user}', '${dateStr}', ${realIndex})">改</button>
                                <button class="fix-action-btn delete" style="padding:2px 6px;" onclick="event.stopPropagation(); window.deleteSubSleepRecord('${user}', '${dateStr}', ${realIndex})">删</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
            }
        }
        
        const isDoggy = user === 'doggy';
        let statusText = '未打卡';
        let badgeClass = 'none';
        if (isDone) {
            if (isService && isDoggy) {
                statusText = rec.ontime ? '服从' : '抗命';
            } else {
                statusText = rec.ontime ? '达标' : '迟到';
            }
            badgeClass = rec.ontime ? 'success' : 'late';
        }
        
        const badgeHtml = `<span class="fix-badge ${badgeClass}">${statusText}</span>`;
        
        const editBtn = `<button class="fix-action-btn edit" onclick="event.stopPropagation(); window.editFixRecord('${user}', '${type}', '${label}', '${dateStr}', '${isDone ? rec.time : ''}')">修改</button>`;
        const delBtn = isDone ? `<button class="fix-action-btn delete" onclick="event.stopPropagation(); window.clearFixRecord('${user}', '${type}', '${dateStr}')">清除</button>` : '';

        return `
        <div class="fix-item" style="flex-direction:column; align-items:flex-start; padding: 12px 16px; gap: 8px; cursor: default;" title="点击上方按钮可快捷切换状态">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; cursor:pointer;" onclick="window.toggleFixStatus('${user}', '${type}', '${dateStr}')">
                <div class="fix-item-left">
                    <span class="fix-item-icon">${icon}</span>
                    <span class="fix-item-label">${label}</span>
                    ${badgeHtml}
                </div>
                <div class="fix-item-right">
                    <span class="fix-item-time ${isDone ? 'active' : ''}">${mainTime}</span>
                    ${editBtn}
                    ${delBtn}
                </div>
            </div>
            ${subSleepsHtml}
        </div>`;
    };

    panel.innerHTML = `
    <div class="fix-card-group">
        <div class="fix-user-title">👑 ${masterShort}</div>
        ${buildItem('master', 'sleep', '休息', '🌙')}
        ${buildItem('master', 'wake', '起床', '☀️')}
    </div>
    <div class="fix-card-group">
        <div class="fix-user-title">🎀 ${doggyShort}</div>
        ${buildItem('doggy', 'sleep', '睡觉', '🛏️')}
        ${buildItem('doggy', 'wake', '起床', '🌸')}
    </div>
    `;
};

window.clearFixRecord = function(user, type, dateStr) {
    if (!db[user] || !db[user][dateStr]) return;
    delete db[user][dateStr][type];
    if (Object.keys(db[user][dateStr]).length === 0) delete db[user][dateStr];
    saveLocalData();
    window.renderFixPanel();
    showToast('已清除该条记录', 'late');
};