document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('settings-modal')) return; // 防止重复渲染

  const style = document.createElement('style');
  style.innerHTML = `
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
    
    /* 网格与按钮排版 */
    .flex-btn-group { display: flex; flex-wrap: wrap; gap: 8px; }
    .flex-btn-group .btn { flex: 1 1 calc(33.333% - 8px); padding: 8px 4px; font-size: 0.8rem; min-width: 80px; white-space: nowrap; }
    .flex-btn-group.two-cols .btn { flex: 1 1 calc(50% - 8px); }
    
    /* 专属美化：随机打卡文案卡片 */
    .msg-entry-btn { background: var(--input-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; cursor: pointer; flex: 1 1 calc(50% - 8px); min-width: 120px; }
    .msg-entry-btn:hover { background: var(--settings-bg); border-color: var(--tab-active); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .msg-entry-title { font-size: 0.85rem; font-weight: 700; color: var(--text); }
    .msg-entry-count { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); background: var(--btn-bg); padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border); }
    .msg-entry-btn:hover .msg-entry-count { color: var(--tab-active); border-color: rgba(56, 189, 248, 0.3); }

    /* 气泡提示 UI */
    .help-icon { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--text-muted); color: var(--text-muted); font-size: 10px; font-weight: bold; cursor: pointer; margin-left: 6px; user-select: none; transition: all 0.2s; vertical-align: middle; }
    .help-icon:hover { color: var(--tab-active); border-color: var(--tab-active); }
    #global-tooltip { position: fixed; background: rgba(20, 20, 25, 0.95); color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 0.75rem; line-height: 1.5; max-width: 250px; z-index: 9999; pointer-events: none; opacity: 0; transition: opacity 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(4px); word-break: break-all; }
    #global-tooltip.show { opacity: 1; }
    #global-tooltip::before { content: ''; position: absolute; top: -5px; left: 10px; border-width: 0 5px 5px 5px; border-style: solid; border-color: transparent transparent rgba(20, 20, 25, 0.95) transparent; }
    .card-divider { height: 1px; border-top: 1px dashed var(--border); margin: 12px 0; }
    .section-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin: 12px 0 8px; display: flex; align-items: center; gap: 6px; }
  `;
  document.head.appendChild(style);

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
      
      <!-- 1. 外观与身份 -->
      <div class="tab-content active" id="tab-general">
        <div class="config-card">
          <div class="config-title">🪪 身份与版本模式</div>
          <div class="identity-selector" style="margin-bottom: 12px;"><button class="id-pill" id="id-pill-master" onclick="chooseIdentity('master')"><span class="id-pill-emoji">👑</span><span class="id-pill-label" id="id-pill-label-master">先生</span></button><button class="id-pill" id="id-pill-doggy" onclick="chooseIdentity('doggy')"><span class="id-pill-emoji">🎀</span><span class="id-pill-label" id="id-pill-label-doggy">宝宝</span></button><button class="id-pill" id="id-pill-both" onclick="chooseIdentity('both')"><span class="id-pill-emoji">🍉</span><span class="id-pill-label">滴滴</span></button></div>
          <div class="mode-list"><button class="mode-card" id="mode-card-daily" onclick="setMode('daily')"><span class="mode-emoji" id="mode-icon-daily">💕</span><span class="mode-info"><span class="mode-name">日常版本</span></span><span class="mode-check">✓</span></button><button class="mode-card" id="mode-card-service" onclick="setMode('service')"><span class="mode-emoji" id="mode-icon-service">🐕</span><span class="mode-info"><span class="mode-name">主仆版本</span></span><span class="mode-check">✓</span></button></div>
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
          <div class="switch-row"><label>显示对方打卡卡片</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-partner-card"><span class="slider"></span></label></div>
          <div class="switch-row"><label>显示对方独立状态栏</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-partner-status"><span class="slider"></span></label></div>
          <div class="switch-row"><label>简洁模式<span class="help-icon" data-tip="隐藏时钟、统计等多余模块，只留核心打卡区">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-simple-mode"><span class="slider"></span></label></div>
          <div class="switch-row"><label>显示契约日<span class="help-icon" data-tip="在顶部时差条旁边显示当前是相恋的第几天">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-show-logical-date"><span class="slider"></span></label></div>
          <div class="card-divider"></div>
          <div class="switch-row"><label>开启全屏极简打卡<span class="help-icon" data-tip="隐蔽所有界面，仅保留圆形按钮，背景色随打卡状态变换">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-checkin-mode"><span class="slider"></span></label></div>
        </div>
      </div>

      <!-- 2. 角色设定 -->
      <div class="tab-content" id="tab-profiles">
        <div class="config-card" data-user="master">
          <div class="config-title">👑 <span id="cfg-title-master">主人</span> 专属设定</div>
          <div class="flex-row">
            <div class="form-group"><label>名字</label><input type="text" id="cfg-master-name" placeholder="🧘 先生"></div>
            <div class="form-group"><label>标签</label><input type="text" id="cfg-master-tag" placeholder="👑 先生"></div>
          </div>
          <div class="flex-row">
            <div class="form-group"><label>地区</label><input type="text" id="cfg-master-region" placeholder="上海"></div>
            <div class="form-group"><label>专属主题色</label><input type="color" id="cfg-color-master" value="#38bdf8"></div>
          </div>
          <div class="flex-row">
            <div class="form-group"><label>休息按钮文字</label><input type="text" id="cfg-master-sleep-btn" placeholder="先生休息"></div>
            <div class="form-group"><label>起床按钮文字</label><input type="text" id="cfg-master-wake-btn" placeholder="先生起床"></div>
          </div>
        </div>
        <div class="config-card" data-user="doggy">
          <div class="config-title doggy-title">🎀 <span id="cfg-title-doggy">小狗</span> 专属设定</div>
          <div class="flex-row">
            <div class="form-group"><label>名字</label><input type="text" id="cfg-doggy-name" placeholder="🍼 宝宝"></div>
            <div class="form-group"><label>标签</label><input type="text" id="cfg-doggy-tag" placeholder="🎀 宝宝"></div>
          </div>
          <div class="flex-row">
            <div class="form-group"><label>地区</label><input type="text" id="cfg-doggy-region" placeholder="纽约"></div>
            <div class="form-group"><label>专属主题色</label><input type="color" id="cfg-color-doggy" value="#f472b6"></div>
          </div>
          <div class="flex-row">
            <div class="form-group"><label>睡觉按钮文字</label><input type="text" id="cfg-doggy-sleep-btn" placeholder="宝宝睡觉"></div>
            <div class="form-group"><label>起床按钮文字</label><input type="text" id="cfg-doggy-wake-btn" placeholder="宝宝起床"></div>
          </div>
        </div>
      </div>

      <!-- 3. 作息与时钟 -->
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
          <div class="switch-row"><label>显示主人时间</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-master-clock"><span class="slider"></span></label></div>
          <div class="switch-row"><label>显示小狗时间</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-doggy-clock"><span class="slider"></span></label></div>
          <div class="switch-row"><label>显示秒数</label><label class="toggle-switch"><input type="checkbox" id="cfg-show-seconds"><span class="slider"></span></label></div>
          <div class="switch-row"><label>显示十二时辰<span class="help-icon" data-tip="在时钟下方显示子丑寅卯等传统时辰">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-show-shichen" onchange="handleShichenToggle()"><span class="slider"></span></label></div>
          <div class="switch-row"><label>显示经络养生提示<span class="help-icon" data-tip="根据时辰显示对应的中医养生小知识">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-show-wellness" onchange="handleWellnessToggle()"><span class="slider"></span></label></div>
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
      </div>

      <!-- 4. 提醒与推送 -->
      <div class="tab-content" id="tab-notify">
        <div class="config-card">
          <div class="config-title">🔔 通知渠道</div>
          <div class="switch-row"><label>开启页面内通知<span class="help-icon" data-tip="网页开着的时候，到点会弹出浏览器通知">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-notifications"><span class="slider"></span></label></div>
          <div id="notify-status" class="tip-text" style="margin-bottom: 8px;"></div>
          <button class="btn outline" onclick="testNotification()" style="width: 100%; font-size: 0.8rem; padding: 8px;">🔔 测试页面通知</button>
          <div class="card-divider"></div>
          <div class="switch-row" style="margin-bottom: 8px;"><label>开启后台推送<span class="help-icon" data-tip="设备锁屏或关闭网页后，也能通过服务器发通知">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-backend-push" onchange="handleBackendPushToggle()"><span class="slider"></span></label></div>
          <div id="backend-push-status" class="tip-text" style="margin-bottom: 12px;">正在检查订阅状态...</div>
          <div class="progress-area" id="push-progress" style="display: none; margin-bottom: 12px;"><div class="progress-bar-wrap"><div class="progress-bar" id="push-progress-bar" style="width: 0%;"></div></div><div class="progress-text" id="push-progress-text">正在处理...</div></div>
        </div>
        <div class="config-card">
          <div class="config-title">⏳ 超时监控</div>
          <div class="switch-row"><label>开启熬夜/赖床提醒<span class="help-icon" data-tip="过了目标时间还没打卡，会一直催促你">i</span></label><label class="toggle-switch"><input type="checkbox" id="cfg-notify-overtime"><span class="slider"></span></label></div>
          <div class="form-group" style="margin-top: 8px;"><label>超时重复提醒间隔 (分钟)</label><input type="number" id="cfg-notify-interval" value="30" min="10" step="10"></div>
        </div>
      </div>

      <!-- 5. 弹窗与文案 -->
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
        
        <!-- 提醒文案整合到这里，并动态反转名字 -->
        <div class="config-card" data-user="master">
          <div class="config-title">👑 <span class="text-master-name"></span> 提醒文案</div>
          
          <div class="section-label">🔔 定时通知 (系统推送)</div>
          <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('master_sleep')">休息提醒</button><button class="btn outline" onclick="openNotifyTextModal('master_wake')">起床提醒</button></div>
          <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('overtime_sleep')">熬夜警告</button><button class="btn outline" onclick="openNotifyTextModal('overtime_wake')">赖床警告</button></div>
          <div class="flex-btn-group two-cols"><button class="btn outline" onclick="openNotifyTextModal('partner_doggy_sleep')"><span class="text-doggy-name"></span>已休息通知</button><button class="btn outline" onclick="openNotifyTextModal('partner_doggy_wake')"><span class="text-doggy-name"></span>已起床通知</button></div>
          
          <div class="section-label">📱 页面状态展示</div>
          <div class="flex-btn-group two-cols"><button class="btn outline" onclick="openNotifyTextModal('status_master_sleep')">状态栏：休息中</button><button class="btn outline" onclick="openNotifyTextModal('status_master_wake')">状态栏：已醒来</button></div>
        </div>

        <div class="config-card" data-user="doggy">
          <div class="config-title doggy-title">🎀 <span class="text-doggy-name"></span> 提醒文案</div>
          
          <div class="section-label">🔔 定时通知 (系统推送)</div>
          <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('doggy_sleep')">睡觉提醒</button><button class="btn outline" onclick="openNotifyTextModal('doggy_wake')">起床提醒</button></div>
          <div class="flex-btn-group two-cols" style="margin-bottom: 8px;"><button class="btn outline" onclick="openNotifyTextModal('overtime_sleep')">熬夜警告</button><button class="btn outline" onclick="openNotifyTextModal('overtime_wake')">赖床警告</button></div>
          <div class="flex-btn-group two-cols"><button class="btn outline" onclick="openNotifyTextModal('partner_master_sleep')"><span class="text-master-name"></span>已休息通知</button><button class="btn outline" onclick="openNotifyTextModal('partner_master_wake')"><span class="text-master-name"></span>已起床通知</button></div>
          
          <div class="section-label">📱 页面状态展示</div>
          <div class="flex-btn-group two-cols"><button class="btn outline" onclick="openNotifyTextModal('status_doggy_sleep')">状态栏：休息中</button><button class="btn outline" onclick="openNotifyTextModal('status_doggy_wake')">状态栏：已醒来</button></div>
        </div>

        <div class="config-card" data-user="master">
          <div class="config-title">👑 <span class="text-master-name"></span> 随机打卡文案</div>
          <div class="flex-btn-group">
            <button class="msg-entry-btn" onclick="openSubMsg('master_sleep_success', '休息(达标)')"><span class="msg-entry-title">休息(达标)</span><span class="msg-entry-count" id="cnt_master_sleep_success">0 条</span></button>
            <button class="msg-entry-btn" onclick="openSubMsg('master_sleep_late', '休息(晚睡)')"><span class="msg-entry-title">休息(晚睡)</span><span class="msg-entry-count" id="cnt_master_sleep_late">0 条</span></button>
            <button class="msg-entry-btn" onclick="openSubMsg('master_wake_success', '起床(达标)')"><span class="msg-entry-title">起床(达标)</span><span class="msg-entry-count" id="cnt_master_wake_success">0 条</span></button>
            <button class="msg-entry-btn" onclick="openSubMsg('master_wake_late', '起床(赖床)')"><span class="msg-entry-title">起床(赖床)</span><span class="msg-entry-count" id="cnt_master_wake_late">0 条</span></button>
          </div>
        </div>

        <div class="config-card" data-user="doggy">
          <div class="config-title doggy-title">🎀 <span class="text-doggy-name"></span> 随机打卡文案</div>
          <div class="flex-btn-group">
            <button class="msg-entry-btn" onclick="openSubMsg('doggy_sleep_success', '睡觉(达标)')"><span class="msg-entry-title">睡觉(达标)</span><span class="msg-entry-count" id="cnt_doggy_sleep_success">0 条</span></button>
            <button class="msg-entry-btn" onclick="openSubMsg('doggy_sleep_late', '睡觉(晚睡)')"><span class="msg-entry-title">睡觉(晚睡)</span><span class="msg-entry-count" id="cnt_doggy_sleep_late">0 条</span></button>
            <button class="msg-entry-btn" onclick="openSubMsg('doggy_wake_success', '起床(达标)')"><span class="msg-entry-title">起床(达标)</span><span class="msg-entry-count" id="cnt_doggy_wake_success">0 条</span></button>
            <button class="msg-entry-btn" onclick="openSubMsg('doggy_wake_late', '起床(赖床)')"><span class="msg-entry-title">起床(赖床)</span><span class="msg-entry-count" id="cnt_doggy_wake_late">0 条</span></button>
          </div>
        </div>

        <div class="config-card">
          <div class="config-title">📥 文案库导入</div>
          <button class="btn outline" style="width: 100%;" onclick="document.getElementById('import-lib-file').click()">📂 选择文件导入文库</button><input type="file" id="import-lib-file" accept=".txt,.md,.json" style="display: none;" onchange="readLibraryFile(event)">
        </div>
      </div>

      <!-- 6. 数据与同步 -->
      <div class="tab-content" id="tab-data">
        <div class="config-card">
          <div class="config-title">☁️ 云端数据同步</div>
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
          <button class="btn outline" style="width: 100%;" onclick="document.getElementById('import-file').click()">📥 导入全量备份 JSON</button><input type="file" id="import-file" accept=".json" style="display: none;" onchange="importData(event)">
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
      </div>
    </div>
    <div class="modal-foot"><button class="btn primary" onclick="saveSettings()">保存设置</button></div>
  </div>
