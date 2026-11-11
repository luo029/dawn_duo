window.getTabGeneralHTML = () => `
<div class="tab-content active" id="tab-general">
  <div class="config-card">
    <div class="config-title">🪪 身份与版本模式</div>
    <div class="identity-selector" style="margin-bottom: 12px;">
      <button class="id-pill" id="id-pill-master" onclick="chooseIdentity('master')"><span class="id-pill-emoji">👑</span><span class="id-pill-label" id="id-pill-label-master">先生</span></button>
      <button class="id-pill" id="id-pill-doggy" onclick="chooseIdentity('doggy')"><span class="id-pill-emoji">🎀</span><span class="id-pill-label" id="id-pill-label-doggy">宝宝</span></button>
      <button class="id-pill" id="id-pill-both" onclick="chooseIdentity('both')"><span class="id-pill-emoji">🍉</span><span class="id-pill-label">滴滴</span></button>
    </div>
    <div class="mode-list">
      <button class="mode-card" id="mode-card-daily" onclick="setMode('daily')"><span class="mode-emoji" id="mode-icon-daily">💕</span><span class="mode-info"><span class="mode-name">日常版本</span></span><span class="mode-check">✓</span></button>
      <button class="mode-card" id="mode-card-service" onclick="setMode('service')"><span class="mode-emoji" id="mode-icon-service">🐕</span><span class="mode-info"><span class="mode-name">主仆版本</span></span><span class="mode-check">✓</span></button>
    </div>
  </div>
  
  <div class="config-card">
    <div class="config-title">🔠 标题与图标</div>
    <div class="form-group"><label>主标题</label><input type="text" id="cfg-title" placeholder="☀️ 契约"></div>
    <div class="form-group"><label>副标题</label><input type="text" id="cfg-subtitle" placeholder="跨越半个地球的日常陪伴"></div>
    <div class="flex-row">
      <div class="form-group"><label>日常模式图标</label><input type="text" id="cfg-icon-daily" placeholder="💕"></div>
      <div class="form-group"><label>主仆模式图标</label><input type="text" id="cfg-icon-service" placeholder="🐕"></div>
    </div>
  </div>
  
  <div class="config-card">
    <div class="config-title">📅 界面与纪念日</div>
    <div class="form-group"><label>纪念日</label><input type="date" id="cfg-anniversary" value="2026-11-04"></div>
    <div class="switch-row"><label>显示对方打卡卡片<span class="help-icon" data-tip="在当前身份下，是否在主界面显示对方（只读）的打卡按钮">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-show-partner-card"><span class="slider"></span></label></div>
    <div class="switch-row"><label>显示对方独立状态栏<span class="help-icon" data-tip="在打卡区域顶部，显示对方当前是休息还是醒着的状态提示">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-show-partner-status"><span class="slider"></span></label></div>
    <div class="switch-row"><label>简洁模式<span class="help-icon" data-tip="隐藏时钟、日历统计等非核心模块，界面更清爽">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-simple-mode"><span class="slider"></span></label></div>
    <div class="switch-row"><label>显示契约日<span class="help-icon" data-tip="在顶部时差条旁显示当前是契约绑定的第几天">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-show-logical-date"><span class="slider"></span></label></div>
    <div class="card-divider"></div>
    <div class="switch-row"><label>开启全屏极简打卡<span class="help-icon" data-tip="隐蔽所有界面，仅保留圆形专属按钮，背景色随打卡状态自动变换，双击屏幕或长按按钮退出">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-checkin-mode"><span class="slider"></span></label></div>
  </div>
</div>`;