window.getTabDataHTML = () => `
<div class="tab-content" id="tab-data">
  <div class="config-card">
    <div class="config-title" style="color: var(--warn); border-bottom-color: var(--warn);">🧪 全段测试模式<span class="help-icon" data-tip="开启后，一切真实推送（页面通知、定时云端、打卡触发）都将被阻断，仅保留本地测试功能。防止在调试时打扰对方。">i</span></div>
    <div class="switch-row"><label>开启全段测试模式</label><label class="toggle-switch"><input type="checkbox" id="cfg-global-testing"><span class="slider"></span></label></div>
  </div>

  <div class="config-card">
    <div class="config-title">📱 推送设备管理<span class="help-icon" data-tip="读取云端 subscriptions.json，查看目前所有绑定了推送的设备。点击垃圾桶可以彻底移除该设备授权。">i</span></div>
    <div id="device-list-container" style="margin-top: 8px;">
      <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">加载中...</div>
    </div>
  </div>
  
  <div class="config-card">
    <div class="config-title">☁️ 云端数据同步<span class="help-icon" data-tip="仓库: luo029/dawn_duo_data\n系统会自动根据您的身份，将记录分离存放到云端 (master_records.json / doggy_records.json)，互不干扰。">i</span></div>
    <div class="switch-row" style="margin-bottom: 8px; padding: 0;"><label>开启自动拉取/推送</label><label class="toggle-switch"><input type="checkbox" id="cfg-auto-sync"><span class="slider"></span></label></div>
    <div class="flex-row" style="margin-bottom: 8px;">
      <div class="form-group"><label>自动拉取间隔</label><select id="cfg-sync-interval"><option value="0">关闭</option><option value="1">1 分钟</option><option value="5">5 分钟</option><option value="15">15 分钟</option><option value="30">30 分钟</option><option value="60">1 小时</option></select></div>
      <div class="form-group" style="display:flex; align-items:center; justify-content:center;"><label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600; font-size:0.85rem;"><input type="checkbox" id="cfg-sync-prompt" style="width:16px; height:16px; accent-color: var(--tab-active);">差异时弹窗</label></div>
    </div>
    <div class="form-group" style="margin-bottom: 8px;">
        <label>GitHub API 代理地址 (可选，留空则直连)</label>
        <input type="text" id="cfg-gh-proxy" placeholder="例如 https://gh-proxy.xxx.workers.dev">
    </div>
    <div class="switch-row" style="margin-bottom: 12px;">
        <label>直连超时自动切代理<span class="help-icon" data-tip="如果直连 GitHub API 超过 3 秒未响应，将自动使用上方填写的代理地址重试。">i</span></label>
        <label class="toggle-switch"><input type="checkbox" id="cfg-gh-auto-fallback"><span class="slider"></span></label>
    </div>
    <div class="progress-area" id="sync-progress" style="display: none; margin-bottom: 12px;"><div class="progress-bar-wrap"><div class="progress-bar" id="sync-progress-bar" style="width: 0%;"></div></div><div class="progress-text" id="sync-progress-text">正在处理...</div></div>
    <div class="flex-btn-group two-cols" style="margin-top: 8px;">
      <button class="btn outline" onclick="syncFromGitHub()">⬇️ 立即拉取</button>
      <button class="btn outline" onclick="saveToGitHub()">⬆️ 立即上传</button>
    </div>
  </div>
  
  <div class="config-card">
    <div class="config-title">📤 本地导入导出</div>
    <div class="flex-btn-group two-cols" style="margin-bottom: 8px;">
      <button class="btn outline" onclick="document.getElementById('export-json-modal').classList.add('show')">📄 导出 JSON</button>
      <button class="btn outline" onclick="exportCSV()">📊 导出 CSV</button>
    </div>
    <div class="flex-btn-group two-cols" style="margin-bottom: 8px;">
      <button class="btn outline" onclick="openExportOptions('image')">🖼️ 导出图片</button>
      <button class="btn outline" onclick="openExportOptions('pdf')">🖨️ 打印/PDF</button>
    </div>
    <button class="btn outline" style="width: 100%;" onclick="document.getElementById('import-file').click()">📥 导入全量备份 JSON</button>
    <input type="file" id="import-file" accept=".json" style="display: none;" onchange="importData(event)">
  </div>
  
  <div class="config-card">
    <div class="config-title">🛠️ 打卡记录修正</div>
    <div class="form-group"><input type="date" id="cfg-fix-date" onchange="window.renderFixPanel()"></div>
    <div class="fix-panel" id="fix-panel"></div>
  </div>
  
  <div class="config-card danger-zone">
    <div class="config-title" style="color: var(--warn); border-bottom-color: var(--warn);">⚠️ 危险操作</div>
    <div class="flex-btn-group two-cols">
      <button class="btn danger outline" onclick="clearLocalData()">清空打卡记录</button>
      <button class="btn danger outline" onclick="clearToken()">解除 Token</button>
    </div>
  </div>
</div>`;