</div>

<div class="sub-modal" id="sleep-action-modal"><div class="sub-modal-box" style="max-width: 360px; padding: 24px; display: flex; flex-direction: column;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;"><h3 id="sleep-modal-title" style="font-size: 1.15rem; margin:0; color:var(--text); font-weight:700;">今日已打过卡</h3><button class="close-btn" onclick="closeSleepModal()" style="position:static; font-size:1rem;">✕</button></div><div class="sleep-desc-box" id="sleep-modal-desc"></div><div style="display: flex; flex-direction: column; gap: 10px;"><button class="action-item" id="btn-sleep-sub" onclick="handleSleepAction('sub')"></button><button class="action-item" id="btn-sleep-cross" onclick="handleSleepAction('cross')"></button><button class="action-item" id="btn-sleep-overwrite" onclick="handleSleepAction('overwrite')"></button><button class="action-item danger" id="btn-sleep-cancel" onclick="handleSleepAction('cancel')"></button></div><div style="margin-top: 20px;"><button class="btn outline" onclick="closeSleepModal()" style="width:100%; padding:12px; border-radius: 12px; font-weight: 500;">取消</button></div></div></div>
<div class="sub-modal" id="wake-action-modal"><div class="sub-modal-box" style="max-width: 360px; padding: 24px; display: flex; flex-direction: column;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;"><h3 id="wake-modal-title" style="font-size: 1.15rem; margin:0; color:var(--text); font-weight:700;">今日已打过卡</h3><button class="close-btn" onclick="closeWakeModal()" style="position:static; font-size:1rem;">✕</button></div><div class="sleep-desc-box" id="wake-modal-desc"></div><div style="display: flex; flex-direction: column; gap: 10px;"><button class="action-item" id="btn-wake-confirm" onclick="handleWakeAction('overwrite')"></button><button class="action-item danger" id="btn-wake-cancel" onclick="handleWakeAction('cancel')"></button></div><div style="margin-top: 20px;"><button class="btn outline" onclick="closeWakeModal()" style="width:100%; padding:12px; border-radius: 12px; font-weight: 500;">取消</button></div></div></div>
<div class="sub-modal" id="sleep-text-modal"><div class="sub-modal-box" style="max-width: 400px;"><div class="sub-modal-head"><h3>编辑多段睡眠文案</h3><button class="close-btn" onclick="document.getElementById('sleep-text-modal').classList.remove('show')">✕</button></div><div class="sub-msg-scroll" style="padding: 16px;"><input type="hidden" id="cfg-sleep-role"><div class="form-group"><label>弹窗标题</label><input type="text" id="cfg-sleep-title" placeholder="例如: 今日已打过卡"></div><div class="form-group"><label>描述文字 <span style="color:var(--muted); font-size:0.75rem;">(支持 {time})</span></label><input type="text" id="cfg-sleep-desc" placeholder="...已经在 {time} 休息过了..."></div><div class="form-group"><label>按钮: 新增小睡</label><input type="text" id="cfg-sleep-sub" placeholder="新增一段小睡"></div><div class="form-group"><label>按钮: 跨日熬夜</label><input type="text" id="cfg-sleep-cross" placeholder="算作昨晚的熬夜"></div><div class="form-group"><label>按钮: 覆盖记录</label><input type="text" id="cfg-sleep-overwrite" placeholder="覆盖当前记录"></div><div class="form-group"><label>按钮: 取消打卡</label><input type="text" id="cfg-sleep-cancel" placeholder="取消打卡 (删除记录)"></div></div><div class="sub-modal-foot"><button class="btn outline" onclick="document.getElementById('sleep-text-modal').classList.remove('show')">取消</button><button class="btn primary" onclick="saveSleepTextModal()">保存</button></div></div></div>
<div class="sub-modal" id="wake-text-modal"><div class="sub-modal-box" style="max-width: 400px;"><div class="sub-modal-head"><h3>编辑起床弹窗文案</h3><button class="close-btn" onclick="document.getElementById('wake-text-modal').classList.remove('show')">✕</button></div><div class="sub-msg-scroll" style="padding: 16px;"><input type="hidden" id="cfg-wake-role"><div class="form-group"><label>弹窗标题</label><input type="text" id="cfg-wake-title" placeholder="例如: 今日已打过卡"></div><div class="form-group"><label>描述文字 <span style="color:var(--muted); font-size:0.75rem;">(支持 {time})</span></label><input type="text" id="cfg-wake-desc" placeholder="...已经在 {time} 起过床了..."></div><div class="form-group"><label>按钮: 确定覆盖</label><input type="text" id="cfg-wake-confirm" placeholder="覆盖当前记录"></div><div class="form-group"><label>按钮: 保留原记录</label><input type="text" id="cfg-wake-cancel" placeholder="保留原记录"></div></div><div class="sub-modal-foot"><button class="btn outline" onclick="document.getElementById('wake-text-modal').classList.remove('show')">取消</button><button class="btn primary" onclick="saveWakeTextModal()">保存</button></div></div></div>
<div class="sub-modal" id="notify-text-modal"><div class="sub-modal-box" style="max-width: 480px;"><div class="sub-modal-head"><h3 id="notify-text-modal-title">编辑通知文案</h3><button class="close-btn" onclick="closeNotifyTextModal()">✕</button></div><div style="padding: 12px 16px; border-bottom: 1px dashed var(--border); display: flex; flex-direction: column; gap: 12px;"><div class="form-group" style="margin:0;"><label>发送渠道</label><select id="notify-text-channel"><option value="both">页面 + 后台 (推荐)</option><option value="page">仅页面通知</option><option value="push">仅后台推送</option></select></div><div style="display: flex; justify-content: space-between; align-items: center;"><div class="tip-text" style="margin:0;">开启随机抽取 <span id="notify-text-random-tip" style="color:var(--warn); font-weight:bold; display:none;">(关闭时固定发送第一条)</span></div><label class="toggle-switch" style="transform: scale(0.8);"><input type="checkbox" id="notify-text-random" onchange="document.getElementById('notify-text-random-tip').style.display = this.checked ? 'none' : 'inline';"><span class="slider"></span></label></div></div><div class="sub-msg-scroll" id="notify-text-list" style="padding: 12px 16px;"></div><div style="padding: 0 16px 12px;"><button class="btn-add" onclick="addNotifyTextItem()">➕ 添加一条文案</button></div><div class="sub-modal-foot"><button class="btn outline" onclick="closeNotifyTextModal()">取消</button><button class="btn primary" onclick="saveNotifyTextModal()">保存</button></div></div></div>
<div class="sub-modal" id="progress-text-modal"><div class="sub-modal-box" style="max-width: 400px;"><div class="sub-modal-head"><h3>编辑加载文案</h3><button class="close-btn" onclick="closeProgressTextModal()">✕</button></div><div class="sub-msg-scroll" style="padding: 16px;"><div class="form-group"><label>目标身份</label><select id="cfg-prog-role" onchange="updateProgTextInputs()"><option value="master">先生 / 主人</option><option value="doggy">宝宝 / 小狗</option><option value="both">共用 / 滴滴</option></select></div><div class="tip-text" id="prog-text-tip" style="margin-bottom: 12px; padding: 8px; background: rgba(156, 143, 166, 0.1); border-radius: 6px; border: 1px dashed var(--border); line-height: 1.5;"></div><div class="form-group"><label>连接/请求授权时</label><input type="text" id="cfg-prog-connect"></div><div class="form-group"><label>校验/同步中</label><input type="text" id="cfg-prog-auth"></div><div class="form-group"><label>云端数据交互时</label><input type="text" id="cfg-prog-sync"></div><div class="form-group"><label>取消/清理时</label><input type="text" id="cfg-prog-cancel"></div><div class="form-group"><label>成功完成时</label><input type="text" id="cfg-prog-success"></div></div><div class="sub-modal-foot"><button class="btn primary" onclick="closeProgressTextModal()">完成</button></div></div></div>
<div class="sub-modal" id="sub-modal"><div class="sub-modal-box"><div class="sub-modal-head"><h3 id="sub-modal-title">编辑文案</h3><button class="close-btn" onclick="closeSubMsg()">✕</button></div><div class="sub-msg-scroll" id="sub-msg-list"></div><button class="btn-add" onclick="addSubMsgItem()">➕ 添加一条</button><div class="sub-modal-foot"><button class="btn outline" onclick="closeSubMsg()">取消</button><button class="btn primary" onclick="saveSubMsg()">确认</button></div></div></div>
<div class="sub-modal" id="import-lib-modal"><div class="sub-modal-box" style="max-width: 520px;"><div class="sub-modal-head"><h3>📥 文库导入预览</h3><button class="close-btn" onclick="closeImportLibModal()">✕</button></div><div style="padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--settings-bg);"><div class="form-group" style="margin-bottom: 0;"><label>导入到哪个文案池？</label><select id="import-target-pool"><option value="master_sleep_success">👑 主人 - 休息(达标)</option><option value="master_sleep_late">👑 主人 - 休息(晚睡)</option><option value="master_wake_success">👑 主人 - 起床(达标)</option><option value="master_wake_late">👑 主人 - 起床(赖床)</option><option value="doggy_sleep_success">🎀 小狗 - 睡觉(达标)</option><option value="doggy_sleep_late">🎀 小狗 - 睡觉(晚睡)</option><option value="doggy_wake_success">🎀 小狗 - 起床(达标)</option><option value="doggy_wake_late">🎀 小狗 - 起床(赖床)</option></select></div></div><div style="padding: 12px 16px; overflow-y: auto; flex: 1; max-height: 50vh;" id="import-lib-preview-list"></div><div class="sub-modal-foot"><button class="btn outline" onclick="closeImportLibModal()">取消</button><button class="btn primary" onclick="confirmImportLibrary()">确认导入选中项</button></div></div></div>
<div class="sub-modal" id="custom-time-modal"><div class="sub-modal-box" style="max-width:320px;"><div class="sub-modal-head"><h3 id="custom-time-title" style="font-size:1rem;">修改打卡时间</h3><button class="close-btn" onclick="closeCustomTimeModal()">✕</button></div><div style="padding: 10px 0;"><div class="form-group"><label>打卡具体时间 (24小时制)</label><input type="time" id="custom-time-input" style="font-size:1.2rem; text-align:center; padding:10px;"></div></div><div class="sub-modal-foot" style="flex-wrap:wrap; gap:8px;"><button class="btn danger outline" onclick="submitCustomTime('clear')" style="flex:1 1 100%; padding:8px; font-size:0.8rem;">🗑️ 取消打卡</button><button class="btn outline" onclick="closeCustomTimeModal()" style="flex:1;">取消</button><button class="btn primary" onclick="submitCustomTime('save')" style="flex:1;">保存</button></div></div></div>
<div class="sub-modal" id="diff-modal"><div class="sub-modal-box diff-modal-box"><div class="sub-modal-head"><h3 id="diff-modal-title">同步差异对比</h3><button class="close-btn" onclick="closeDiffModal()">✕</button></div><div style="padding: 10px 20px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; align-items: center; background: var(--settings-bg);"><label style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 600;"><input type="checkbox" id="diff-select-all" checked onchange="toggleAllDiff(this.checked)" style="width: 16px; height: 16px; accent-color: var(--tab-active);">全选差异</label><button class="btn outline" style="font-size: 0.75rem; padding: 4px 10px;" onclick="toggleAllDiff(true)">全选</button><button class="btn outline" style="font-size: 0.75rem; padding: 4px 10px;" onclick="toggleAllDiff(false)">全不选</button></div><div class="diff-scroll" id="diff-content"></div><div class="sub-modal-foot" style="flex-wrap: wrap; gap: 8px;"><button class="btn outline" onclick="closeDiffModal()" style="flex:1;">取消</button><button class="btn primary" id="diff-confirm-btn" onclick="confirmSyncDiff(false)" style="flex:1 1 100%;">应用选中差异</button></div></div></div>

<div id="global-tooltip"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', container.innerHTML);

  // 核心工具：气泡提示逻辑
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