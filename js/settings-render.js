document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('settings-modal')) return;
  const style = document.createElement('style');
  style.innerHTML = `
    #settings-modal .modal { height: 82vh; max-height: 800px; }
    @media (max-width: 600px) { #settings-modal .modal { height: 88vh; max-height: none; } }
    .action-item { display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; border:1px solid var(--border); background:var(--bg); border-radius:12px; font-size:0.95rem; color:var(--text); cursor:pointer; transition:all 0.2s; text-align:left; font-weight:500; }
    .action-item:hover { background:var(--settings-bg); border-color:var(--tab-active); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .action-item .icon { font-size:1.1rem; width:20px; text-align:center; }
    .action-item.danger { color:var(--warn); border-color: rgba(239,68,68,0.2); }
    .action-item.danger:hover { background: rgba(239,68,68,0.05); border-color:var(--warn); box-shadow: 0 4px 12px rgba(239,68,68,0.1); }
    .sleep-desc-box { background: var(--settings-bg, rgba(156,143,166,0.1)); border: 1px solid var(--border); border-radius: 12px; padding: 16px; color: var(--text); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    .time-highlight { color: var(--tab-active, #38bdf8); font-weight: 800; font-size: 1.05rem; padding: 0 4px; }
    .diff-chk { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--tab-active); cursor: pointer; flex-shrink: 0; }
    .diff-details { margin-top: 6px; font-size: 0.75rem; background: var(--btn-bg); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); }
    .diff-details summary { cursor: pointer; color: var(--tab-active); font-weight: 600; outline: none; }
    .diff-content-pre { margin-top: 6px; white-space: pre-wrap; word-break: break-all; font-family: monospace; color: var(--text-muted); }
    .flex-btn-group { display: flex; flex-wrap: wrap; gap: 8px; }
    .flex-btn-group .btn { flex: 1 1 calc(33.333% - 8px); padding: 8px 4px; font-size: 0.8rem; min-width: 80px; white-space: nowrap; }
    .flex-btn-group.two-cols .btn { flex: 1 1 calc(50% - 8px); }
    .msg-entry-btn { background: var(--input-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; cursor: pointer; flex: 1 1 calc(50% - 8px); min-width: 120px; }
    .msg-entry-btn:hover { background: var(--settings-bg); border-color: var(--tab-active); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .msg-entry-title { font-size: 0.85rem; font-weight: 700; color: var(--text); }
    .msg-entry-count { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); background: var(--btn-bg); padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border); }
    .msg-entry-btn:hover .msg-entry-count { color: var(--tab-active); border-color: rgba(56, 189, 248, 0.3); }
    .help-icon { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; border: 1px solid var(--text-muted); color: var(--text-muted); font-size: 10px; font-weight: bold; cursor: pointer; margin-left: 6px; user-select: none; transition: all 0.2s; vertical-align: middle; }
    .help-icon:hover { color: var(--tab-active); border-color: var(--tab-active); background: var(--btn-bg); }
    #global-tooltip { position: fixed; background: rgba(20, 20, 25, 0.95); color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 0.75rem; line-height: 1.5; max-width: 250px; z-index: 9999; pointer-events: none; opacity: 0; transition: opacity 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(4px); word-break: break-all; white-space: pre-wrap; }
    #global-tooltip.show { opacity: 1; }
    #global-tooltip::before { content: ''; position: absolute; top: -5px; left: 10px; border-width: 0 5px 5px 5px; border-style: solid; border-color: transparent transparent rgba(20, 20, 25, 0.95) transparent; }
    .card-divider { height: 1px; border-top: 1px dashed var(--border); margin: 12px 0; }
    .section-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin: 12px 0 8px; display: flex; align-items: center; gap: 6px; }
    .device-item { background: var(--input-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .device-info { display: flex; flex-direction: column; gap: 4px; }
    .device-id { font-weight: 700; font-size: 0.85rem; color: var(--text); }
    .device-meta { font-size: 0.7rem; color: var(--text-muted); }
    .device-badge { padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
    .device-badge.master { background: rgba(56, 189, 248, 0.15); color: var(--master-color); }
    .device-badge.doggy { background: rgba(244, 114, 182, 0.15); color: var(--doggy-color); }
  `;
  document.head.appendChild(style);

  // 防崩溃处理
  const safeCall = (fnName) => (typeof window[fnName] === 'function' ? window[fnName]() : `<div style="padding:20px;color:red;text-align:center;">⚠️ 模块 [${fnName}] 加载失败，请刷新页面重试</div>`);

  const container = document.createElement('div');
  container.innerHTML = `
<div class="modal-overlay" id="settings-modal">
  <div class="modal">
    <div class="modal-head"><h2>⚙️ 设置</h2><button class="close-btn" onclick="closeSettings()">✕</button></div>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab(event, 'tab-general')">🎨 外观</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-profiles')">👑 角色</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-rules')">📅 作息</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-notify')">🔔 提醒</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-msgs')">📝 文案</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-data')">☁️ 数据</button>
    </div>
    <div class="modal-body">
      ${safeCall('getTabGeneralHTML')}
      ${safeCall('getTabProfilesHTML')}
      ${safeCall('getTabRulesHTML')}
      ${safeCall('getTabNotifyHTML')}
      ${safeCall('getTabMsgsHTML')}
      ${safeCall('getTabDataHTML')}
    </div>
    <div class="modal-foot"><button class="btn primary" onclick="saveSettings()">保存设置</button></div>
  </div>
</div>
${safeCall('getSettingsModalsHTML')}
<div id="global-tooltip"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', container.innerHTML);

  const tooltip = document.getElementById('global-tooltip');
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('help-icon')) {
      e.stopPropagation();
      const text = e.target.getAttribute('data-tip');
      const rect = e.target.getBoundingClientRect();
      tooltip.textContent = text;
      tooltip.style.left = Math.max(10, rect.left - 10) + 'px';
      tooltip.style.top = (rect.bottom + 8) + 'px';
      tooltip.classList.add('show');
      clearTimeout(window.tooltipTimer);
      window.tooltipTimer = setTimeout(() => tooltip.classList.remove('show'), 3000);
    } else {
      tooltip.classList.remove('show');
    }
  });
});