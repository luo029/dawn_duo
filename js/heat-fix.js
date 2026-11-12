document.addEventListener('DOMContentLoaded', () => {
    const modal = document.createElement('div');
    modal.className = 'sub-modal';
    modal.id = 'heat-fix-modal';
    modal.innerHTML = `
        <div class="sub-modal-box" style="max-width:320px;">
            <div class="sub-modal-head"><h3 id="heat-fix-modal-title">修改发情记录</h3><button class="close-btn" onclick="document.getElementById('heat-fix-modal').classList.remove('show')">✕</button></div>
            <div style="padding: 10px 0;">
                <div class="form-group"><label>日期</label><input type="date" id="heat-fix-date" disabled style="opacity:0.6;"></div>
                <div class="form-group"><label>具体时间 (24小时制)</label><input type="time" id="heat-fix-time" style="font-size:1.2rem; text-align:center; padding:10px;"></div>
                <div class="form-group"><label>感受 (可选)</label><input type="text" id="heat-fix-feeling" placeholder="例如：非常想要..."></div>
            </div>
            <div class="sub-modal-foot">
                <button class="btn outline" onclick="document.getElementById('heat-fix-modal').classList.remove('show')">取消</button>
                <button class="btn primary" onclick="window.submitHeatFix()">保存</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    let currentFixTarget = null;

    window.renderHeatFixPanel = function() {
        try {
            const dateEl = document.getElementById('cfg-heat-fix-date');
            const panel = document.getElementById('heat-fix-panel');
            if (!dateEl || !panel) return;
            const dateStr = dateEl.value;
            if (!dateStr) { panel.innerHTML = ''; return; }
            
            const t = (window.P && P().texts) ? P().texts : DEFAULT_TEXTS_DAILY;
            const mName = getPureName(t.masterName) || '主人';
            const dName = getPureName(t.doggyName) || '小狗';
            
            const buildRow = (user, name) => {
                // 修复：不能用 window.heatDb 判断，全局 let 变量不会挂载到 window 上
                const rec = (typeof heatDb !== 'undefined' && heatDb[user]) ? heatDb[user][dateStr] : null;
                const isDone = !!rec;
                const timeText = isDone ? rec.time : '--:--';
                const feelingText = isDone ? (rec.feeling || '无感受记录') : '未记录';
                const safeFeeling = isDone ? (rec.feeling || '').replace(/'/g, "\\'").replace(/"/g, '&quot;') : '';
                
                // 修复：非本人不能编辑
                const isMe = (typeof identity === 'undefined' || identity === 'both' || identity === user);
                let actionHtml = '';
                if (isMe) {
                    actionHtml = `<div style="display:flex; gap:8px;">
                        <button class="fix-action-btn edit" onclick="window.openHeatFixModal('${user}', '${dateStr}', '${isDone ? rec.time : ''}', '${safeFeeling}')">${isDone ? '修改' : '补录'}</button>
                        ${isDone ? `<button class="fix-action-btn delete" onclick="window.clearHeatFix('${user}', '${dateStr}')">清除</button>` : ''}
                    </div>`;
                } else {
                    actionHtml = `<span style="font-size:0.75rem; color:var(--text-muted);">👀 只读</span>`;
                }

                return `
                <div class="fix-item" style="flex-direction:column; align-items:flex-start; gap:8px; padding:12px;">
                    <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span class="fix-item-label">${user === 'master' ? '👑' : '🎀'} ${name}</span>
                            <span class="fix-badge ${isDone ? 'late' : 'none'}">${isDone ? '已发情' : '未发情'}</span>
                        </div>
                        ${actionHtml}
                    </div>
                    ${isDone ? `<div style="font-size:0.75rem; color:var(--text-muted); width:100%;">时间: <span style="color:var(--text); font-weight:bold; font-family:'DIN Alternate';">${timeText}</span> | 感受: ${feelingText}</div>` : ''}
                </div>`;
            };

            panel.innerHTML = `
                <div class="fix-card-group">${buildRow('master', mName)}</div>
                <div class="fix-card-group" style="margin-top: 12px;">${buildRow('doggy', dName)}</div>
            `;
        } catch (e) {
            console.error('发情记录渲染失败', e);
            const panel = document.getElementById('heat-fix-panel');
            if (panel) panel.innerHTML = '<div style="color:var(--warn); font-size:0.8rem; padding:10px; text-align:center;">渲染失败，请刷新页面重试</div>';
        }
    };

    window.openHeatFixModal = function(user, dateStr, time, feeling) {
        currentFixTarget = { user, dateStr };
        document.getElementById('heat-fix-modal-title').textContent = time ? '修改发情记录' : '补录发情记录';
        document.getElementById('heat-fix-date').value = dateStr;
        document.getElementById('heat-fix-time').value = time || '12:00';
        document.getElementById('heat-fix-feeling').value = feeling || '';
        document.getElementById('heat-fix-modal').classList.add('show');
    };

    window.submitHeatFix = function() {
        if (!currentFixTarget) return;
        const { user, dateStr } = currentFixTarget;
        const timeVal = document.getElementById('heat-fix-time').value;
        const feeling = document.getElementById('heat-fix-feeling').value.trim();
        
        if (!/^\d{1,2}:\d{2}$/.test(timeVal)) return showToast('请输入有效的时间格式', 'late');
        
        const parts = timeVal.split(':');
        const timeFormatted = parts[0].padStart(2, '0') + ':' + parts[1];
        const ts = new Date(`${dateStr}T${timeFormatted}:00`).getTime();
        
        if (typeof heatDb === 'undefined') window.heatDb = { master: {}, doggy: {} };
        if (!heatDb[user]) heatDb[user] = {};
        heatDb[user][dateStr] = { ts, time: timeFormatted, feeling };
        
        localStorage.setItem('dawn-duo-heat-data', JSON.stringify(heatDb));
        if (typeof debounceSync === 'function') debounceSync();
        
        document.getElementById('heat-fix-modal').classList.remove('show');
        showToast('记录已更新', 'success');
        window.renderHeatFixPanel();
        if (window.updateHeatUI) window.updateHeatUI();
    };

    window.clearHeatFix = function(user, dateStr) {
        if (typeof heatDb === 'undefined' || !heatDb[user]?.[dateStr]) return;
        window.showCustomConfirm('🗑️ 删除记录', '确定要删除这条发情记录吗？', () => {
            delete heatDb[user][dateStr];
            localStorage.setItem('dawn-duo-heat-data', JSON.stringify(heatDb));
            if (typeof debounceSync === 'function') debounceSync();
            showToast('已删除记录', 'late');
            window.renderHeatFixPanel();
            if (window.updateHeatUI) window.updateHeatUI();
        });
    };
});