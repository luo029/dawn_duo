window.getTabMsgsHTML = () => `
<div class="tab-content" id="tab-msgs">
  <div class="config-card">
    <div class="config-title">🎭 打卡弹窗设置</div>
    <div class="form-group" style="margin-bottom: 12px;">
      <label>多段睡眠弹窗</label>
      <div class="flex-btn-group">
        <button class="btn outline" data-user="master" onclick="openSleepTextModal('master')">👑 主人版</button>
        <button class="btn outline" data-user="doggy" onclick="openSleepTextModal('doggy')">🎀 小狗版</button>
        <button class="btn outline" data-user="both" onclick="openSleepTextModal('both')">🍉 共用版</button>
      </div>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label>起床打卡弹窗</label>
      <div class="flex-btn-group">
        <button class="btn outline" data-user="master" onclick="openWakeTextModal('master')">👑 主人版</button>
        <button class="btn outline" data-user="doggy" onclick="openWakeTextModal('doggy')">🎀 小狗版</button>
        <button class="btn outline" data-user="both" onclick="openWakeTextModal('both')">🍉 共用版</button>
      </div>
    </div>
  </div>
  
  <div class="config-card">
    <div class="config-title">💬 专属提醒与文案</div>
    <div class="dual-tabs">
      <button class="btn dual-tab-btn active" data-target="master" onclick="switchDualSettings('master', this)">👑 <span class="text-master-name"></span></button>
      <button class="btn dual-tab-btn" data-target="doggy" onclick="switchDualSettings('doggy', this)">🎀 <span class="text-doggy-name"></span></button>
    </div>

    <div class="dual-user-group" data-active="master">
      <div data-user="master">
        <div class="config-title" style="margin-top:10px;">👑 <span class="text-master-name"></span> 提醒文案</div>
        <div class="section-label">🔔 定时通知 (系统推送)</div>
        <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('master_sleep')">休息提醒</button><button class="btn outline" onclick="openNotifyTextModal('master_wake')">起床提醒</button></div>
        <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('master_sleep_overtime')">熬夜警告</button><button class="btn outline" onclick="openNotifyTextModal('master_wake_overtime')">赖床警告</button></div>
        <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('partner_doggy_sleep')"><span class="text-doggy-name"></span>已休息</button><button class="btn outline" onclick="openNotifyTextModal('partner_doggy_wake')"><span class="text-doggy-name"></span>已起床</button></div>
        <div class="flex-btn-group two-cols"><button class="btn outline" onclick="openNotifyTextModal('partner_doggy_heat')"><span class="text-doggy-name"></span>发情了</button></div>
        <div class="section-label">📱 页面状态展示</div>
        <div class="flex-btn-group two-cols"><button class="btn outline" onclick="openStatusTextModal('status_master_sleep')"><span class="text-master-name"></span> 休息中</button><button class="btn outline" onclick="openStatusTextModal('status_master_wake')"><span class="text-master-name"></span> 已醒来</button></div>

        <div class="config-title" style="margin-top:20px;">👑 <span class="text-master-name"></span> 随机打卡文案</div>
        <div class="flex-btn-group">
          <button class="msg-entry-btn" onclick="openSubMsg('master_sleep_success', '休息(达标)')"><span class="msg-entry-title">休息(达标)</span><span class="msg-entry-count" id="cnt_master_sleep_success">0 条</span></button>
          <button class="msg-entry-btn" onclick="openSubMsg('master_sleep_late', '休息(晚睡)')"><span class="msg-entry-title">休息(晚睡)</span><span class="msg-entry-count" id="cnt_master_sleep_late">0 条</span></button>
          <button class="msg-entry-btn" onclick="openSubMsg('master_wake_success', '起床(达标)')"><span class="msg-entry-title">起床(达标)</span><span class="msg-entry-count" id="cnt_master_wake_success">0 条</span></button>
          <button class="msg-entry-btn" onclick="openSubMsg('master_wake_late', '起床(赖床)')"><span class="msg-entry-title">起床(赖床)</span><span class="msg-entry-count" id="cnt_master_wake_late">0 条</span></button>
        </div>
      </div>

      <div data-user="doggy" style="display: none;">
        <div class="config-title doggy-title" style="margin-top:10px;">🎀 <span class="text-doggy-name"></span> 提醒文案</div>
        <div class="section-label">🔔 定时通知 (系统推送)</div>
        <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('doggy_sleep')">休息提醒</button><button class="btn outline" onclick="openNotifyTextModal('doggy_wake')">起床提醒</button></div>
        <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('doggy_sleep_overtime')">熬夜警告</button><button class="btn outline" onclick="openNotifyTextModal('doggy_wake_overtime')">赖床警告</button></div>
        <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('partner_master_sleep')"><span class="text-master-name"></span>已休息</button><button class="btn outline" onclick="openNotifyTextModal('partner_master_wake')"><span class="text-master-name"></span>已起床</button></div>
        <div class="flex-btn-group two-cols"><button class="btn outline" onclick="openNotifyTextModal('partner_master_heat')"><span class="text-master-name"></span>发情了</button></div>
        <div class="section-label">📱 页面状态展示</div>
        <div class="flex-btn-group two-cols"><button class="btn outline" onclick="openStatusTextModal('status_doggy_sleep')"><span class="text-doggy-name"></span> 休息中</button><button class="btn outline" onclick="openStatusTextModal('status_doggy_wake')"><span class="text-doggy-name"></span> 已醒来</button></div>

        <div class="config-title doggy-title" style="margin-top:20px;">🎀 <span class="text-doggy-name"></span> 随机打卡文案</div>
        <div class="flex-btn-group">
          <button class="msg-entry-btn" onclick="openSubMsg('doggy_sleep_success', '休息(达标)')"><span class="msg-entry-title">休息(达标)</span><span class="msg-entry-count" id="cnt_doggy_sleep_success">0 条</span></button>
          <button class="msg-entry-btn" onclick="openSubMsg('doggy_sleep_late', '休息(晚睡)')"><span class="msg-entry-title">休息(晚睡)</span><span class="msg-entry-count" id="cnt_doggy_sleep_late">0 条</span></button>
          <button class="msg-entry-btn" onclick="openSubMsg('doggy_wake_success', '起床(达标)')"><span class="msg-entry-title">起床(达标)</span><span class="msg-entry-count" id="cnt_doggy_wake_success">0 条</span></button>
          <button class="msg-entry-btn" onclick="openSubMsg('doggy_wake_late', '起床(赖床)')"><span class="msg-entry-title">起床(赖床)</span><span class="msg-entry-count" id="cnt_doggy_wake_late">0 条</span></button>
        </div>
      </div>
    </div>
  </div>

  <div class="config-card">
    <div class="config-title">📥 文案库导入<span class="help-icon" data-tip="支持 .txt / .md / .json 格式，系统会按行读取，并自动检索本地库中相似度大于 70% 的文案进行过滤提示。">i</span></div>
    <button class="btn outline" style="width: 100%;" onclick="document.getElementById('import-lib-file').click()">📂 选择文件导入文库</button>
    <input type="file" id="import-lib-file" accept=".txt,.md,.json" style="display: none;" onchange="readLibraryFile(event)">
  </div>
</div>`;

