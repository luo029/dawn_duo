window.exportJSON = function() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr); dlAnchorElem.setAttribute("download", "records.json");
  document.body.appendChild(dlAnchorElem); dlAnchorElem.click(); document.body.removeChild(dlAnchorElem);
  showToast('JSON 导出成功', 'success');
};
window.exportCSV = function() {
  try {
    const rows = [['日期', '用户', '类型', '状态', '时间', '达标', '打卡时间戳', '时区', '设备', '位置', '睡眠时长(分钟)']];
    for (const u of ['master', 'doggy']) {
      if (!db[u]) continue;
      for (const d of Object.keys(db[u]).sort()) {
        for (const t of ['sleep', 'wake']) {
          const rec = db[u][d]?.[t];
          if (rec && rec.done) {
            if (t === 'sleep' && rec.records && rec.records.length > 0) {
              rec.records.forEach(r => {
                rows.push([ d, u === 'master' ? '主人' : '小狗', r.type === 'main' ? '休息(主)' : '小睡(副)', r.ontime ? '按时' : '迟到', r.time || '', r.ontime ? '是' : '否', r.timestamp ? new Date(r.timestamp).toLocaleString() : '', r.meta?.timezone || '', r.meta?.device || '', r.meta?.location || '', '' ]);
              });
            } else {
              rows.push([ d, u === 'master' ? '主人' : '小狗', t === 'sleep' ? '休息' : '起床', rec.ontime ? '按时' : '迟到', rec.time || '', rec.ontime ? '是' : '否', rec.meta?.timestamp ? new Date(rec.meta.timestamp).toLocaleString() : '', rec.meta?.timezone || '', rec.meta?.device || '', rec.meta?.location || '', rec.meta?.sleepDuration ? Math.floor(rec.meta.sleepDuration / 60) : '' ]);
            }
          }
        }
      }
    }
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `dawn-duo-records-${getLogicalDateStr()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('CSV 导出成功 📊', 'success');
  } catch (e) { showToast('CSV 导出失败: ' + e.message, 'late'); }
};
window.exportAsImage = function() {
  try {
    const W = 800, H = 1000;
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = isDark ? '#120f17' : '#f4f8fc'; const text = isDark ? '#f3eef6' : '#1e1b2e'; const muted = isDark ? '#9c8fa6' : '#706881'; const empty = isDark ? '#2a2536' : '#e2e8f0';
    const masterColor = P().colors?.master || '#38bdf8'; const doggyColor = P().colors?.doggy || '#f472b6';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = text; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(P().texts?.title || '契约打卡报告', W/2, 60);
    ctx.font = '16px sans-serif'; ctx.fillStyle = muted; ctx.fillText(`契约日: ${getLogicalDateStr()}`, W/2, 90);
    const today = getLogicalDateStr();
    ctx.textAlign = 'left'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = text; ctx.fillText('今日打卡', 40, 150);
    const users = [ { key: 'master', label: getPureName(P().texts?.masterName) || '主人', color: masterColor }, { key: 'doggy', label: getPureName(P().texts?.doggyName) || '小狗', color: doggyColor } ];
    let y = 190;
    for (const u of users) {
      ctx.fillStyle = u.color; ctx.font = 'bold 22px sans-serif'; ctx.fillText(u.label, 40, y); y += 36;
      ctx.font = '18px sans-serif';
      for (const t of ['sleep', 'wake']) {
        const rec = db[u.key]?.[today]?.[t]; const label = t === 'sleep' ? '休息' : '起床';
        ctx.fillStyle = text; ctx.fillText(`${label}:`, 60, y);
        if (rec && rec.done) {
          ctx.fillStyle = rec.ontime ? '#10b981' : '#ef4444';
          let txt = `${rec.time} ${rec.ontime ? '✓ 按时' : '✗ 迟到'}`;
          if (t === 'sleep' && rec.records && rec.records.length > 1) txt += ` (共${rec.records.length}次)`;
          if (t === 'wake' && rec.meta?.sleepDuration) txt += ` (睡眠: ${Math.floor(rec.meta.sleepDuration/3600)}h${Math.floor((rec.meta.sleepDuration%3600)/60)}m)`;
          ctx.fillText(txt, 140, y);
        } else { ctx.fillStyle = muted; ctx.fillText('未打卡', 140, y); }
        y += 30;
      }
      y += 20;
    }
    ctx.fillStyle = text; ctx.font = 'bold 20px sans-serif'; ctx.fillText('最近 14 天', 40, y + 10); y += 50;
    const cell = 24, gap = 8; let x = 40;
    for (let i = 13; i >= 0; i--) {
      const ds = getLogicalDateStr(i);
      const mScore = (db.master?.[ds]?.sleep?.done ? 1 : 0) + (db.master?.[ds]?.wake?.done ? 1 : 0);
      const dScore = (db.doggy?.[ds]?.sleep?.done ? 1 : 0) + (db.doggy?.[ds]?.wake?.done ? 1 : 0);
      ctx.globalAlpha = 1;
      if (mScore === 2 && dScore === 2) { ctx.fillStyle = masterColor; ctx.fillRect(x, y, cell, cell/2); ctx.fillStyle = doggyColor; ctx.fillRect(x, y + cell/2, cell, cell/2); }
      else if (mScore === 2) { ctx.fillStyle = masterColor; ctx.fillRect(x, y, cell, cell); }
      else if (dScore === 2) { ctx.fillStyle = doggyColor; ctx.fillRect(x, y, cell, cell); }
      else if (mScore > 0 && dScore > 0) { ctx.globalAlpha = 0.4; ctx.fillStyle = masterColor; ctx.fillRect(x, y, cell, cell/2); ctx.fillStyle = doggyColor; ctx.fillRect(x, y + cell/2, cell, cell/2); ctx.globalAlpha = 1; }
      else if (mScore > 0) { ctx.globalAlpha = 0.4; ctx.fillStyle = masterColor; ctx.fillRect(x, y, cell, cell); ctx.globalAlpha = 1; }
      else if (dScore > 0) { ctx.globalAlpha = 0.4; ctx.fillStyle = doggyColor; ctx.fillRect(x, y, cell, cell); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = empty; ctx.fillRect(x, y, cell, cell); }
      x += cell + gap;
    }
    ctx.fillStyle = muted; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💗 由「契约打卡」生成', W/2, H - 30);
    canvas.toBlob(blob => {
      if (!blob) return showToast('图片生成失败', 'late');
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `dawn-duo-${getLogicalDateStr()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast('图片导出成功 🖼️', 'success');
    }, 'image/png');
  } catch (e) { showToast('图片导出失败: ' + e.message, 'late'); }
};
window.importData = function(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.master || data.doggy) db = data;
      else if (data.db) db = data.db;
      else throw new Error('无效的数据格式');
      saveLocalData(); closeSettings(); showToast('数据导入成功！', 'success');
    } catch (err) { showToast('导入失败: ' + err.message, 'late'); }
  };
  reader.readAsText(file); event.target.value = '';
};
window.clearLocalData = function() {
  if (!confirm('⚠️ 确定要清除本机所有打卡记录吗？\n\n此操作不可逆！（云端数据不受影响，如需清空云端请手动上传）')) return;
  localStorage.removeItem('dawn-duo-data'); localStorage.removeItem('dawn-duo-notify-log');
  db = { master: {}, doggy: {} }; notifyLog = {};
  render(); showToast('本机数据已清空。', 'late'); closeSettings();
};