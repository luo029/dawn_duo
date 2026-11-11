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
    <div class="config-title">📥 文案库导入<span class="help-icon" data-tip="支持 .txt / .md / .json 格式，系统会按行读取，并自动检索本地库中相似度大于 70% 的文案进行过滤提示。">i</span></div>
    <button class="btn outline" style="width: 100%;" onclick="document.getElementById('import-lib-file').click()">📂 选择文件导入文库</button>
    <input type="file" id="import-lib-file" accept=".txt,.md,.json" style="display: none;" onchange="readLibraryFile(event)">
  </div>
</div>`;