window.openVarsHelpModal = function() { document.getElementById('vars-help-modal').classList.add('show'); };

window.openWakeTextModal = function(role) { const wTexts = P().wakeTexts?.[role] || (configs.mode === 'service' ? DEFAULT_WAKE_TEXTS_SERVICE[role] : DEFAULT_WAKE_TEXTS_DAILY[role]) || {}; document.getElementById('cfg-wake-role').value = role; document.getElementById('cfg-wake-title').value = wTexts.title || ''; document.getElementById('cfg-wake-desc').value = wTexts.desc || ''; document.getElementById('cfg-wake-confirm').value = wTexts.confirm || ''; document.getElementById('cfg-wake-cancel').value = wTexts.cancel || ''; document.getElementById('wake-text-modal').classList.add('show'); };
window.saveWakeTextModal = function() { const role = document.getElementById('cfg-wake-role').value; const prof = P(); if (!prof.wakeTexts) prof.wakeTexts = {}; prof.wakeTexts[role] = { title: document.getElementById('cfg-wake-title').value.trim(), desc: document.getElementById('cfg-wake-desc').value.trim(), confirm: document.getElementById('cfg-wake-confirm').value.trim(), cancel: document.getElementById('cfg-wake-cancel').value.trim() }; try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {} document.getElementById('wake-text-modal').classList.remove('show'); if (window.debounceSync) debounceSync(); showToast('起床弹窗文案已保存', 'success'); };

