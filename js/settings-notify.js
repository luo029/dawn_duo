window.getTabNotifyHTML = () => `
<div class="tab-content" id="tab-notify">
  <div class="config-card">
    <div class="config-title">🔔 通知渠道 (本设备)</div>
    
    <div class="switch-row" id="row-notifications"><label>开启页面内通知<span class="help-icon" data-tip="网页开着的时候，到达目标时间会弹出浏览器通知">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-notifications"><span class="slider"></span></label></div>
    <div id="notify-status" class="tip-text" style="margin-bottom: 8px;"></div>
    
    <div class="card-divider"></div>
    
    <div class="switch-row" style="margin-bottom: 8px;"><label>开启后台推送<span class="help-icon" data-tip="设备锁屏或关闭网页后，也能通过云端服务器发送手机系统级推送。">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-backend-push" onchange="handleBackendPushToggle()"><span class="slider"></span></label></div>
    
    <div class="switch-row" style="margin-bottom: 12px;">
        <label style="display:flex; align-items:center;">本设备静音<span class="help-icon" data-tip="开启后，这台设备将强制关闭【页面内通知】，同时云端也不会发推送。保留授权记录，随时可恢复。">i</span></label>
        <label class="toggle-switch" style="margin-top: 2px;"><input type="checkbox" id="cfg-device-mute" onchange="toggleDeviceMute(this.checked)"><span class="slider"></span></label>
    </div>
    
    <div id="backend-push-status" class="tip-text" style="margin-bottom: 12px;">正在检查订阅状态...</div>
    <div class="progress-area" id="push-progress" style="display: none; margin-bottom: 12px;"><div class="progress-bar-wrap"><div class="progress-bar" id="push-progress-bar" style="width: 0%;"></div></div><div class="progress-text" id="push-progress-text">正在处理...</div></div>
  </div>
  
  <div class="config-card" id="notify-switches-card">
    <div class="config-title">🎯 提醒与身份免打扰</div>
    
    <div class="dual-tabs">
      <button class="btn dual-tab-btn active" data-target="master" onclick="switchDualSettings('master', this)">👑 <span class="text-master-name"></span></button>
      <button class="btn dual-tab-btn" data-target="doggy" onclick="switchDualSettings('doggy', this)">🎀 <span class="text-doggy-name"></span></button>
    </div>

    <div class="dual-user-group" data-active="master">
      <div data-user="master" class="dual-switches-area">
        <div class="switch-row" style="background: rgba(239,68,68,0.05); padding: 12px; border-radius: 10px; border: 1px dashed rgba(239,68,68,0.3); margin-bottom: 12px;">
            <div style="display:flex; flex-direction:column;">
                <label style="color: var(--warn); font-weight: 800;">🔕 主人身份免打扰<span class="help-icon" data-tip="开启后，主人名下的所有设备都不会收到任何提醒。">i</span></label>
            </div>
            <label class="toggle-switch"><input type="checkbox" class="dnd-chk" data-key="master_dnd" onchange="toggleDNDState('master', this.checked)"><span class="slider" style="background-color: var(--warn);"></span></label>
        </div>
        <div class="dnd-content">
          <div class="section-label">👑 <span class="text-master-name"></span> 提醒</div>
          <div class="switch-row"><label>🌙 休息提醒<span class="help-icon" data-tip="到达设定的休息时间时，发出提醒。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="master_sleep"><span class="slider"></span></label></div>
          <div class="switch-row"><label>☀️ 起床提醒<span class="help-icon" data-tip="到达设定的起床时间时，发出提醒。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="master_wake"><span class="slider"></span></label></div>
          
          <div class="section-label" style="margin-top: 16px;">⏳ 超时警告</div>
          <div class="switch-row"><label>熬夜超时警告<span class="help-icon" data-tip="超过目标休息时间后，按间隔持续发送警告。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="master_sleep_overtime"><span class="slider"></span></label></div>
          <div class="switch-row"><label>赖床超时警告<span class="help-icon" data-tip="超过目标起床时间后，按间隔持续发送警告。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="master_wake_overtime"><span class="slider"></span></label></div>
          
          <div class="section-label" style="margin-top: 16px;">🛡️ 防轰炸与时间窗<span class="help-icon" data-tip="提前/延后：在目标时间前后多久内允许发送准时提醒。超出后延时间才开始发超时警告。">i</span></div>
          <div class="flex-row">
              <div class="form-group"><label>提前 (分)<span class="help-icon" data-tip="目标时间前多少分钟开始发提醒。">i</span></label><input type="number" id="cfg-on-time-before-master" value="15" min="0" max="60"></div>
              <div class="form-group"><label>延后 (分)<span class="help-icon" data-tip="目标时间后多少分钟内依然只发准时提醒，超过后判定迟到。">i</span></label><input type="number" id="cfg-on-time-after-master" value="15" min="0" max="60"></div>
          </div>
          <div class="switch-row"><label>开启超时时间窗<span class="help-icon" data-tip="只在特定时间段内发送超时提醒。关闭后，全天任何时间都发。">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-overtime-window-master" onchange="document.getElementById('overtime-window-details-master').style.display = this.checked ? 'block' : 'none';"><span class="slider"></span></label></div>
          <div id="overtime-window-details-master" style="margin-top: 8px;">
            <div class="flex-row"><div class="form-group"><label>熬夜允许区间</label><div style="display:flex; gap:4px; align-items:center;"><input type="time" id="cfg-overtime-sleep-start-master" value="21:00"><span>至</span><input type="time" id="cfg-overtime-sleep-end-master" value="05:00"></div></div></div>
            <div class="flex-row"><div class="form-group"><label>赖床允许区间</label><div style="display:flex; gap:4px; align-items:center;"><input type="time" id="cfg-overtime-wake-start-master" value="05:00"><span>至</span><input type="time" id="cfg-overtime-wake-end-master" value="12:00"></div></div></div>
          </div>
          <div class="switch-row" style="margin-top: 8px;"><label>每天最大发送次数<span class="help-icon" data-tip="触发超时后，每天最多发几次。填 0 代表不限制次数。">i</span></label><input type="number" id="cfg-overtime-max-master" value="3" min="0" step="1" style="width: 80px; padding: 6px; text-align: center;"></div>
    
          <div class="section-label" style="margin-top: 16px;">📡 <span class="text-doggy-name"></span> 动态</div>
          <div class="switch-row"><label>对方已休息通知<span class="help-icon" data-tip="当对方打卡休息时，立刻收到通知。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_doggy_sleep"><span class="slider"></span></label></div>
          <div class="switch-row"><label>对方已起床通知<span class="help-icon" data-tip="当对方打卡起床时，立刻收到通知。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_doggy_wake"><span class="slider"></span></label></div>
          <div class="switch-row"><label>对方发情通知<span class="help-icon" data-tip="当对方记录发情时，立刻收到通知。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_doggy_heat"><span class="slider"></span></label></div>
        </div>
      </div>
      
      <div data-user="doggy" style="display: none;" class="dual-switches-area">
        <div class="switch-row" style="background: rgba(239,68,68,0.05); padding: 12px; border-radius: 10px; border: 1px dashed rgba(239,68,68,0.3); margin-bottom: 12px;">
            <div style="display:flex; flex-direction:column;">
                <label style="color: var(--warn); font-weight: 800;">🔕 小狗身份免打扰<span class="help-icon" data-tip="开启后，小狗名下的所有设备都不会收到任何提醒。">i</span></label>
            </div>
            <label class="toggle-switch"><input type="checkbox" class="dnd-chk" data-key="doggy_dnd" onchange="toggleDNDState('doggy', this.checked)"><span class="slider" style="background-color: var(--warn);"></span></label>
        </div>
        <div class="dnd-content">
          <div class="section-label">🎀 <span class="text-doggy-name"></span> 提醒</div>
          <div class="switch-row"><label>🌙 休息提醒<span class="help-icon" data-tip="到达设定的休息时间时，发出提醒。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="doggy_sleep"><span class="slider"></span></label></div>
          <div class="switch-row"><label>☀️ 起床提醒<span class="help-icon" data-tip="到达设定的起床时间时，发出提醒。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="doggy_wake"><span class="slider"></span></label></div>
          
          <div class="section-label" style="margin-top: 16px;">⏳ 超时警告</div>
          <div class="switch-row"><label>熬夜超时警告<span class="help-icon" data-tip="超过目标休息时间后，按间隔持续发送警告。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="doggy_sleep_overtime"><span class="slider"></span></label></div>
          <div class="switch-row"><label>赖床超时警告<span class="help-icon" data-tip="超过目标起床时间后，按间隔持续发送警告。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="doggy_wake_overtime"><span class="slider"></span></label></div>
    
          <div class="section-label" style="margin-top: 16px;">🛡️ 防轰炸与时间窗<span class="help-icon" data-tip="提前/延后：在目标时间前后多久内允许发送准时提醒。超出后延时间才开始发超时警告。">i</span></div>
          <div class="flex-row">
              <div class="form-group"><label>提前 (分)<span class="help-icon" data-tip="目标时间前多少分钟开始发提醒。">i</span></label><input type="number" id="cfg-on-time-before-doggy" value="15" min="0" max="60"></div>
              <div class="form-group"><label>延后 (分)<span class="help-icon" data-tip="目标时间后多少分钟内依然只发准时提醒，超过后判定迟到。">i</span></label><input type="number" id="cfg-on-time-after-doggy" value="15" min="0" max="60"></div>
          </div>
          <div class="switch-row"><label>开启超时时间窗<span class="help-icon" data-tip="只在特定时间段内发送超时提醒。关闭后，全天任何时间都发。">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-overtime-window-doggy" onchange="document.getElementById('overtime-window-details-doggy').style.display = this.checked ? 'block' : 'none';"><span class="slider"></span></label></div>
          <div id="overtime-window-details-doggy" style="margin-top: 8px;">
            <div class="flex-row"><div class="form-group"><label>熬夜允许区间</label><div style="display:flex; gap:4px; align-items:center;"><input type="time" id="cfg-overtime-sleep-start-doggy" value="21:00"><span>至</span><input type="time" id="cfg-overtime-sleep-end-doggy" value="05:00"></div></div></div>
            <div class="flex-row"><div class="form-group"><label>赖床允许区间</label><div style="display:flex; gap:4px; align-items:center;"><input type="time" id="cfg-overtime-wake-start-doggy" value="05:00"><span>至</span><input type="time" id="cfg-overtime-wake-end-doggy" value="12:00"></div></div></div>
          </div>
          <div class="switch-row" style="margin-top: 8px;"><label>每天最大发送次数<span class="help-icon" data-tip="触发超时后，每天最多发几次。填 0 代表不限制次数。">i</span></label><input type="number" id="cfg-overtime-max-doggy" value="3" min="0" step="1" style="width: 80px; padding: 6px; text-align: center;"></div>
    
          <div class="section-label" style="margin-top: 16px;">📡 <span class="text-master-name"></span> 动态</div>
          <div class="switch-row"><label>对方已休息通知<span class="help-icon" data-tip="当对方打卡休息时，立刻收到通知。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_master_sleep"><span class="slider"></span></label></div>
          <div class="switch-row"><label>对方已起床通知<span class="help-icon" data-tip="当对方打卡起床时，立刻收到通知。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_master_wake"><span class="slider"></span></label></div>
          <div class="switch-row"><label>对方发情通知<span class="help-icon" data-tip="当对方记录发情时，立刻收到通知。">i</span></label><label class="toggle-switch"><input type="checkbox" class="notify-item-chk" data-key="partner_master_heat"><span class="slider"></span></label></div>
        </div>
      </div>
    </div>
    
    <div class="card-divider"></div>
    
    <div class="switch-row" style="margin-bottom: 12px;">
        <label>发情推送附带感受<span class="help-icon" data-tip="开启后，若填写了感受，发情通知将直接使用感受内容作为正文，不再使用随机文案库。">i</span></label>
        <label class="toggle-switch"><input type="checkbox" id="cfg-heat-notify-feeling"><span class="slider"></span></label>
    </div>
    
    <div class="switch-row">
      <label>超时提醒重复间隔 (分钟)<span class="help-icon" data-tip="如果一直未打卡，每隔多少分钟发一次警告。">i</span></label>
      <input type="number" id="cfg-notify-interval" value="30" min="10" step="10" style="width: 80px; padding: 6px; text-align: center;">
    </div>
  </div>

  <div class="config-card">
    <div class="config-title">🧪 推送测试中心<span class="help-icon" data-tip="在后台防误触机制下，如果你已打卡，GitHub Actions 会跳过发送。你可以使用此面板预览文案并发送通知（本地测试或触发真实云端推送），验证最终效果。">i</span></div>
    <button class="btn primary" style="width: 100%; margin-bottom: 0;" onclick="openNotifyTestModal()">📢 打开测试发送面板</button>
  </div>
</div>`;