window.loadPushDevices = async function() { 
    const container = document.getElementById('device-list-container'); 
    if (!container) return; 
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">读取云端设备中...</div>'; 
    try { 
        const res = await fetchGHFile('subscriptions.json'); 
        if (!res) { 
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">暂无绑定的推送设备</div>'; 
            return; 
        } 
        const subs = JSON.parse(res.content); 
        if (!Array.isArray(subs) || subs.length === 0) { 
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">暂无绑定的推送设备</div>'; 
            return; 
        } 
        container.innerHTML = ''; 
        const isService = configs.mode === 'service'; 
        const mName = getPureName(P().texts.masterName) || (isService ? '主人' : '先生'); 
        const dName = getPureName(P().texts.doggyName) || (isService ? '小狗' : '宝宝'); 
        subs.forEach((sub, idx) => { 
            let displayId = sub.identity || 'both'; 
            let badgeClass = 'master'; 
            let icon = '👑'; 
            if (displayId === 'doggy' || displayId.includes(dName) || displayId === '小狗') { 
                displayId = dName; badgeClass = 'doggy'; icon = '🎀'; 
            } else if (displayId === 'master' || displayId.includes(mName) || displayId === '主人') { 
                displayId = mName; badgeClass = 'master'; icon = '👑'; 
            } else { 
                displayId = '联合身份'; badgeClass = 'both'; icon = '🍉'; 
            } 
            const device = sub.device || '未记录设备（请重新授权）'; 
            const authTime = sub.authTime || '未记录时间'; 
            const el = document.createElement('div'); 
            el.className = 'device-item'; 
            el.innerHTML = ` 
            <div class="device-info" style="min-width: 0; flex: 1;"> 
                <div class="device-id" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${icon} ${displayId}</div> 
                <div class="device-meta" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${device} · ${authTime}</div> 
            </div> 
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink: 0; margin-left: 8px;"> 
                <div class="device-badge ${badgeClass}" style="margin-bottom: 4px;">${badgeClass === 'master' ? '主人端' : (badgeClass === 'doggy' ? '小狗端' : '双端')}</div> 
                <button class="btn danger outline" style="padding: 4px 8px; font-size: 0.75rem; white-space: nowrap;" onclick="removePushDevice(${idx})">🗑️ 移除</button> 
            </div> `; 
            container.appendChild(el); 
        }); 
    } catch(e) { 
        console.error('设备读取失败:', e);
        container.innerHTML = `<div style="text-align: center; color: var(--warn); font-size: 0.8rem; padding: 10px;">
            读取失败: ${e.message || '网络错误'}<br>
            <span style="font-size: 0.7rem; opacity: 0.7; margin-top: 4px; display: block;">（如果频繁超时，请在上方填写 CF 代理地址）</span>
        </div>`; 
    } 
};

window.removePushDevice = function(idx) { 
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return; 
    fetchGHFile('subscriptions.json').then(async res => { 
        if (!res) return; 
        const subs = JSON.parse(res.content); 
        if (!subs[idx]) return; 
        const removedSub = subs[idx]; 
        let isCurrentDevice = false; 
        try { 
            const localAuth = JSON.parse(localStorage.getItem('dawn-duo-push-auth') || '{}'); 
            if (localAuth.endpoint === removedSub.endpoint) isCurrentDevice = true; 
        } catch(e) {} 
        const deviceName = removedSub.device || '未知设备'; 
        const msg = `确定要彻底移除设备 <b>${deviceName}</b> 的推送授权吗？<br><br>移除后，该设备将无法接收到云端后台推送。<br>（如需恢复，请去【提醒】页面重新开启后台推送）`; 
        window.showCustomConfirm('📵 移除推送设备', msg, async () => { 
            try { 
                subs.splice(idx, 1); 
                const ok = await pushGHFile('subscriptions.json', JSON.stringify(subs, null, 2), res.sha); 
                if (ok) { 
                    showToast('✅ 设备已移除', 'success'); 
                    if (isCurrentDevice) { 
                        try { 
                            const registration = await navigator.serviceWorker.ready; 
                            const subscription = await registration.pushManager.getSubscription(); 
                            if (subscription) await subscription.unsubscribe(); 
                            localStorage.removeItem('dawn-duo-push-auth'); 
                            if (window.updateBackendPushStatus) window.updateBackendPushStatus(); 
                        } catch(e) { console.warn('本地取消订阅失败', e); } 
                        showToast('当前设备的后台推送已关闭', 'late'); 
                    } 
                    if (window.loadPushDevices) window.loadPushDevices(); 
                } else { 
                    showToast('移除失败，请重试', 'late'); 
                } 
            } catch(e) { 
                console.warn(e); 
                showToast('移除出错: ' + e.message, 'late'); 
            } 
        }); 
    }).catch(e => { 
        console.warn(e); 
        showToast('读取数据出错: ' + e.message, 'late'); 
    }); 
};