let currentNotifyKey = '';
window.openNotifyTextModal = function(key) { 
    currentNotifyKey = key; const nTexts = P().notifyTexts || {}; let obj = nTexts[key]; 
    if (!obj) obj = { channel: 'both', texts: [] }; 
    if (Array.isArray(obj)) obj = { channel: 'both', texts: obj }; 
    
    // 确保 texts 是个数组
    if (!Array.isArray(obj.texts)) obj.texts = [obj.texts || ''];

    const isService = configs.mode === 'service', mTitle = isService ? '主人' : '先生', dTitle = isService ? '小狗' : '宝宝'; 
    const nameMap = { master_sleep: `${mTitle} - 到点休息`, master_wake: `${mTitle} - 到点起床`, doggy_sleep: `${dTitle} - 到点休息`, doggy_wake: `${dTitle} - 到点起床`, overtime_sleep: '熬夜超时警告 (通用)', overtime_wake: '赖床超时警告 (通用)', master_sleep_overtime: `${mTitle} - 熬夜超时警告`, master_wake_overtime: `${mTitle} - 赖床超时警告`, doggy_sleep_overtime: `${dTitle} - 熬夜超时警告`, doggy_wake_overtime: `${dTitle} - 赖床超时警告`, partner_master_sleep: `对方 - ${mTitle}休息`, partner_master_wake: `对方 - ${mTitle}起床`, partner_doggy_sleep: `对方 - ${dTitle}休息`, partner_doggy_wake: `对方 - ${dTitle}起床`, partner_master_heat: `对方 - ${mTitle}发情`, partner_doggy_heat: `对方 - ${dTitle}发情` }; 
    const defaultTitles = { master_sleep: '🌙 休息提醒', master_wake: '☀️ 起床提醒', doggy_sleep: '🌙 休息提醒', doggy_wake: '☀️ 起床提醒', overtime_sleep: '⚠️ 熬夜警告', overtime_wake: '⚠️ 赖床警告', master_sleep_overtime: '⚠️ 熬夜警告', master_wake_overtime: '⚠️ 赖床警告', doggy_sleep_overtime: '⚠️ 熬夜警告', doggy_wake_overtime: '⚠️ 赖床警告', partner_master_sleep: '👑 主人已休息', partner_master_wake: '👑 主人已起床', partner_doggy_sleep: '🎀 小狗已休息', partner_doggy_wake: '🎀 小狗已起床', partner_master_heat: '🔥 主人发情了', partner_doggy_heat: '🔥 小狗发情了' };
    
    const titleEl = document.getElementById('notify-text-modal-title'); if (titleEl) titleEl.innerHTML = `编辑：${nameMap[key] || key} <span class="help-icon" onclick="openVarsHelpModal()">?</span>`; 
    const tipEl = document.getElementById('notify-text-default-title-tip');
    if (tipEl) tipEl.textContent = `💡 留空时将使用默认标题："${defaultTitles[key] || '🔔 契约提醒'}"`;
    
    const chkRandom = document.getElementById('notify-text-random'); if (chkRandom) chkRandom.checked = obj.texts.length > 1; 
    document.getElementById('notify-text-random-tip').style.display = chkRandom.checked ? 'none' : 'inline'; 
    
    const titleInput = document.getElementById('notify-text-title'); 
    if (titleInput) titleInput.value = obj.title || '';
    
    const chanEl = document.getElementById('notify-text-channel'); 
    if (chanEl) chanEl.value = obj.channel || 'both'; 
    
    const listEl = document.getElementById('notify-text-list'); if (!listEl) return; 
    listEl.innerHTML = ''; if (obj.texts.length === 0) obj.texts = ['']; 
    obj.texts.forEach(text => addNotifyTextItem(text)); 
    
    const modal = document.getElementById('notify-text-modal'); if (modal) modal.classList.add('show'); 
};
window.closeNotifyTextModal = function() { const modal = document.getElementById('notify-text-modal'); if (modal) modal.classList.remove('show'); };
window.addNotifyTextItem = function(text = '') { const listEl = document.getElementById('notify-text-list'); if (!listEl) return; const row = document.createElement('div'); row.className = 'msg-item'; const input = document.createElement('input'); input.type = 'text'; input.value = text; input.placeholder = '支持 {name}, {time}, {time_s}, {date}, {weekday}, {shichen}, {duration}, {mins}'; const delBtn = document.createElement('button'); delBtn.className = 'btn-del'; delBtn.type = 'button'; delBtn.textContent = '✕'; delBtn.onclick = () => row.remove(); row.appendChild(input); row.appendChild(delBtn); listEl.appendChild(row); };

window.saveNotifyTextModal = function() { 
    const listEl = document.getElementById('notify-text-list'); if (!listEl) return; 
    const inputs = listEl.querySelectorAll('input[type="text"]'); 
    let newArr = Array.from(inputs).map(inp => inp.value.trim()).filter(v => v !== ''); 
    const isRandom = document.getElementById('notify-text-random').checked; 
    if (!isRandom && newArr.length > 1) newArr = [newArr[0]]; 
    const channel = document.getElementById('notify-text-channel').value || 'both'; 
    const titleInput = document.getElementById('notify-text-title'); 
    const customTitle = titleInput ? titleInput.value.trim() : '';
    
    const prof = P(); if (!prof.notifyTexts) prof.notifyTexts = {}; 
    // 核心修复：如果输入为空，就不要存 title 字段了，这样在比对时就不会因为空字符串引发混乱
    const newObj = { channel: channel, texts: newArr.length > 0 ? newArr : [''] };
    if (customTitle) newObj.title = customTitle;
    
    prof.notifyTexts[currentNotifyKey] = newObj; 
    
    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {} 
    closeNotifyTextModal(); if (window.debounceSync) debounceSync(); 
    showToast('文案已保存', 'success'); 
};

let currentStatusKey = '';
window.openStatusTextModal = function(key) { 
    currentStatusKey = key; const nTexts = P().notifyTexts || {}; let obj = nTexts[key]; 
    if (!obj) obj = { channel: 'page', texts: [] }; 
    if (Array.isArray(obj)) obj = { channel: 'page', texts: obj }; 
    if (!Array.isArray(obj.texts)) obj.texts = [obj.texts || ''];

    const isService = configs.mode === 'service', mTitle = isService ? '主人' : '先生', dTitle = isService ? '小狗' : '宝宝'; 
    const nameMap = { status_master_sleep: `👑 ${mTitle}休息中`, status_master_wake: `👑 ${mTitle}已醒来`, status_doggy_sleep: `🎀 ${dTitle}休息中`, status_doggy_wake: `🎀 ${dTitle}已醒来` }; 
    const titleEl = document.getElementById('status-text-modal-title'); if (titleEl) titleEl.innerHTML = `编辑：${nameMap[key] || key} <span class="help-icon" onclick="openVarsHelpModal()">?</span>`; 
    const listEl = document.getElementById('status-text-list'); if (!listEl) return; 
    listEl.innerHTML = ''; if (!obj.texts || obj.texts.length === 0) obj.texts = ['']; 
    obj.texts.forEach(text => addStatusTextItem(text)); 
    const modal = document.getElementById('status-text-modal'); if (modal) modal.classList.add('show'); 
};
window.addStatusTextItem = function(text = '') { const listEl = document.getElementById('status-text-list'); if (!listEl) return; const row = document.createElement('div'); row.className = 'msg-item'; const input = document.createElement('input'); input.type = 'text'; input.value = text; input.placeholder = '支持 {name}, {time}, {shichen} 等'; const delBtn = document.createElement('button'); delBtn.className = 'btn-del'; delBtn.type = 'button'; delBtn.textContent = '✕'; delBtn.onclick = () => row.remove(); row.appendChild(input); row.appendChild(delBtn); listEl.appendChild(row); };
window.saveStatusTextModal = function() { 
    const listEl = document.getElementById('status-text-list'); if (!listEl) return; 
    const inputs = listEl.querySelectorAll('input[type="text"]'); 
    let newArr = Array.from(inputs).map(inp => inp.value.trim()).filter(v => v !== ''); 
    const prof = P(); if (!prof.notifyTexts) prof.notifyTexts = {}; 
    prof.notifyTexts[currentStatusKey] = { channel: 'page', texts: newArr.length > 0 ? newArr : [''] }; 
    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {} 
    document.getElementById('status-text-modal').classList.remove('show'); if (window.debounceSync) debounceSync(); 
    showToast('状态栏文案已保存', 'success'); 
};

