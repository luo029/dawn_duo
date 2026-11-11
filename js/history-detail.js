document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('history-detail-modal')) return;

  const style = document.createElement('style');
  style.innerHTML = `
    #history-detail-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 300; display: none; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.25s; padding: 16px; }
    #history-detail-modal.show { display: flex; opacity: 1; }
    .hd-box { background: var(--card-bg); border-radius: 24px; width: 100%; max-width: 420px; max-height: 88vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.3); transform: translateY(20px) translateZ(0); transition: transform 0.3s; border: 1px solid var(--border); overflow: hidden; }
    #history-detail-modal.show .hd-box { transform: translateY(0) translateZ(0); }
    
    .hd-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px dashed var(--border); flex-shrink: 0; }
    .hd-title { font-size: 1.15rem; font-weight: 800; color: var(--text); }
    .hd-close { background: var(--btn-bg); border: none; color: var(--text-muted); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; justify-content: center; align-items: center; transition: all 0.2s; }
    .hd-close:hover { background: var(--warn-bg); color: var(--warn); }

    .hd-view-tabs { display: flex; background: var(--input-bg); border-radius: 12px; padding: 4px; margin: 12px 20px; gap: 4px; border: 1px solid var(--border); flex-shrink: 0; }
    .hd-view-tabs button { flex: 1; padding: 6px 0; border-radius: 8px; border: none; background: transparent; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .hd-view-tabs button.active { background: var(--card-bg); color: var(--tab-active); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    .hd-body { padding: 0 20px 12px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; }
    
    .hd-user-card { background: var(--bg); border-radius: 16px; padding: 16px; margin-bottom: 12px; border: 1px solid var(--border); position: relative; overflow: hidden; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .hd-user-card.master::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--master-color); }
    .hd-user-card.doggy::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--doggy-color); }
    .hd-user-name { font-size: 1rem; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
    .hd-user-card.master .hd-user-name { color: var(--master-color); }
    .hd-user-card.doggy .hd-user-name { color: var(--doggy-color); }
    
    .hd-flex-row { display: flex; align-items: stretch; margin-bottom: 12px; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border); padding: 12px 10px; }
    .hd-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
    .hd-divider { width: 1px; background: var(--border); margin: 0 8px; }
    .hd-label { color: var(--text-muted); font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
    .hd-time { color: var(--text); font-size: clamp(1.3rem, 5vw, 1.6rem); font-weight: 900; font-family: 'DIN Alternate', sans-serif; margin: 2px 0; letter-spacing: 1px; }
    .hd-badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 12px; font-weight: 700; display: inline-block; letter-spacing: 1px; }
    .hd-badge.success { background: var(--success-bg); color: var(--success); }
    .hd-badge.late { background: var(--warn-bg); color: var(--warn); }
    .hd-badge.none { background: var(--btn-bg); color: var(--text-muted); }
    .hd-badge.dom { background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3); }
    .hd-badge.sub-dom { background: rgba(21,128,61,0.15); color: #15803D; border: 1px solid rgba(21,128,61,0.3); }
    .hd-badge.sub-bad { background: rgba(230,57,70,0.15); color: #E63946; border: 1px solid rgba(230,57,70,0.3); }
    
    .hd-duration-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 12px; background: var(--btn-bg); border: 1px dashed var(--border); border-radius: 10px; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
    .hd-duration-bar.excellent { background: rgba(234, 179, 8, 0.1); border-color: rgba(234, 179, 8, 0.4); color: #eab308; border-style: solid; }
    .hd-duration-bar.excellent-dom { background: rgba(212, 175, 55, 0.1); border-color: rgba(212, 175, 55, 0.4); color: #D4AF37; border-style: solid; }
    
    .hd-actions { display: flex; gap: 12px; padding: 12px 20px 16px; border-top: 1px dashed var(--border); flex-shrink: 0; background: var(--card-bg); }
    .hd-actions button { flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
    .hd-btn-img { background: linear-gradient(135deg, var(--master-color), var(--doggy-color)); color: white; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3); }
    .hd-btn-img:hover { opacity: 0.9; transform: translateY(-2px); }
    .hd-btn-close { background: var(--input-bg); border: 1px solid var(--border); color: var(--text); }
    .hd-btn-close:hover { border-color: var(--text-muted); }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.id = 'history-detail-modal';
  modal.innerHTML = `<div class="hd-box" id="hd-content-box"></div>`;
  document.body.appendChild(modal);

  let currentHdDate = null;
  let currentHdView = 'both';

  window.openHistoryDetail = function(dateStr) {
    currentHdDate = dateStr;
    currentHdView = (identity === 'master' || identity === 'doggy') ? identity : 'both';
    renderHdModal();
    modal.classList.add('show');
  };

  window.changeHdView = function(view) {
    currentHdView = view;
    renderHdModal();
  };

  function calcDuration(sTime, wTime) {
    if (!sTime || !wTime) return 0;
    const toM = t => { const p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); };
    let diff = toM(wTime) - toM(sTime);
    if (diff < 0) diff += 1440;
    return diff * 60;
  }

  function renderHdModal() {
    const dateStr = currentHdDate;
    const todayRec = { master: db.master?.[dateStr] || {}, doggy: db.doggy?.[dateStr] || {} };
    const t = P().texts || DEFAULT_TEXTS_DAILY;
    const mName = getPureName(t.masterName) || '先生';
    const dName = getPureName(t.doggyName) || '宝宝';
    const isService = configs.mode === 'service';
    
    const dObj = new Date(dateStr);
    const dateTitle = `${dObj.getFullYear()}年${dObj.getMonth()+1}月${dObj.getDate()}日`;

    function buildCard(user, name, data, cls) {
      const sleep = data.sleep || {};
      const wake = data.wake || {};
      const isDoggy = user === 'doggy';
      
      let sLabel = '🌙 休息', wLabel = '☀️ 起床';
      if (isService) {
        if (isDoggy) { sLabel = '⛓️ 拘束'; wLabel = '🔔 侍奉'; }
        else { sLabel = '👑 安寝'; wLabel = '☀️ 苏醒'; }
      }

      let sBadge, wBadge;
      if (isService && isDoggy) {
        sBadge = sleep.done ? `<span class="hd-badge ${sleep.ontime ? 'sub-dom' : 'sub-bad'}">${sleep.ontime ? '服从' : '抗命'}</span>` : `<span class="hd-badge none">未打卡</span>`;
        wBadge = wake.done ? `<span class="hd-badge ${wake.ontime ? 'sub-dom' : 'sub-bad'}">${wake.ontime ? '服从' : '抗命'}</span>` : `<span class="hd-badge none">未打卡</span>`;
      } else {
        sBadge = sleep.done ? `<span class="hd-badge ${sleep.ontime ? 'success' : 'late'}">${sleep.ontime ? '达标' : '晚睡'}</span>` : `<span class="hd-badge none">未打卡</span>`;
        wBadge = wake.done ? `<span class="hd-badge ${wake.ontime ? 'success' : 'late'}">${wake.ontime ? '达标' : '赖床'}</span>` : `<span class="hd-badge none">未打卡</span>`;
      }
      
      let sleepSec = wake.meta?.sleepDuration;
      if (!sleepSec && sleep.done && wake.done) sleepSec = calcDuration(sleep.time, wake.time);
      
      let durationHtml = '';
      if (sleepSec > 0) {
        const h = Math.floor(sleepSec / 3600);
        const m = Math.floor((sleepSec % 3600) / 60);
        const isEx = h >= 8;
        const barClass = isEx ? (isService && isDoggy ? 'excellent-dom' : 'excellent') : '';
        durationHtml = `<div class="hd-duration-bar ${barClass}">${isEx ? '✨' : '💤'} ${isEx ? '优质安睡' : '睡眠时长'} ${h}h${m}m ${isEx ? '✨' : ''}</div>`;
      }

      return `
        <div class="hd-user-card ${cls}">
          <div class="hd-user-name">${isDoggy ? (isService ? '⛓️' : '🎀') : '👑'} ${name}</div>
          <div class="hd-flex-row">
            <div class="hd-col">
              <div class="hd-label">${sLabel}</div>
              <div class="hd-time">${sleep.done ? sleep.time : '--:--'}</div>
              ${sBadge}
            </div>
            <div class="hd-divider"></div>
            <div class="hd-col">
              <div class="hd-label">${wLabel}</div>
              <div class="hd-time">${wake.done ? wake.time : '--:--'}</div>
              ${wBadge}
            </div>
          </div>
          ${durationHtml}
        </div>
      `;
    }

    const box = document.getElementById('hd-content-box');
    
    const tabBoth = `<button class="${currentHdView === 'both' ? 'active' : ''}" onclick="changeHdView('both')">双人对比</button>`;
    const tabMaster = `<button class="${currentHdView === 'master' ? 'active' : ''}" onclick="changeHdView('master')">只看${mName}</button>`;
    const tabDoggy = `<button class="${currentHdView === 'doggy' ? 'active' : ''}" onclick="changeHdView('doggy')">只看${dName}</button>`;

    let bodyHtml = '';
    if (currentHdView === 'both' || currentHdView === 'master') bodyHtml += buildCard('master', mName, todayRec.master, 'master');
    if (currentHdView === 'both' || currentHdView === 'doggy') bodyHtml += buildCard('doggy', dName, todayRec.doggy, 'doggy');

    box.innerHTML = `
      <div class="hd-head">
        <div class="hd-title">📅 ${isService ? '调教日志 · ' : ''}${dateTitle}</div>
        <button class="hd-close" onclick="document.getElementById('history-detail-modal').classList.remove('show')">✕</button>
      </div>
      
      <div class="hd-view-tabs">
        ${tabBoth} ${tabMaster} ${tabDoggy}
      </div>

      <div class="hd-body">
        ${bodyHtml}
      </div>

      <div class="hd-actions">
        <button class="hd-btn-close" onclick="document.getElementById('history-detail-modal').classList.remove('show')">关闭</button>
        <button class="hd-btn-img" onclick="window.exportHistoryImage('${dateStr}')">✨ 保存当前画面</button>
      </div>
    `;
  }

  window.exportHistoryImage = function(dateStr) {
    const todayRec = { master: db.master?.[dateStr] || {}, doggy: db.doggy?.[dateStr] || {} };
    const t = P().texts || DEFAULT_TEXTS_DAILY;
    const mName = getPureName(t.masterName) || '先生';
    const dName = getPureName(t.doggyName) || '宝宝';
    const dObj = new Date(dateStr);
    const dateTitle = `${dObj.getFullYear()}年${dObj.getMonth()+1}月${dObj.getDate()}日`;
    const isService = configs.mode === 'service';

    const showM = currentHdView === 'both' || currentHdView === 'master';
    const showD = currentHdView === 'both' || currentHdView === 'doggy';
    let userCount = 0;
    if (showM) userCount++;
    if (showD) userCount++;

    const W = 600;
    const startY = 180;
    const cardH = 210;
    const gap = 20;
    const H = startY + userCount * (cardH + gap) + 60;
    
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // 奶白底色，极致清晰
    let bg, text, muted, masterColor, doggyColor, cardBg, borderColor, dividerColor;
    if (isService) {
      bg = '#FAF7F5';         
      cardBg = '#FFFFFF';     
      text = '#1A1A1A';       // 统一深黑时间
      muted = '#7A7A7A';      
      masterColor = '#D4AF37'; // 主人的暗金色
      doggyColor = '#E63946';  // 小狗的鲜血红
      borderColor = 'rgba(212,175,55,0.3)'; 
      dividerColor = 'rgba(230,57,70,0.15)';
    } else {
      bg = isDark ? '#120f17' : '#f4f8fc';
      cardBg = isDark ? '#1c1825' : '#ffffff';
      text = isDark ? '#f3eef6' : '#1e1b2e';
      muted = isDark ? '#9c8fa6' : '#706881';
      masterColor = (P().colors || {}).master || '#38bdf8';
      doggyColor = (P().colors || {}).doggy || '#f472b6';
      borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      dividerColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    }

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 顶部装饰线
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    if (isService) {
      grad.addColorStop(0, masterColor);
      grad.addColorStop(0.5, doggyColor);
      grad.addColorStop(1, masterColor);
    } else {
      grad.addColorStop(0, masterColor);
      grad.addColorStop(1, doggyColor);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, isService ? 4 : 8);

    // 标题
    ctx.fillStyle = isService ? '#2D262F' : text;
    ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isService ? '契 约 调 教 日 报' : '契约打卡日报', W/2, 70);

    // 日期
    ctx.fillStyle = muted;
    ctx.font = '18px "PingFang SC", sans-serif';
    ctx.fillText(dateTitle, W/2, 110);

    // 摘要
    function countOntime(data) {
      let c = 0;
      if (data.sleep?.done && data.sleep.ontime) c++;
      if (data.wake?.done && data.wake.ontime) c++;
      return c;
    }
    let ontimeCount = 0;
    if (showM) ontimeCount += countOntime(todayRec.master);
    if (showD) ontimeCount += countOntime(todayRec.doggy);
    const total = userCount * 2;
    const summaryText = isService ? `今日履约 ${ontimeCount}/${total}` : `今日达标 ${ontimeCount}/${total}`;
    
    ctx.font = 'bold 15px "PingFang SC", sans-serif';
    const sw = ctx.measureText(summaryText).width + 40;
    ctx.fillStyle = isService ? 'rgba(212,175,55,0.1)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)');
    ctx.beginPath(); ctx.roundRect((W - sw) / 2, 135, sw, 32, 16); ctx.fill();
    if (isService) {
      ctx.strokeStyle = 'rgba(212,175,55,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect((W - sw) / 2, 135, sw, 32, 16); ctx.stroke();
    }
    
    ctx.fillStyle = ontimeCount === total ? (isService ? masterColor : '#10b981') : text;
    ctx.textAlign = 'center';
    ctx.fillText(summaryText, W/2, 157);

    // 绘制卡片
    function drawUserCard(user, name, data, y) {
      const color = user === 'master' ? masterColor : doggyColor;
      const isMaster = user === 'master';
      const isDoggy = user === 'doggy';
      const sleep = data.sleep || {};
      const wake = data.wake || {};

      // 卡片背景
      ctx.shadowColor = isService ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.05)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = cardBg;
      ctx.beginPath(); ctx.roundRect(40, y, W - 80, cardH, 20); ctx.fill();
      ctx.shadowColor = 'transparent';

      if (isService) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(40, y, W - 80, cardH, 20); ctx.stroke();
      }

      // 左侧强调线
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(40, y, 8, cardH, [20, 0, 0, 20]); ctx.fill();

      // 名字
      ctx.fillStyle = color;
      ctx.font = 'bold 24px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${isMaster ? '👑' : (isService ? '⛓️' : '🎀')} ${name}`, W/2, y + 40);

      // 标签定义
      let sLabel = '🌙 休息', wLabel = '☀️ 起床';
      if (isService) {
        if (isDoggy) { sLabel = '⛓️ 拘束'; wLabel = '🔔 侍奉'; }
        else { sLabel = '👑 安寝'; wLabel = '☀️ 苏醒'; }
      }

      const midX = W / 2;
      const boxY = y + 65;
      
      // 左区块
      const leftCX = 40 + (W - 80) / 4;
      ctx.fillStyle = muted;
      ctx.font = '14px "PingFang SC", sans-serif';
      ctx.fillText(sLabel, leftCX, boxY + 20);

      // 时间统一深色
      ctx.fillStyle = sleep.done ? text : muted;
      ctx.font = 'bold 38px "DIN Alternate", "PingFang SC", sans-serif';
      ctx.fillText(sleep.done ? sleep.time : '--:--', leftCX, boxY + 65);

      if (sleep.done) {
        let label, bgColor, txtColor;
        if (isService && isDoggy) {
          label = sleep.ontime ? '服从' : '抗命';
          bgColor = sleep.ontime ? 'rgba(21,128,61,0.15)' : 'rgba(230,57,70,0.15)';
          txtColor = sleep.ontime ? '#15803D' : doggyColor;
        } else {
          label = sleep.ontime ? '达标' : '晚睡';
          bgColor = sleep.ontime ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
          txtColor = sleep.ontime ? '#10b981' : '#ef4444';
        }
        ctx.font = 'bold 12px sans-serif';
        const tw = ctx.measureText(label).width + 20;
        ctx.fillStyle = bgColor;
        ctx.beginPath(); ctx.roundRect(leftCX - tw/2, boxY + 75, tw, 22, 11); ctx.fill();
        ctx.fillStyle = txtColor;
        ctx.fillText(label, leftCX, boxY + 91);
      } else {
        ctx.fillStyle = muted;
        ctx.font = '12px "PingFang SC", sans-serif';
        ctx.fillText('未打卡', leftCX, boxY + 85);
      }

      // 右区块
      const rightCX = 40 + (W - 80) * 3 / 4;
      ctx.fillStyle = muted;
      ctx.font = '14px "PingFang SC", sans-serif';
      ctx.fillText(wLabel, rightCX, boxY + 20);

      // 时间统一深色
      ctx.fillStyle = wake.done ? text : muted;
      ctx.font = 'bold 38px "DIN Alternate", "PingFang SC", sans-serif';
      ctx.fillText(wake.done ? wake.time : '--:--', rightCX, boxY + 65);

      if (wake.done) {
        let label, bgColor, txtColor;
        if (isService && isDoggy) {
          label = wake.ontime ? '服从' : '抗命';
          bgColor = wake.ontime ? 'rgba(21,128,61,0.15)' : 'rgba(230,57,70,0.15)';
          txtColor = wake.ontime ? '#15803D' : doggyColor;
        } else {
          label = wake.ontime ? '达标' : '赖床';
          bgColor = wake.ontime ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
          txtColor = wake.ontime ? '#10b981' : '#ef4444';
        }
        ctx.font = 'bold 12px sans-serif';
        const tw = ctx.measureText(label).width + 20;
        ctx.fillStyle = bgColor;
        ctx.beginPath(); ctx.roundRect(rightCX - tw/2, boxY + 75, tw, 22, 11); ctx.fill();
        ctx.fillStyle = txtColor;
        ctx.fillText(label, rightCX, boxY + 91);
      } else {
        ctx.fillStyle = muted;
        ctx.font = '12px "PingFang SC", sans-serif';
        ctx.fillText('未打卡', rightCX, boxY + 85);
      }

      // 中间分割线
      ctx.strokeStyle = dividerColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(midX, boxY + 10);
      ctx.lineTo(midX, boxY + 90);
      ctx.stroke();

      // 睡眠时长条
      let sleepSec = wake.meta?.sleepDuration;
      if (!sleepSec && sleep.done && wake.done) sleepSec = calcDuration(sleep.time, wake.time);
      
      if (sleepSec > 0) {
        const h = Math.floor(sleepSec / 3600);
        const m = Math.floor((sleepSec % 3600) / 60);
        const isEx = h >= 8;
        
        const barY = y + cardH - 45;
        const barW = W - 140;
        const barX = 70;
        
        ctx.fillStyle = isEx 
          ? (isService ? 'rgba(212,175,55,0.1)' : 'rgba(234,179,8,0.1)') 
          : (isService ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.03)');
        ctx.beginPath(); ctx.roundRect(barX, barY, barW, 26, 13); ctx.fill();
        
        if (isEx) {
          ctx.strokeStyle = isService ? 'rgba(212,175,55,0.4)' : 'rgba(234,179,8,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(barX, barY, barW, 26, 13); ctx.stroke();
        }

        ctx.fillStyle = isEx ? (isService ? masterColor : '#eab308') : muted;
        ctx.font = 'bold 12px "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        const durText = isEx ? `✨ 优质安睡 ${h}h${m}m ✨` : `💤 睡眠时长 ${h}h${m}m`;
        ctx.fillText(durText, W/2, barY + 17);
      }
    }

    let currentY = startY;
    if (showM) { drawUserCard('master', mName, todayRec.master, currentY); currentY += cardH + gap; }
    if (showD) { drawUserCard('doggy', dName, todayRec.doggy, currentY); currentY += cardH + gap; }

    // 底部水印
    ctx.fillStyle = muted;
    ctx.font = '14px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    const footerText = isService ? '⛓️ 由「契约」生成 · 谨记规矩' : '💗 由「契约」生成 · 每一天的作息都很重要';
    ctx.fillText(footerText, W/2, H - 30);

    canvas.toBlob(blob => {
      if (!blob) return showToast('图片生成失败', 'late');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `契约日报-${dateStr}-${currentHdView}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast('分享图已保存 🖼️', 'success');
    }, 'image/png');
  };
});