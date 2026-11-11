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

window.closeCustomTimeModal = function() { 
    const modal = document.getElementById('custom-time-modal'); 
    if (modal) modal.classList.remove('show'); 
    currentFixTarget = null; 
};

window.submitCustomTime = function(action) { 
    if (!currentFixTarget) return; 
    const { user, type, dateStr } = currentFixTarget; 
    if (!db[user]) db[user] = {}; 
    if (!db[user][dateStr]) db[user][dateStr] = {}; 
    if (action === 'clear') { 
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
        const ontime = checkGoal(user, type, timeFormatted); 
        db[user][dateStr][type] = { done: true, time: timeFormatted, ontime: ontime, records: [{ time: timeFormatted, ontime: ontime, timestamp: Date.now(), type: 'main' }] }; 
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
        const timeText = isDone ? (rec.time || '手动') : '--:--';
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
        <div class="fix-item" onclick="window.toggleFixStatus('${user}', '${type}', '${dateStr}')" title="点击快速切换状态">
            <div class="fix-item-left">
                <span class="fix-item-icon">${icon}</span>
                <span class="fix-item-label">${label}</span>
                ${badgeHtml}
            </div>
            <div class="fix-item-right">
                <span class="fix-item-time ${isDone ? 'active' : ''}">${timeText}</span>
                ${editBtn}
                ${delBtn}
            </div>
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