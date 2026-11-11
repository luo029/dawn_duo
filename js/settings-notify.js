window.getTabNotifyHTML = () => `
<div class="tab-content" id="tab-notify">
  <div class="config-card">
    <div class="config-title">🔔 通知渠道</div>
    <div class="switch-row"><label>开启页面内通知<span class="help-icon" data-tip="网页开着的时候，到达目标时间会弹出浏览器通知">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-notifications"><span class="slider"></span></label></div>
    <div id="notify-status" class="tip-text" style="margin-bottom: 8px;"></div>
    <button class="btn outline" onclick="testNotification()" style="width: 100%; font-size: 0.8rem; padding: 8px;">🔔 测试页面通知</button>
    <div class="card-divider"></div>
    <div class="switch-row" style="margin-bottom: 8px;"><label>开启后台推送<span class="help-icon" data-tip="设备锁屏或关闭网页后，也能通过云端服务器发送手机系统级推送">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-backend-push" onchange="handleBackendPushToggle()"><span class="slider"></span></label></div>
    <div id="backend-push-status" class="tip-text" style="margin-bottom: 12px;">正在检查订阅状态...</div>
    <div class="progress-area" id="push-progress" style="display: none; margin-bottom: 12px;"><div class="progress-bar-wrap"><div class="progress-bar" id="push-progress-bar" style="width: 0%;"></div></div><div class="progress-text" id="push-progress-text">正在处理...</div></div>
  </div>
  
  <div class="config-card">
    <div class="config-title">🎯 提醒开关<span class="help-icon" data-tip="关闭某项后，页面通知和云端推送将不再发送该项提醒">i</span></div>
    <div data-user="master">
      <div class="section-label">👑 <span class="text-master-name"></span> 提醒</div>
      <div class="switch-row"><label>🌙 休息提醒</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="master_sleep"><span class="slider"></span></label></div>
      <div class="switch-row"><label>☀️ 起床提醒</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="master_wake"><span class="slider"></span></label></div>
      <div class="section-label" style="margin-top: 16px;">📡 <span class="text-doggy-name"></span> 动态</div>
      <div class="switch-row"><label>对方已休息通知</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_doggy_sleep"><span class="slider"></span></label></div>
      <div class="switch-row"><label>对方已起床通知</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_doggy_wake"><span class="slider"></span></label></div>
    </div>
    <div data-user="doggy">
      <div class="section-label">🎀 <span class="text-doggy-name"></span> 提醒</div>
      <div class="switch-row"><label>🌙 睡觉提醒</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="doggy_sleep"><span class="slider"></span></label></div>
      <div class="switch-row"><label>☀️ 起床提醒</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="doggy_wake"><span class="slider"></span></label></div>
      <div class="section-label" style="margin-top: 16px;">📡 <span class="text-master-name"></span> 动态</div>
      <div class="switch-row"><label>对方已休息通知</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_master_sleep"><span class="slider"></span></label></div>
      <div class="switch-row"><label>对方已起床通知</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_master_wake"><span class="slider"></span></label></div>
    </div>
    <div class="card-divider"></div>
    <div class="section-label">⏳ 超时警告 (通用)</div>
    <div class="switch-row"><label>熬夜超时警告</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="overtime_sleep"><span class="slider"></span></label></div>
    <div class="switch-row"><label>赖床超时警告</label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="overtime_wake"><span class="slider"></span></label></div>
    <div class="switch-row" style="margin-top: 8px; border-top: 1px dashed var(--border); padding-top: 12px;">
      <label>提醒重复间隔 (分钟)</label>
      <input type="number" id="cfg-notify-interval" value="30" min="10" step="10" style="width: 80px; padding: 6px; text-align: center;">
    </div>
    <div class="card-divider"></div>
    <div class="section-label">🛡️ 防轰炸与时间窗设置</div>
    <div class="switch-row"><label>开启时间窗限制<span class="help-icon" data-tip="只在特定的时间段内发送超时提醒。关闭后，任何时间超时都会发。">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-overtime-window"><span class="slider"></span></label></div>
    <div id="overtime-window-details" style="margin-top: 8px;">
      <div class="flex-row">
        <div class="form-group"><label>熬夜允许区间</label><div style="display:flex; gap:4px; align-items:center;"><input type="time" id="cfg-overtime-sleep-start" value="21:00"><span>至</span><input type="time" id="cfg-overtime-sleep-end" value="05:00"></div></div>
      </div>
      <div class="flex-row">
        <div class="form-group"><label>赖床允许区间</label><div style="display:flex; gap:4px; align-items:center;"><input type="time" id="cfg-overtime-wake-start" value="05:00"><span>至</span><input type="time" id="cfg-overtime-wake-end" value="12:00"></div></div>
      </div>
    </div>
    <div class="switch-row" style="margin-top: 8px;">
      <label>每天最大发送次数<span class="help-icon" data-tip="触发超时后，每天最多发几次警告。填 0 代表不限制次数。">i</span></label>
      <input type="number" id="cfg-overtime-max" value="3" min="0" step="1" style="width: 80px; padding: 6px; text-align: center;">
    </div>
  </div>

  <div class="config-card">
    <div class="config-title">🧪 推送测试中心<span class="help-icon" data-tip="在后台防误触机制下，如果你已打卡，GitHub Actions 会跳过发送。你可以使用此面板预览文案并发送通知（本地测试或触发真实云端推送），验证最终效果。">i</span></div>
    <button class="btn primary" style="width: 100%; margin-bottom: 0;" onclick="openNotifyTestModal()">📢 打开测试发送面板</button>
  </div>
</div>`;