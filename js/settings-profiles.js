window.getTabProfilesHTML = () => `
<div class="tab-content" id="tab-profiles">
  <div class="config-card">
    <div class="config-title">👑 角色专属设定</div>
    
    <div class="dual-tabs">
      <button class="btn dual-tab-btn active" data-target="master" onclick="switchDualSettings('master', this)">👑 <span class="text-master-name"></span></button>
      <button class="btn dual-tab-btn" data-target="doggy" onclick="switchDualSettings('doggy', this)">🎀 <span class="text-doggy-name"></span></button>
    </div>

    <div class="dual-user-group" data-active="master">
      <!-- 主人设定 -->
      <div data-user="master">
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

      <!-- 小狗设定 -->
      <div data-user="doggy" style="display: none;">
        <div class="flex-row">
          <div class="form-group"><label>名字</label><input type="text" id="cfg-doggy-name" placeholder="🍼 宝宝"></div>
          <div class="form-group"><label>标签</label><input type="text" id="cfg-doggy-tag" placeholder="🎀 宝宝"></div>
        </div>
        <div class="flex-row">
          <div class="form-group"><label>地区</label><input type="text" id="cfg-doggy-region" placeholder="纽约"></div>
          <div class="form-group"><label>专属主题色</label><input type="color" id="cfg-color-doggy" value="#f472b6"></div>
        </div>
        <div class="flex-row">
          <div class="form-group"><label>休息按钮文字</label><input type="text" id="cfg-doggy-sleep-btn" placeholder="小狗休息"></div>
          <div class="form-group"><label>起床按钮文字</label><input type="text" id="cfg-doggy-wake-btn" placeholder="小狗起床"></div>
        </div>
      </div>
    </div>
  </div>
</div>`;