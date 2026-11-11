document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('history-detail-modal')) return;

  const style = document.createElement('style');
  style.innerHTML = `
    #history-detail-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 300; display: none; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.25s; }
    #history-detail-modal.show { display: flex; opacity: 1; }
    .hd-box { background: var(--card-bg); border-radius: 24px; width: 90%; max-width: 420px; padding: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); transform: translateY(20px) translateZ(0); transition: transform 0.3s; border: 1px solid var(--border); }
    #history-detail-modal.show .hd-box { transform: translateY(0) translateZ(0); }
    .hd-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .hd-title { font-size: 1.15rem; font-weight: 800; color: var(--text); }
    .hd-close { background: var(--btn-bg); border: none; color: var(--text-muted); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; justify-content: center; align-items: center; transition: all 0.2s; }
    .hd-close:hover { background: var(--warn-bg); color: var(--warn); }

    .hd-view-tabs { display: flex; background: var(--input-bg); border-radius: 12px; padding: 4px; margin-bottom: 16px; gap: 4px; border: 1px solid var(--border); }
    .hd-view-tabs button { flex: 1; padding: 6px 0; border-radius: 8px; border: none; background: transparent; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .hd-view-tabs button.active { background: var(--card-bg); color: var(--tab-active); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    .hd-user-card { background: var(--bg); border-radius: 14px; padding: 14px 16px; margin-bottom: 10px; border: 1px solid var(--border); position: relative; overflow: hidden; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .hd-user-card.master::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--master-color); }
    .hd-user-card.doggy::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--doggy-color); }
    .hd-user-name { font-size: 0.95rem; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .hd-user-card.master .hd-user-name { color: var(--master-color); }
    .hd-user-card.doggy .hd-user-name { color: var(--doggy-color); }
    
    .hd-flex-row { display: flex; gap: 12px; margin-bottom: 12px; }
    .hd-col { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; background: var(--card-bg); border-radius: 10px; border: 1px solid var(--border); }
    .hd-label { color: var(--text-muted); font-weight: 600; font-size: 0.7rem; display: flex; align-items: center; gap: 4px; }
    .hd-time { color: var(--text); font-size: 1.3rem; font-weight: 800; font-family: 'DIN Alternate', sans-serif; margin: 2px 0; }
    .hd-badge { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block; width: fit-content; }
    .hd-badge.success { background: var(--success-bg); color: var(--success); }
    .hd-badge.late { background: var(--warn-bg); color: var(--warn); }
    .hd-badge.none { background: var(--btn-bg); color: var(--text-muted); }
    .hd-badge.dom { background: rgba(139,0,0,0.1); color: #8B0000; }
    .hd-badge.sub { background: rgba(0,0,0,0.06); color: #555555; }
    
    .hd-duration-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 12px; background: var(--btn-bg); border: 1px dashed var(--border); border-radius: 10px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
    .hd-duration-bar.excellent { background: rgba(184, 134, 11, 0.1); border-color: rgba(184, 134, 11, 0.4); color: #B8860B; border-style: solid; }
    
    .hd-actions { display: flex; gap: 12px; margin-top: 16px; }
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
    if (identity === 'master' || identity === 'doggy') {
      currentHdView = identity;
    } else {
      currentHdView = 'both';
    }
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
      
      let sBadge, wBadge;
      if (isService && isDoggy) {
        sBadge = sleep.done ? `<span class="hd-badge ${sleep.ontime ? 'dom' : 'sub'}">${sleep.ontime ? '服从' : '抗命'}</span>` : `<span class="hd-badge none">未打卡</span>`;
        wBadge = wake.done ? `<span class="hd-badge ${wake.ontime ? 'dom' : 'sub'}">${wake.ontime ? '服从' : '抗命'}</span>` : `<span class="hd-badge none">未打卡</span>`;
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
        if (h >= 8) durationHtml = `<div class="hd-duration-bar excellent"><span>✨</span> 优质安睡 ${h}h${m}m <span>✨</span></div>`;
        else durationHtml = `<div class="hd-duration-bar"><span>💤</span> 睡眠时长 ${h}h${m}m</div>`;
      }

      return `
        <div class="hd-user-card ${cls}">
          <div class="hd-user-name">${isDoggy ? (isService ? '⛓️' : '🎀') : '👑'} ${name}</div>
          <div class="hd-flex-row">
            <div class="hd-col">
              <div class="hd-label">🌙 休息</div>
              <div class="hd-time">${sleep.done ? sleep.time : '--:--'}</div>
              ${sBadge}
            </div>
            <div class="hd-col">
              <div class="hd-label">☀️ 起床</div>
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
    const cardH = 230;
    const gap = 20;
    const H = startY + userCount * (cardH + gap) + 60;
    
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // 主题配色 - 彻底抛弃纯暗黑，主仆模式采用高级浅色
    let bg, text, muted, masterColor, doggyColor, cardBg, borderColor;
    if (isService) {
      bg = '#F6F4F5';       // 极浅灰粉色
      cardBg = '#FFFFFF';   // 纯白卡片
      text = '#1A1A1A';     // 深黑文字
      muted = '#888888';    // 灰色辅助文字
      masterColor = '#8B0000'; // 暗红
      doggyColor = '#C71585';  // 紫红
      borderColor = 'rgba(139,0,0,0.15)';
    } else {
      bg = isDark ? '#120f17' : '#f4f8fc';
      cardBg = isDark ? '#1c1825' : '#ffffff';
      text = isDark ? '#f3eef6' : '#1e1b2e';
      muted = isDark ? '#9c8fa6' : '#706881';
      masterColor = (P().colors || {}).master || '#38bdf8';
      doggyColor = (P().colors || {}).doggy || '#f472b6';
      borderColor = 'rgba(0,0,0,0.06)';
    }

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 顶部装饰条
    if (isService) {
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, masterColor);
      grad.addColorStop(1, doggyColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 6);
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, masterColor);
      grad.addColorStop(1, doggyColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 8);
    }

    ctx.fillStyle = isService ? masterColor : text;
    ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isService ? '契约调教日报' : '契约打卡日报', W/2, 70);

    ctx.fillStyle = muted;
    ctx.font = '18px "PingFang SC", sans-serif';
    ctx.fillText(dateTitle, W/2, 110);

    // 顶部摘要
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
    const sw = ctx.measureText(summaryText).width + 36;
    ctx.fillStyle = isService ? 'rgba(139,0,0,0.08)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)');
    ctx.beginPath(); ctx.roundRect((W - sw) / 2, 135, sw, 32, 16); ctx.fill();
    
    const excellentColor = isService ? masterColor : '#10b981';
    ctx.fillStyle = ontimeCount === total ? excellentColor : (ontimeCount > 0 ? text : muted);
    ctx.textAlign = 'center';
    ctx.fillText(summaryText, W/2, 157);

    // 绘制用户卡片
    function drawUserCard(user, name, data, y) {
      const color = user === 'master' ? masterColor : doggyColor;
      const isMaster = user === 'master';
      const isDoggy = user === 'doggy';
      const sleep = data.sleep || {};
      const wake = data.wake || {};

      // 卡片背景
      ctx.fillStyle = cardBg;
      ctx.beginPath(); ctx.roundRect(40, y, W - 80, cardH, 20); ctx.fill();
      
      // 左侧强调线
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(40, y, 8, cardH, [20, 0, 0, 20]); ctx.fill();

      // 名字
      ctx.fillStyle = color;
      ctx.font = 'bold 24px "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${isMaster ? '👑' : (isService ? '⛓️' : '🎀')} ${name}`, 70, y + 45);

      // 分割线
      ctx.strokeStyle = isService ? 'rgba(139,0,0,0.1)' : borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(70, y + 65); ctx.lineTo(W - 70, y + 65); ctx.stroke();

      const leftX = 70, rightX = 320, dataY = y + 90;

      function drawBlock(title, icon, time, isDone, isOntime, x) {
        ctx.fillStyle = muted;
        ctx.font = '14px "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${icon} ${title}`, x, dataY);

        ctx.fillStyle = isDone ? (isOntime ? (isService ? masterColor : '#10b981') : text) : muted;
        ctx.font = 'bold 32px "DIN Alternate", "PingFang SC", sans-serif';
        ctx.fillText(isDone ? time : '--:--', x, dataY + 42);

        if (isDone) {
          let label, badgeBg, badgeColor;
          if (isService && isDoggy) {
            label = isOntime ? '服从' : '抗命';
            badgeBg = isOntime ? 'rgba(139,0,0,0.1)' : 'rgba(0,0,0,0.06)';
            badgeColor = isOntime ? masterColor : '#555555';
          } else {
            label = isOntime ? '达标' : (title === '休息' ? '晚睡' : '赖床');
            badgeBg = isOntime ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
            badgeColor = isOntime ? '#10b981' : '#ef4444';
          }
          
          ctx.font = 'bold 12px sans-serif';
          const tw = ctx.measureText(label).width + 16;
          ctx.fillStyle = badgeBg;
          ctx.beginPath(); ctx.roundRect(x, dataY + 55, tw, 24, 12); ctx.fill();
          ctx.fillStyle = badgeColor;
          ctx.textAlign = 'center';
          ctx.fillText(label, x + tw/2, dataY + 72);
        } else {
          ctx.fillStyle = muted;
          ctx.font = '12px "PingFang SC", sans-serif';
          ctx.fillText('未打卡', x, dataY + 65);
        }
      }

      drawBlock('休息', '🌙', sleep.time, sleep.done, sleep.ontime, leftX);
      drawBlock('起床', '☀️', wake.time, wake.done, wake.ontime, rightX);

      // 底部睡眠时长条
      let sleepSec = wake.meta?.sleepDuration;
      if (!sleepSec && sleep.done && wake.done) sleepSec = calcDuration(sleep.time, wake.time);
      
      if (sleepSec > 0) {
        const h = Math.floor(sleepSec / 3600);
        const m = Math.floor((sleepSec % 3600) / 60);
        const isEx = h >= 8;
        
        const barY = y + cardH - 50;
        const barW = W - 140;
        
        ctx.fillStyle = isEx ? (isService ? 'rgba(184,134,11,0.1)' : 'rgba(234,179,8,0.1)') : (isService ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.03)');
        ctx.beginPath(); ctx.roundRect(70, barY, barW, 32, 8); ctx.fill();
        
        if (isEx) {
          ctx.strokeStyle = isService ? 'rgba(184,134,11,0.4)' : 'rgba(234,179,8,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(70, barY, barW, 32, 8); ctx.stroke();
        }

        ctx.fillStyle = isEx ? (isService ? '#B8860B' : '#eab308') : muted;
        ctx.font = 'bold 13px "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        const durText = isEx ? `✨ 优质安睡 ${h}h${m}m ✨` : `💤 睡眠时长 ${h}h${m}m`;
        ctx.fillText(durText, W/2, barY + 21);
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