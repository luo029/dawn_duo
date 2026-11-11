window.getTabRulesHTML = () => `
<div class="tab-content" id="tab-rules">
  <div class="config-card">
    <div class="config-title">⏰ 目标时间</div>
    <div class="flex-row">
      <div class="form-group"><label id="label-goal-master-sleep">主人休息目标</label><input type="time" id="cfg-goal-master-sleep" value="23:00"></div>
      <div class="form-group"><label id="label-goal-master-wake">主人起床目标</label><input type="time" id="cfg-goal-master-wake" value="07:00"></div>
    </div>
    <div class="flex-row">
      <div class="form-group"><label id="label-goal-doggy-sleep">小狗睡觉目标</label><input type="time" id="cfg-goal-doggy-sleep" value="22:30"></div>
      <div class="form-group"><label id="label-goal-doggy-wake">小狗起床目标</label><input type="time" id="cfg-goal-doggy-wake" value="07:30"></div>
    </div>
  </div>
  
  <div class="config-card">
    <div class="config-title">🌍 时区设置</div>
    <div class="flex-row">
      <div class="form-group"><label id="label-tz-master-type">主人 时区类型</label><select id="cfg-tz-master-type" onchange="toggleTzInput('master')"><option value="iana">标准时区</option><option value="offset">自定义时差</option></select></div>
      <div class="form-group" id="group-tz-master-iana"><label>时区</label><select id="cfg-tz-master-iana"><option value="Asia/Shanghai">中国标准时间</option><option value="Asia/Tokyo">日本标准时间</option><option value="America/New_York">美东时间 (纽约)</option><option value="America/Los_Angeles">美西时间 (洛杉矶)</option><option value="Europe/London">英国时间 (伦敦)</option><option value="Europe/Paris">中欧时间 (巴黎)</option></select></div>
      <div class="form-group" id="group-tz-master-offset" style="display:none;"><label>时差</label><input type="number" id="cfg-tz-master-offset" step="0.5" placeholder="例如: -13"></div>
    </div>
    <div class="flex-row">
      <div class="form-group"><label id="label-tz-doggy-type">小狗 时区类型</label><select id="cfg-tz-doggy-type" onchange="toggleTzInput('doggy')"><option value="iana">标准时区</option><option value="offset">自定义时差</option></select></div>
      <div class="form-group" id="group-tz-doggy-iana"><label>时区</label><select id="cfg-tz-doggy-iana"><option value="Asia/Shanghai">中国标准时间</option><option value="Asia/Tokyo">日本标准时间</option><option value="America/New_York">美东时间 (纽约)</option><option value="America/Los_Angeles">美西时间 (洛杉矶)</option><option value="Europe/London">英国时间 (伦敦)</option><option value="Europe/Paris">中欧时间 (巴黎)</option></select></div>
      <div class="form-group" id="group-tz-doggy-offset" style="display:none;"><label>时差</label><input type="number" id="cfg-tz-doggy-offset" step="0.5" placeholder="例如: -13"></div>
    </div>
  </div>
  
  <div class="config-card">
    <div class="config-title">🕰️ 时钟与养生</div>
    <div class="form-group"><label>时钟排版</label><select id="cfg-clock-layout"><option value="separate">分开显示 (左右两个卡片)</option><option value="merge">合并显示 (放在一个框内)</option></select></div>
    <div class="switch-row"><label id="lbl-show-master-clock">显示主人时间</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-master-clock"><span class="slider"></span></label></div>
    <div class="switch-row"><label id="lbl-show-doggy-clock">显示小狗时间</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-doggy-clock"><span class="slider"></span></label></div>
    <div class="switch-row"><label>显示秒数</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-seconds"><span class="slider"></span></label></div>
    <div class="switch-row"><label>显示十二时辰<span class="help-icon" data-tip="在时钟下方显示子丑寅卯等传统时辰计时法">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-show-shichen" onchange="handleShichenToggle()"><span class="slider"></span></label></div>
    <div class="switch-row"><label>显示经络养生提示<span class="help-icon" data-tip="根据当前时辰，在时钟下方显示对应的中医经络运行规律与养生小贴士">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-show-wellness" onchange="handleWellnessToggle()"><span class="slider"></span></label></div>
  </div>
  
  <div class="config-card">
    <div class="config-title">📅 日历回顾</div>
    <div class="switch-row" style="margin-bottom: 8px;"><label>显示打卡日历回顾</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-history"><span class="slider"></span></label></div>
    <div class="flex-row">
      <div class="form-group"><label>日历模式</label><select id="cfg-history-type" onchange="toggleHistoryTypeOptions()"><option value="days">最近 X 天</option><option value="month">按月份查看</option></select></div>
      <div class="form-group" id="group-history-days"><label>显示天数</label><select id="cfg-history-days"><option value="7">7 天</option><option value="30">30 天</option><option value="90">90 天</option><option value="365">365 天</option></select></div>
      <div class="form-group" id="group-history-month" style="display: none; gap: 8px;"><label>选择月份</label><div style="display:flex; gap:4px;"><select id="cfg-history-year" style="flex:1;"></select><select id="cfg-history-month" style="flex:1;"></select></div></div>
    </div>
  </div>
</div>`;

window.toggleHistoryTypeOptions = function() { const type = document.getElementById('cfg-history-type').value; document.getElementById('group-history-days').style.display = type === 'days' ? 'block' : 'none'; document.getElementById('group-history-month').style.display = type === 'month' ? 'flex' : 'none'; };
window.toggleTzInput = function(user) { const type = document.getElementById(`cfg-tz-${user}-type`).value; document.getElementById(`group-tz-${user}-iana`).style.display = type === 'iana' ? 'block' : 'none'; document.getElementById(`group-tz-${user}-offset`).style.display = type === 'offset' ? 'block' : 'none'; };