window.openNotifyTestModal = function() { 
    const selectEl = document.getElementById('test-notify-key'); if (!selectEl) return; 
    const wrapperK = selectEl.closest('.custom-select-wrapper'); 
    if (wrapperK) { wrapperK.parentNode.insertBefore(selectEl, wrapperK); wrapperK.remove(); } 
    selectEl.dataset.customized = 'false'; 
    
    const isService = configs.mode === 'service', mTitle = isService ? '主人' : '先生', dTitle = isService ? '小狗' : '宝宝'; 
    const options = [ { val: 'master_sleep', text: `👑 ${mTitle} - 休息提醒` }, { val: 'master_wake', text: `👑 ${mTitle} - 起床提醒` }, { val: 'doggy_sleep', text: `🎀 ${dTitle} - 休息提醒` }, { val: 'doggy_wake', text: `🎀 ${dTitle} - 起床提醒` }, { val: 'master_sleep_overtime', text: `⏳ ${mTitle} - 熬夜警告` }, { val: 'master_wake_overtime', text: `⏳ ${mTitle} - 赖床警告` }, { val: 'doggy_sleep_overtime', text: `⏳ ${dTitle} - 熬夜警告` }, { val: 'doggy_wake_overtime', text: `⏳ ${dTitle} - 赖床警告` }, { val: 'partner_master_sleep', text: `📡 对方 - ${mTitle}休息` }, { val: 'partner_master_wake', text: `📡 对方 - ${mTitle}起床` }, { val: 'partner_doggy_sleep', text: `📡 对方 - ${dTitle}休息` }, { val: 'partner_doggy_wake', text: `📡 对方 - ${dTitle}起床` }, { val: 'partner_master_heat', text: `🔥 对方 - ${mTitle}发情` }, { val: 'partner_doggy_heat', text: `🔥 对方 - ${dTitle}发情` } ]; 
    selectEl.innerHTML = options.map(o => `<option value="${o.val}">${o.text}</option>`).join(''); 

    const targetSelect = document.getElementById('test-notify-target');
    if (targetSelect) {
        if (window.initCustomSelects) window.initCustomSelects();
        targetSelect.innerHTML = '<option value="all">全部授权设备</option>';
        if (window.refreshCustomSelects) window.refreshCustomSelects();

        if (ghConfig.user && ghConfig.repo && ghConfig.token) {
            fetchGHFile('subscriptions.json').then(res => {
                if (res && res.content) {
                    let html = '<option value="all">全部授权设备</option>';
                    const subs = JSON.parse(res.content);
                    subs.forEach((sub, idx) => {
                        let dName = sub.device || '未知设备';
                        let id = sub.identity || 'both';
                        let idText = id === 'master' ? '主人' : (id === 'doggy' ? '小狗' : '滴滴');
                        html += `<option value="${sub.endpoint.slice(-20)}">${dName} (${idText})</option>`;
                    });
                    targetSelect.innerHTML = html;
                    if (window.refreshCustomSelects) window.refreshCustomSelects();
                }
            }).catch(e => console.warn('拉取设备列表失败', e));
        }
    }

    if (window.initCustomSelects) window.initCustomSelects(); 
    toggleTestTarget();
    updateTestPreview(); 
    document.getElementById('notify-test-modal').classList.add('show'); 
};

window.toggleTestTarget = function() {
    const chanEl = document.getElementById('test-notify-channel');
    const targetEl = document.getElementById('test-notify-target');
    if (!chanEl || !targetEl) return;
    const targetGroup = targetEl.closest('.form-group');
    if (targetGroup) targetGroup.style.display = 'block';
};

