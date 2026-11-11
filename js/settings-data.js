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
    <div class="progress-area" id="sync-progress" style="display: none; margin-bottom: 12px;"><div class="progress-bar-wrap"><div class="progress-bar" id="sync-progress-bar" style="width: 0%;"></div></div><div class="progress-text" id="sync-progress-text">正在处理...</div></div>
    <div class="flex-btn-group two-cols" style="margin-top: 8px;">
      <button class="btn outline" onclick="syncFromGitHub()">⬇️ 立即拉取</button>
      <button class="btn primary" onclick="saveToGitHub()">⬆️ 立即上传</button>
    </div>
  </div>
  
  <div class="config-card">
    <div class="config-title">📤 本地导入导出</div>
    <div class="flex-btn-group two-cols" style="margin-bottom: 8px;">
      <button class="btn outline" onclick="exportJSON()">📄 导出 JSON</button>
      <button class="btn outline" onclick="exportCSV()">📊 导出 CSV</button>
    </div>
    <div class="flex-btn-group two-cols" style="margin-bottom: 8px;">
      <button class="btn outline" onclick="exportAsImage()">🖼️ 导出图片</button>
      <button class="btn outline" onclick="window.print()">🖨️ 打印/PDF</button>
    </div>
    <button class="btn outline" style="width: 100%;" onclick="document.getElementById('import-file').click()">📥 导入全量备份 JSON</button>
    <input type="file" id="import-file" accept=".json" style="display: none;" onchange="importData(event)">
  </div>
  
  <div class="config-card">
    <div class="config-title">🛠️ 打卡记录修正</div>
    <div class="form-group"><input type="date" id="cfg-fix-date" onchange="renderFixPanel()"></div>
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