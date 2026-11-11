let currentFixTarget = null;
window.openCustomTimeModal = function(user, type, label, dateStr, currentTime) { currentFixTarget = { user, type, label, dateStr }; const titleEl = document.getElementById('custom-time-title'); if (titleEl) titleEl.textContent = `修改 ${label} 打卡时间`; const inputEl = document.getElementById('custom-time-input'); if (inputEl) inputEl.value = currentTime || configs.goals?.[user]?.[type] || '23:00'; const modal = document.getElementById('custom-time-modal'); if (modal) modal.classList.add('show'); };
window.closeCustomTimeModal = function() { const modal = document.getElementById('custom-time-modal'); if (modal) modal.classList.remove('show'); currentFixTarget = null; };
window.submitCustomTime = function(action) { if (!currentFixTarget) return; const { user, type, dateStr } = currentFixTarget; if (!db[user]) db[user] = {}; if (!db[user][dateStr]) db[user][dateStr] = {}; if (action === 'clear') { delete db[user][dateStr][type]; if (Object.keys(db[user][dateStr]).length === 0) delete db[user][dateStr]; showToast('已取消打卡', 'late'); } else { const inputEl = document.getElementById('custom-time-input'); if (!inputEl) return; const timeVal = inputEl.value; if (!/^\d{1,2}:\d{2}$/.test(timeVal)) { showToast('请输入有效的时间格式 (HH:mm)', 'late'); return; } const parts = timeVal.split(':'); const timeFormatted = parts[0].padStart(2, '0') + ':' + parts[1]; const ontime = checkGoal(user, type, timeFormatted); db[user][dateStr][type] = { done: true, time: timeFormatted, ontime: ontime, records: [{ time: timeFormatted, ontime: ontime, timestamp: Date.now(), type: 'main' }] }; showToast('时间修正成功！', 'success'); } saveLocalData(); window.renderFixPanel(); closeCustomTimeModal(); };

window.renderFixPanel = function() { 
    const dateEl = document.getElementById('cfg-fix-date'); 
    const panel = document.getElementById('fix-panel'); 
    if (!dateEl || !panel) return; 
    const dateStr = dateEl.value; 
    if (!dateStr) { panel.innerHTML = ''; return; } 
    const t = P().texts || DEFAULT_TEXTS_DAILY; 
    const masterShort = getPureName(t.masterName) || (configs.mode === 'service' ? '主人' : '先生'); 
    const doggyShort = getPureName(t.doggyName) || (configs.mode === 'service' ? '小狗' : '宝宝'); 
    const types = [ { user: 'master', type: 'sleep', label: `${masterShort}休息` }, { user: 'master', type: 'wake', label: `${masterShort}起床` }, { user: 'doggy', type: 'sleep', label: `${doggyShort}睡觉` }, { user: 'doggy', type: 'wake', label: `${doggyShort}起床` } ]; 
    panel.innerHTML = ''; 
    types.forEach(item => { 
        const rec = db[item.user]?.[dateStr]?.[item.type]; 
        let stateText = '未打卡', cls = ''; 
        if (rec && rec.done) { 
            if (rec.ontime) { stateText = `按时 (${rec.time || '手动'})`; cls = 'active'; } 
            else { stateText = `迟到 (${rec.time || '手动'})`; cls = 'late'; } 
        } 
        const btn = document.createElement('button'); 
        btn.className = `fix-btn ${cls}`; 
        btn.textContent = `${item.label}: ${stateText}`; 
        btn.onclick = () => { 
            if (!db[item.user]) db[item.user] = {}; 
            if (!db[item.user][dateStr]) db[item.user][dateStr] = {}; 
            let cur = db[item.user][dateStr][item.type]; 
            const getGoalTime = (addHour = false) => { 
                let goal = configs.goals?.[item.user]?.[item.type] || '00:00'; 
                if (!addHour) return goal; 
                let h = parseInt(goal.split(':')[0]), m = parseInt(goal.split(':')[1]); 
                h = (h + 1) % 24; 
                return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; 
            }; 
            if (!cur || !cur.done) { 
                db[item.user][dateStr][item.type] = { done: true, time: getGoalTime(false), ontime: true, records: [{ time: getGoalTime(false), ontime: true, timestamp: Date.now(), type: 'main' }] }; 
                saveLocalData(); 
                window.renderFixPanel(); 
            } else if (cur.ontime) { 
                db[item.user][dateStr][item.type] = { done: true, time: getGoalTime(true), ontime: false, records: [{ time: getGoalTime(true), ontime: false, timestamp: Date.now(), type: 'main' }] }; 
                saveLocalData(); 
                window.renderFixPanel(); 
            } else {
                window.openCustomTimeModal(item.user, item.type, item.label, dateStr, cur.time); 
            } 
        }; 
        panel.appendChild(btn); 
    }); 
};