window.updateTestPreview = function() { 
    const key = document.getElementById('test-notify-key').value; 
    const prof = P(); const nTexts = prof.notifyTexts || {}; let obj = nTexts[key] || { texts: [] }; if (Array.isArray(obj)) obj = { channel: 'both', texts: obj }; 
    const defaultTitles = { master_sleep: '🌙 休息提醒', master_wake: '☀️ 起床提醒', doggy_sleep: '🌙 休息提醒', doggy_wake: '☀️ 起床提醒', overtime_sleep: '⚠️ 熬夜警告', overtime_wake: '⚠️ 赖床警告', master_sleep_overtime: '⚠️ 熬夜警告', master_wake_overtime: '⚠️ 赖床警告', doggy_sleep_overtime: '⚠️ 熬夜警告', doggy_wake_overtime: '⚠️ 赖床警告', partner_master_sleep: '👑 主人已休息', partner_master_wake: '👑 主人已起床', partner_doggy_sleep: '🎀 小狗已休息', partner_doggy_wake: '🎀 小狗已起床', partner_master_heat: '🔥 主人发情了', partner_doggy_heat: '🔥 小狗发情了' }; 
    const title = obj.title || defaultTitles[key] || '🔔 契约提醒'; 
    let body = ''; if (obj.texts && obj.texts.length > 0) { body = getRandomText(obj.texts); } 
    if (!body) body = '你有一条新的提醒'; 
    const isService = configs.mode === 'service'; 
    const mName = getPureName(P().texts.masterName) || (isService ? '主人' : '先生'); 
    const dName = getPureName(P().texts.doggyName) || (isService ? '小狗' : '宝宝'); 
    
    const nowTime = formatCheckinTime(configs.timeZones.master); 
    const nowTimeS = nowTime + ':30';
    const mHour = parseInt(nowTime.split(':')[0], 10);
    const shichenInfo = getShichenInfo(isNaN(mHour) ? 0 : mHour);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dObj = new Date();

    let rName = mName; if (key.includes('doggy')) rName = dName; 
    
    let rDuration = '0 m';
    let rMins = '0';
    if (key.includes('overtime')) {
        rDuration = '2 h 30 m'; 
        rMins = '150';
    }

    body = body.replace(/{name}/g, rName)
               .replace(/{time_s}/g, nowTimeS)
               .replace(/{time}/g, nowTime)
               .replace(/{date}/g, `${dObj.getMonth()+1}月${dObj.getDate()}日`)
               .replace(/{weekday}/g, weekdays[dObj.getDay()])
               .replace(/{shichen_time}/g, shichenInfo.time)
               .replace(/{shichen}/g, shichenInfo.name)
               .replace(/{shichen_organ}/g, shichenInfo.organ)
               .replace(/{duration}/g, rDuration)
               .replace(/{mins}/g, rMins)
               .replace(/{feeling}/g, '（测试感受）');
    document.getElementById('test-notify-title-preview').textContent = title; 
    document.getElementById('test-notify-body-preview').textContent = body; 
};

window.triggerTestNotification = async function() { 
    if (!notificationSupported()) return showToast('当前浏览器不支持通知', 'late'); 
    if (!window.isSecureContext) return showToast('⚠️ 必须在 HTTPS 下', 'late'); 
    const channel = document.getElementById('test-notify-channel').value; 
    const title = document.getElementById('test-notify-title-preview').textContent; 
    const body = document.getElementById('test-notify-body-preview').textContent; 
    
    const targetSelect = document.getElementById('test-notify-target');
    const target = targetSelect ? targetSelect.value : 'all';

    if (channel === 'local') { 
        let perm = Notification.permission; 
        if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; } } 
        if (perm !== 'granted') return showToast('未获得通知权限，请允许', 'late'); 
        try { new Notification(title, { body: body, tag: 'dawn-test-' + Date.now(), requireInteraction: true }); showToast('页面通知已发送', 'success'); } catch (e) { showToast('发送失败：' + e.message, 'late'); } 
    } else if (channel === 'push') { 
        if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return showToast('请先配置 GitHub Token 才能测试云端推送', 'late'); 
        showToast('正在请求云端发送...', 'success'); 
        try { 
            const res = await ghFetch(`/repos/${ghConfig.user}/${ghConfig.repo}/actions/workflows/push.yml/dispatches`, { 
                method: 'POST', 
                headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    ref: 'main', 
                    inputs: { 
                        test_mode: 'true',
                        custom_title: title,
                        custom_body: body,
                        test_target: target
                    } 
                }) 
            }); 
            if (res.ok) { showToast('✅ 已触发云端推送，请留意设备通知', 'success'); document.getElementById('notify-test-modal').classList.remove('show'); } 
            else if (res.status === 404) { showToast('触发失败：找不到 workflow 或分支(确保默认分支为 main)', 'late'); } 
            else if (res.status === 403) { showToast('触发失败：Token 缺少 workflow 权限', 'late'); } 
            else { showToast('触发失败，请检查网络或配置', 'late'); } 
        } catch (e) { showToast('请求出错：' + e.message, 'late'); } 
    } 
};

window.openProgressTextModal = function() { let role = identity || 'both'; document.getElementById('cfg-prog-role').value = role; updateProgTextInputs(); document.getElementById('prog-text-tip').innerHTML = `当前修改的是 <b>[${modeLabel()}]</b> 模式下的加载文案。<br>你可以使用 <b>{name}</b>。`; const modal = document.getElementById('progress-text-modal'); if (modal) modal.classList.add('show'); };
window.updateProgTextInputs = function() { const pt = P().progressTexts || {}; const role = document.getElementById('cfg-prog-role').value; const arr = pt[role] || pt.both || pt; const setVal = (id, val) => { const el = document.getElementById(id); if (el) { el.value = val; el.placeholder = '默认'; } }; setVal('cfg-prog-connect', arr.connect || ''); setVal('cfg-prog-auth', arr.auth || ''); setVal('cfg-prog-sync', arr.sync || ''); setVal('cfg-prog-cancel', arr.cancel || ''); setVal('cfg-prog-success', arr.success || ''); };
window.closeProgressTextModal = function() { const prof = P(); if (!prof.progressTexts) prof.progressTexts = {}; const role = document.getElementById('cfg-prog-role').value; if (!prof.progressTexts[role]) prof.progressTexts[role] = {}; const getVal = (id, fallback) => { const el = document.getElementById(id); return el ? el.value.trim() : fallback; }; prof.progressTexts[role].connect = getVal('cfg-prog-connect', ''); prof.progressTexts[role].auth = getVal('cfg-prog-auth', ''); prof.progressTexts[role].sync = getVal('cfg-prog-sync', ''); prof.progressTexts[role].cancel = getVal('cfg-prog-cancel', ''); prof.progressTexts[role].success = getVal('cfg-prog-success', ''); try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {} const modal = document.getElementById('progress-text-modal'); if (modal) modal.classList.remove('show'); if (window.debounceSync) debounceSync(); showToast('加载文案已保存', 'success'); };