window.toggleDNDState = function(user, isDND) {
    const area = document.querySelector(`.dual-switches-area[data-user="${user}"] .dnd-content`);
    if (!area) return;
    
    let warnDiv = area.parentNode.querySelector('.dnd-warning-msg');
    
    if (isDND) {
        area.style.opacity = '0.3';
        area.style.pointerEvents = 'none';
        area.querySelectorAll('input').forEach(el => el.disabled = true);
        if (!warnDiv) {
            warnDiv = document.createElement('div');
            warnDiv.className = 'dnd-warning-msg';
            warnDiv.style.cssText = 'color: var(--warn); font-size: 0.8rem; font-weight: bold; padding: 10px; background: var(--warn-bg); border-radius: 8px; margin-bottom: 12px; text-align: center;';
            warnDiv.textContent = '🔕 身份免打扰生效中，该身份下方所有开关已临时锁定';
            area.parentNode.insertBefore(warnDiv, area);
        }
    } else {
        area.style.opacity = '1';
        area.style.pointerEvents = 'auto';
        area.querySelectorAll('input').forEach(el => el.disabled = false);
        if (warnDiv) warnDiv.remove();
    }
};

window.handleDeviceMuteUI = function(isMuted) {
    const card = document.getElementById('notify-switches-card');
    const notifRow = document.getElementById('row-notifications');
    const notifChk = document.getElementById('cfg-notifications');
    
    if (isMuted) {
        if (notifChk) { notifChk.checked = false; notifChk.disabled = true; }
        if (notifRow) notifRow.style.opacity = '0.4';
        
        if (card) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
            card.querySelectorAll('input').forEach(el => el.disabled = true);
            
            if (!document.getElementById('mute-device-warning')) {
                const warn = document.createElement('div');
                warn.id = 'mute-device-warning';
                warn.style.cssText = 'color: var(--warn); font-size: 0.85rem; font-weight: bold; padding: 12px; background: var(--warn-bg); border-radius: 8px; margin-bottom: 16px; text-align: center;';
                warn.innerHTML = '🔇 本设备已静音<br><span style="font-size:0.75rem;font-weight:normal;opacity:0.8;">下方所有提醒开关当前不会生效，请在“通知渠道”中关闭静音</span>';
                card.insertBefore(warn, card.querySelector('.dual-tabs'));
            }
        }
    } else {
        if (notifChk) notifChk.disabled = false;
        if (notifRow) notifRow.style.opacity = '1';
        
        if (card) {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
            card.querySelectorAll('input').forEach(el => el.disabled = false);
            
            const warn = document.getElementById('mute-device-warning');
            if (warn) warn.remove();
            
            const mDndChk = document.querySelector('.dnd-chk[data-key="master_dnd"]');
            const dDndChk = document.querySelector('.dnd-chk[data-key="doggy_dnd"]');
            if (mDndChk) window.toggleDNDState('master', mDndChk.checked);
            if (dDndChk) window.toggleDNDState('doggy', dDndChk.checked);
        }
    }
};