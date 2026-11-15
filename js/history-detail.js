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

    /* 小睡记录列表 */
    .hd-sub-records { margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); padding: 8px; background: var(--settings-bg); border-radius: 8px; border: 1px dashed var(--border); display: flex; flex-direction: column; gap: 4px; }
    .hd-sub-item { display: flex; justify-content: space-between; align-items: center; }
    
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
      
      let sleepSec = sleep.meta?.sleepDuration;
      if (!sleepSec && sleep.done && wake.done) sleepSec = calcDuration(sleep.time, wake.time);
      
      let durationHtml = '';
      if (sleepSec > 0) {
        const h = Math.floor(sleepSec / 3600);
        const m = Math.floor((sleepSec % 3600) / 60);
        const isEx = h >= 8;
        const barClass = isEx ? (isService && isDoggy ? 'excellent-dom' : 'excellent') : '';
        durationHtml = `<div class="hd-duration-bar ${barClass}">${isEx ? '✨' : '💤'} ${isEx ? '优质安睡' : '睡眠时长'} ${h}h${m}m ${isEx ? '✨' : ''}</div>`;
      }

      let subSleepsHtml = '';
      if (sleep.records && sleep.records.length > 1) {
          const subs = sleep.records.filter(r => r.type === 'sub');
          if (subs.length > 0) {
              subSleepsHtml = `<div class="hd-sub-records"><div style="font-weight:800; margin-bottom:4px; color:var(--text);">💤 包含小睡记录：</div>` + subs.map(r => {
                  let timeRange = `${r.time}`;
                  if (r.endTime) timeRange += ` - ${r.endTime}`;
                  let durText = r.duration ? ` (${Math.floor(r.duration/3600)}h${Math.floor((r.duration%3600)/60)}m)` : (r.endTime ? '' : ' (未记录醒来)');
                  return `<div class="hd-sub-item"><span>时间: ${timeRange}${durText}</span><span>${r.ontime ? '达标' : '晚睡'}</span></div>`;
              }).join('') + `</div>`;
          }
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
          ${subSleepsHtml}
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

  // 新增：导出历史详情为图片 (Canvas 绘制)
  window.exportHistoryImage = function(dateStr) {
    const todayRec = { master: db.master?.[dateStr] || {}, doggy: db.doggy?.[dateStr] || {} };
    const t = P().texts || DEFAULT_TEXTS_DAILY;
    const isService = configs.mode === 'service';
    const mName = getPureName(t.masterName) || '先生';
    const dName = getPureName(t.doggyName) || '宝宝';
    
    let showM = false, showD = false;
    if (currentHdView === 'both') { showM = true; showD = true; }
    else if (currentHdView === 'master') { showM = true; }
    else if (currentHdView === 'doggy') { showD = true; }

    const mColor = P().colors?.master || '#a855f7';
    const dColor = P().colors?.doggy || '#fb7185';

    const cards = [];
    if (showM) cards.push({ user: 'master', data: todayRec.master, color: mColor, name: mName, icon: '👑' });
    if (showD) cards.push({ user: 'doggy', data: todayRec.doggy, color: dColor, name: dName, icon: isService ? '⛓️' : '🎀' });

    let totalH = 90; 
    cards.forEach(c => {
        let cH = 160; 
        const sleep = c.data.sleep || {};
        const sleepSec = sleep.meta?.sleepDuration || (sleep.done && c.data.wake?.done ? calcDuration(sleep.time, c.data.wake.time) : 0);
        if (sleepSec > 0) cH += 50;
        if (sleep.records && sleep.records.length > 1) {
            const subs = sleep.records.filter(r => r.type === 'sub');
            if (subs.length > 0) cH += (subs.length * 24) + 30;
        }
        c.h = cH;
        totalH += cH + 20;
    });
    totalH += 40; 

    const W = 600;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W * scale; canvas.height = totalH * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 背景
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.roundRect(0, 0, W, totalH, 24); ctx.fill();

    // 标题
    const dObj = new Date(dateStr);
    const dateTitle = `${dObj.getFullYear()}年${dObj.getMonth()+1}月${dObj.getDate()}日`;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📅 ${isService ? '调教日志 · ' : ''}${dateTitle}`, W/2, 45);

    let y = 80;

    cards.forEach(c => {
        const isDoggy = c.user === 'doggy';
        const sleep = c.data.sleep || {};
        const wake = c.data.wake || {};
        
        // 卡片阴影与背景
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.06)';
        ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
        ctx.beginPath(); ctx.roundRect(30, y, W - 60, c.h, 16); ctx.fill();
        ctx.shadowColor = 'transparent';

        // 左侧色条
        ctx.fillStyle = c.color;
        ctx.beginPath(); 
        ctx.roundRect(30, y, 6, c.h, 3); 
        ctx.fill();

        // 名字
        ctx.fillStyle = c.color;
        ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${c.icon} ${c.name}`, 60, y + 32);

        // 两列
        const colW = (W - 100) / 2;
        const c1X = 60 + colW / 2;
        const c2X = 60 + colW + colW / 2;
        const rowY = y + 65;

        let sLabel = isService ? (isDoggy ? '⛓️ 拘束' : '👑 安寝') : '🌙 休息';
        let wLabel = isService ? (isDoggy ? '🔔 侍奉' : '☀️ 苏醒') : '☀️ 起床';

        ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.textAlign = 'center';
        ctx.fillText(sLabel, c1X, rowY);
        ctx.fillText(wLabel, c2X, rowY);

        // 时间
        ctx.font = 'bold 32px "DIN Alternate", "Helvetica Neue", sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(sleep.done ? sleep.time : '--:--', c1X, rowY + 36);
        ctx.fillText(wake.done ? wake.time : '--:--', c2X, rowY + 36);

        // 状态角标
        const drawBadge = (text, isOntime, cx, cy) => {
            ctx.font = 'bold 12px "PingFang SC", "Microsoft YaHei", sans-serif';
            const tw = ctx.measureText(text).width;
            const bw = tw + 20, bh = 22;
            ctx.fillStyle = isOntime ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            ctx.beginPath(); ctx.roundRect(cx - bw/2, cy - 11, bw, bh, 11); ctx.fill();
            ctx.fillStyle = isOntime ? '#10b981' : '#ef4444';
            ctx.fillText(text, cx, cy + 4);
        };

        if (sleep.done) {
            let txt = isService && isDoggy ? (sleep.ontime ? '服从' : '抗命') : (sleep.ontime ? '达标' : '晚睡');
            drawBadge(txt, sleep.ontime, c1X, rowY + 65);
        }
        if (wake.done) {
            let txt = isService && isDoggy ? (wake.ontime ? '服从' : '抗命') : (wake.ontime ? '达标' : '赖床');
            drawBadge(txt, wake.ontime, c2X, rowY + 65);
        }

        // 中间竖分割线
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(W/2, rowY + 10); ctx.lineTo(W/2, rowY + 70); ctx.stroke();

        let infoY = rowY + 100;

        // 小睡记录
        if (sleep.records && sleep.records.length > 1) {
            const subs = sleep.records.filter(r => r.type === 'sub');
            if (subs.length > 0) {
                ctx.fillStyle = '#64748B';
                ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('💤 包含小睡记录：', 60, infoY);
                infoY += 22;
                subs.forEach(r => {
                    let timeRange = r.time;
                    if (r.endTime) timeRange += ` - ${r.endTime}`;
                    let dur = r.duration ? ` (${Math.floor(r.duration/3600)}h${Math.floor((r.duration%3600)/60)}m)` : (r.endTime ? '' : ' (未醒)');
                    ctx.fillStyle = '#475569';
                    ctx.fillText(`• ${timeRange}${dur}`, 70, infoY);
                    infoY += 22;
                });
                infoY += 10;
            }
        }

        // 底部时长条
        let sleepSec = sleep.meta?.sleepDuration;
        if (!sleepSec && sleep.done && wake.done) sleepSec = calcDuration(sleep.time, wake.time);
        
        if (sleepSec > 0) {
            const h = Math.floor(sleepSec / 3600);
            const m = Math.floor((sleepSec % 3600) / 60);
            const isEx = h >= 8;
            
            ctx.fillStyle = isEx ? 'rgba(234, 179, 8, 0.1)' : 'rgba(241, 245, 249, 1)';
            ctx.beginPath(); ctx.roundRect(60, infoY - 15, W - 120, 36, 8); ctx.fill();
            
            ctx.fillStyle = isEx ? '#eab308' : '#64748B';
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillText(`${isEx ? '✨' : '💤'} ${isEx ? '优质安睡' : '睡眠时长'} ${h}h${m}m ${isEx ? '✨' : ''}`, W/2, infoY + 8);
        }

        y += c.h + 20;
    });

    // 底部水印
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💗 由「契约」生成 · 记录我们的每一天', W/2, totalH - 20);

    // 导出
    canvas.toBlob(blob => {
        if (!blob) return showToast('图片生成失败', 'late');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `契约日志-${dateStr}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('图片已保存 🖼️', 'success');
    }, 'image/png');
  };
});