let currentMsgKey = ''; 
const MSG_KEYS = ['master_sleep_success', 'master_sleep_late', 'master_wake_success', 'master_wake_late', 'doggy_sleep_success', 'doggy_sleep_late', 'doggy_wake_success', 'doggy_wake_late'];
window.updateMsgCounts = function() { 
    const pool = P().msgPool || {}; 
    MSG_KEYS.forEach(key => { 
        const [user, type, status] = key.split('_'); 
        const arr = pool?.[user]?.[type]?.[status] || []; 
        const el = document.getElementById(`cnt_${key}`); 
        if (el) el.textContent = `${arr.length} 条`; 
    }); 
};
window.openSubMsg = function(key, title) { currentMsgKey = key; const t = P().texts || DEFAULT_TEXTS_DAILY; const name = key.startsWith('master') ? t.masterName : t.doggyName; const titleEl = document.getElementById('sub-modal-title'); if (titleEl) titleEl.textContent = `${getPureName(name)} - ${title} (${modeLabel()})`; const [user, type, status] = key.split('_'); const arr = (P().msgPool || {})?.[user]?.[type]?.[status] || []; const listEl = document.getElementById('sub-msg-list'); if (!listEl) return; listEl.innerHTML = ''; arr.forEach(text => addSubMsgItem(text)); const modal = document.getElementById('sub-modal'); if (modal) modal.classList.add('show'); };
window.closeSubMsg = function() { const modal = document.getElementById('sub-modal'); if (modal) modal.classList.remove('show'); };
window.addSubMsgItem = function(text = '') { const listEl = document.getElementById('sub-msg-list'); if (!listEl) return; const row = document.createElement('div'); row.className = 'msg-item'; const input = document.createElement('input'); input.type = 'text'; input.value = text; input.placeholder = '输入一条新文案...'; const delBtn = document.createElement('button'); delBtn.className = 'btn-del'; delBtn.type = 'button'; delBtn.textContent = '✕'; delBtn.onclick = () => row.remove(); row.appendChild(input); row.appendChild(delBtn); listEl.appendChild(row); };
window.saveSubMsg = function() { const listEl = document.getElementById('sub-msg-list'); if (!listEl) return; const inputs = listEl.querySelectorAll('input'); const newArr = Array.from(inputs).map(inp => inp.value.trim()).filter(v => v !== ''); const [user, type, status] = currentMsgKey.split('_'); const prof = P(); if (!prof.msgPool) prof.msgPool = {}; if (!prof.msgPool[user]) prof.msgPool[user] = {}; if (!prof.msgPool[user][type]) prof.msgPool[user][type] = {}; prof.msgPool[user][type][status] = newArr; if(window.updateMsgCounts) window.updateMsgCounts(); closeSubMsg(); try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) { } if (window.debounceSync) debounceSync(); };

window.openSleepTextModal = function(role) { const sTexts = P().sleepTexts?.[role] || (configs.mode === 'service' ? DEFAULT_SLEEP_TEXTS_SERVICE[role] : DEFAULT_SLEEP_TEXTS_DAILY[role]) || {}; document.getElementById('cfg-sleep-role').value = role; document.getElementById('cfg-sleep-title').value = sTexts.title || ''; document.getElementById('cfg-sleep-desc').value = sTexts.desc || ''; document.getElementById('cfg-sleep-sub').value = sTexts.sub || ''; document.getElementById('cfg-sleep-cross').value = sTexts.cross || ''; document.getElementById('cfg-sleep-overwrite').value = sTexts.overwrite || ''; document.getElementById('cfg-sleep-cancel').value = sTexts.cancel || ''; document.getElementById('sleep-text-modal').classList.add('show'); };
window.saveSleepTextModal = function() { const role = document.getElementById('cfg-sleep-role').value; const prof = P(); if (!prof.sleepTexts) prof.sleepTexts = {}; prof.sleepTexts[role] = { title: document.getElementById('cfg-sleep-title').value.trim(), desc: document.getElementById('cfg-sleep-desc').value.trim(), sub: document.getElementById('cfg-sleep-sub').value.trim(), cross: document.getElementById('cfg-sleep-cross').value.trim(), overwrite: document.getElementById('cfg-sleep-overwrite').value.trim(), cancel: document.getElementById('cfg-sleep-cancel').value.trim() }; try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {} document.getElementById('sleep-text-modal').classList.remove('show'); if (window.debounceSync) debounceSync(); showToast('多段睡眠文案已保存', 'success'); };

let parsedImportLines = [];
window.readLibraryFile = function(event) { 
    const file = event.target.files[0]; if (!file) return; 
    const reader = new FileReader(); 
    reader.onload = function(e) { 
        try { 
            const content = e.target.result; let lines = []; 
            if (file.name.endsWith('.json')) { 
                try { const parsed = JSON.parse(content); if (Array.isArray(parsed)) lines = parsed; else if (typeof parsed === 'object') lines = Object.values(parsed).flat(3).filter(v => typeof v === 'string'); } catch(err) { showToast('JSON 解析失败', 'late'); return; } 
            } else { 
                lines = content.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0); 
            } 
            if (lines.length === 0) return showToast('文件中未找到有效文字', 'late'); 
            
            const prof = P();
            const pool = prof.msgPool || {}; 
            const notifyTexts = prof.notifyTexts || {};
            const allExistingTexts = []; 
            
            const poolNames = {
                master_sleep_success: '👑 主人-休息(达标)', master_sleep_late: '👑 主人-休息(晚睡)',
                master_wake_success: '👑 主人-起床(达标)', master_wake_late: '👑 主人-起床(赖床)',
                doggy_sleep_success: '🎀 小狗-休息(达标)', doggy_sleep_late: '🎀 小狗-休息(晚睡)',
                doggy_wake_success: '🎀 小狗-起床(达标)', doggy_wake_late: '🎀 小狗-起床(赖床)',
                master_sleep: '🔔 主人-休息提醒', master_wake: '🔔 主人-起床提醒',
                doggy_sleep: '🔔 小狗-休息提醒', doggy_wake: '🔔 小狗-起床提醒',
                master_sleep_overtime: '⏳ 主人-熬夜警告', master_wake_overtime: '⏳ 主人-赖床警告',
                doggy_sleep_overtime: '⏳ 小狗-熬夜警告', doggy_wake_overtime: '⏳ 小狗-赖床警告',
                overtime_sleep: '⏳ 通用-熬夜警告', overtime_wake: '⏳ 通用-赖床警告',
                partner_master_sleep: '📡 对方-主人休息', partner_master_wake: '📡 对方-主人起床',
                partner_doggy_sleep: '📡 对方-小狗休息', partner_doggy_wake: '📡 对方-小狗起床',
                partner_master_heat: '📡 对方-主人发情', partner_doggy_heat: '📡 对方-小狗发情',
                status_master_sleep: '📱 主人-状态栏休息中', status_master_wake: '📱 主人-状态栏已醒',
                status_doggy_sleep: '📱 小狗-状态栏休息中', status_doggy_wake: '📱 小狗-状态栏已醒'
            };

            for (const u of ['master', 'doggy']) { 
                for (const t of ['sleep', 'wake']) { 
                    for (const s of ['success', 'late']) { 
                        if (pool[u]?.[t]?.[s]) {
                            pool[u][t][s].forEach(txt => allExistingTexts.push({ text: txt, poolName: poolNames[`${u}_${t}_${s}`] }));
                        } 
                    } 
                } 
            } 
            for (const key in notifyTexts) {
                if (notifyTexts[key] && notifyTexts[key].texts) {
                    notifyTexts[key].texts.forEach(txt => allExistingTexts.push({ text: txt, poolName: poolNames[key] || key }));
                }
            }
            
            parsedImportLines = lines.map(text => { 
                let matched = null;
                for (const existing of allExistingTexts) { 
                    if (getSimilarity(text, existing.text) >= 0.7) { matched = existing; break; } 
                } 
                return { text, isDuplicate: !!matched, matchSource: matched ? matched.poolName : '' }; 
            }); 
            renderImportPreview(); 
            const modal = document.getElementById('import-lib-modal'); 
            if (modal) modal.classList.add('show'); 
        } catch (err) { showToast('文件读取失败', 'late'); } 
    }; 
    reader.readAsText(file); event.target.value = ''; 
};

window.applyBatchImportTarget = function(val) { document.querySelectorAll('.import-pool-select').forEach(s => { if(!s.disabled) s.value = val; }); };
window.toggleAllImports = function(checked) { document.querySelectorAll('.import-chk').forEach(chk => { if (!chk.disabled) chk.checked = checked; }); };

function renderImportPreview() { 
    const listEl = document.getElementById('import-lib-preview-list'); 
    if (!listEl) return; 
    listEl.innerHTML = ''; 
    let dupCount = 0; 
    const fragment = document.createDocumentFragment(); 
    const defaultPool = document.getElementById('import-target-pool').value; 
    const poolOptionsHTML = document.getElementById('import-target-pool').innerHTML; 
    
    parsedImportLines.forEach((item, index) => { 
        if (item.isDuplicate) dupCount++; 
        
        const row = document.createElement('div'); 
        row.className = `import-item-row ${item.isDuplicate ? 'duplicate' : ''}`; 
        row.style.display = 'flex'; row.style.alignItems = 'flex-start'; row.style.gap = '10px'; row.style.padding = '12px'; row.style.background = 'var(--card-bg)'; row.style.marginBottom = '8px'; row.style.borderRadius = '10px'; row.style.border = '1px solid var(--border)'; row.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
        if (item.isDuplicate) row.style.opacity = '0.6';

        const chk = document.createElement('input'); 
        chk.type = 'checkbox'; chk.className = 'import-chk';
        chk.checked = !item.isDuplicate; chk.disabled = item.isDuplicate; chk.dataset.index = index; 
        chk.style.marginTop = '8px';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.style.flex = '1'; contentWrapper.style.minWidth = '0'; contentWrapper.style.display = 'flex'; contentWrapper.style.flexDirection = 'column'; contentWrapper.style.gap = '6px';

        const input = document.createElement('input'); 
        input.type = 'text'; input.value = item.text; input.className = 'import-edit-input'; 
        input.style.width = '100%'; input.style.padding = '8px 10px'; input.style.fontSize = '0.85rem'; input.style.borderRadius = '6px'; input.style.background = 'var(--input-bg)'; input.style.border = '1px solid var(--border)'; input.style.color = 'var(--text)'; 
        if (item.isDuplicate) input.disabled = true;
        contentWrapper.appendChild(input);

        if (item.isDuplicate) { 
            const badge = document.createElement('div'); badge.className = 'import-badge'; 
            badge.style.color = 'var(--warn)'; badge.style.fontSize = '0.7rem'; badge.style.fontWeight = 'bold';
            badge.textContent = `⚠️ 已在【${item.matchSource}】中`; 
            contentWrapper.appendChild(badge); 
        }

        const actionRow = document.createElement('div');
        actionRow.style.display = 'flex'; actionRow.style.gap = '8px'; actionRow.style.alignItems = 'center'; actionRow.style.flexWrap = 'wrap';

        const sel = document.createElement('select'); 
        sel.className = 'custom-import-select import-pool-select'; 
        sel.innerHTML = poolOptionsHTML; sel.value = defaultPool; 
        if (item.isDuplicate) sel.disabled = true;

        const singleBtn = document.createElement('button');
        singleBtn.className = 'btn outline';
        singleBtn.textContent = '单条导入';
        singleBtn.style.padding = '6px 12px'; singleBtn.style.fontSize = '0.75rem'; singleBtn.style.whiteSpace = 'nowrap'; singleBtn.style.borderRadius = '6px';
        
        if (item.isDuplicate) {
            singleBtn.style.display = 'none';
        } else {
            singleBtn.onclick = () => {
                const text = input.value.trim();
                if (!text) return showToast('内容为空', 'late');
                importSingleText(text, sel.value);
                row.style.opacity = '0.6';
                row.classList.add('duplicate');
                chk.checked = false; chk.disabled = true;
                input.disabled = true;
                sel.disabled = true;
                singleBtn.disabled = true;
                singleBtn.textContent = '已导入';
                singleBtn.className = 'btn';
                const doneBadge = document.createElement('div'); doneBadge.className = 'import-badge'; 
                doneBadge.style.color = 'var(--success)'; doneBadge.style.fontSize = '0.7rem'; doneBadge.style.fontWeight = 'bold';
                doneBadge.textContent = `✅ 成功导入`; 
                contentWrapper.appendChild(doneBadge);
            };
        }

        actionRow.appendChild(sel); actionRow.appendChild(singleBtn);
        contentWrapper.appendChild(actionRow);
        
        row.appendChild(chk); row.appendChild(contentWrapper);
        fragment.appendChild(row); 
    }); 
    listEl.appendChild(fragment); 
    if (dupCount > 0) showToast(`发现 ${dupCount} 条重复文案，已自动为您取消勾选`, 'late'); 
}

function doImport(text, targetKey) {
    const prof = P();
    if (targetKey.startsWith('msg_')) {
        const realKey = targetKey.replace('msg_', '');
        const [user, type, status] = realKey.split('_');
        if (!prof.msgPool) prof.msgPool = {};
        if (!prof.msgPool[user]) prof.msgPool[user] = {};
        if (!prof.msgPool[user][type]) prof.msgPool[user][type] = {};
        if (!prof.msgPool[user][type][status]) prof.msgPool[user][type][status] = [];
        prof.msgPool[user][type][status].push(text);
    } else if (targetKey.startsWith('notify_') || targetKey.startsWith('status_')) {
        if (!prof.notifyTexts) prof.notifyTexts = {};
        if (!prof.notifyTexts[targetKey]) prof.notifyTexts[targetKey] = { channel: 'both', texts: [] };
        if (!prof.notifyTexts[targetKey].texts) prof.notifyTexts[targetKey].texts = [];
        prof.notifyTexts[targetKey].texts.push(text);
    }
}

function importSingleText(text, targetKey) {
    doImport(text, targetKey);
    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {}
    if(window.updateMsgCounts) window.updateMsgCounts();
    if (window.debounceSync) window.debounceSync();
    showToast('单条导入成功', 'success');
}

window.closeImportLibModal = function() { const modal = document.getElementById('import-lib-modal'); if (modal) modal.classList.remove('show'); parsedImportLines = []; };

window.confirmImportLibrary = function() { 
    const listEl = document.getElementById('import-lib-preview-list'); if (!listEl) return; 
    const checkedBoxes = listEl.querySelectorAll('.import-chk:checked'); 
    if (checkedBoxes.length === 0) return showToast('请至少勾选一条要导入的文案', 'late'); 
    let totalAdded = 0; 
    checkedBoxes.forEach(chk => { 
        const row = chk.closest('.import-item-row'); 
        const input = row.querySelector('.import-edit-input'); 
        const sel = row.querySelector('.import-pool-select'); 
        if (!input || !sel) return; 
        const text = input.value.trim(); 
        if (!text) return; 
        doImport(text, sel.value);
        totalAdded++; 
    }); 
    try { localStorage.setItem('dawn-duo-configs', JSON.stringify(configs)); } catch (e) {} 
    if(window.updateMsgCounts) window.updateMsgCounts();
    closeImportLibModal(); 
    if (window.debounceSync) window.debounceSync(); 
    showToast(`成功导入 ${totalAdded} 条文案 💗`, 'success'); 
};