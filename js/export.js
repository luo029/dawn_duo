let currentExportType = 'image';

function getStatusLabel(ontime, isDoggy) {
    if (configs.mode === 'service' && isDoggy) return ontime ? '服从' : '抗命';
    return ontime ? '达标' : '迟到';
}

window.downloadJSON = function(type) {
    let data = {};
    let filename = '';
    if (type === 'records') {
        data = { master: db.master, doggy: db.doggy };
        filename = `dawn-duo-records-${getLogicalDateStr()}.json`;
    } else if (type === 'config') {
        data = configs;
        filename = `dawn-duo-config-${getLogicalDateStr()}.json`;
    } else {
        data = { records: db, config: configs };
        filename = `dawn-duo-backup-all-${getLogicalDateStr()}.json`;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr); 
    dlAnchorElem.setAttribute("download", filename);
    document.body.appendChild(dlAnchorElem); dlAnchorElem.click(); document.body.removeChild(dlAnchorElem);
    document.getElementById('export-json-modal').classList.remove('show');
    showToast('JSON 导出成功', 'success');
};

window.exportCSV = function() {
  let exportUsers = ['master', 'doggy'];
  let count = 0;
  for (const u of exportUsers) {
      if(!db[u]) continue;
      for(const d in db[u]) {
          if(db[u][d]?.sleep?.done) count++;
          if(db[u][d]?.wake?.done) count++;
      }
  }
  if (count === 0) return showToast('暂无打卡记录，无法导出', 'late');

  window.showCustomConfirm('📊 导出 CSV', `即将导出 <b>双方</b> 的 <b>${count}</b> 条打卡记录（可用 Excel 打开）。确定导出吗？`, () => {
    try {
      const rows = [['日期', '用户', '类型', '状态', '时间', '达标', '打卡时间戳', '时区', '设备', '位置', '睡眠时长(分钟)']];
      
      const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      
      const mName = getPureName(P().texts.masterName) || '先生';
      const dName = getPureName(P().texts.doggyName) || '小狗';

      for (const u of exportUsers) {
        if (!db[u]) continue;
        const isDoggy = u === 'doggy';
        const userName = isDoggy ? dName : mName;
        
        for (const d of Object.keys(db[u]).sort()) {
          for (const t of ['sleep', 'wake']) {
            const rec = db[u][d]?.[t];
            if (rec && rec.done) {
              if (t === 'sleep' && rec.records && rec.records.length > 0) {
                rec.records.forEach(r => {
                  rows.push([ `\t${d}`, userName, r.type === 'main' ? '睡眠' : '小睡', getStatusLabel(r.ontime, isDoggy), r.time || '', r.ontime ? '是' : '否', formatTime(r.timestamp || r.meta?.timestamp), r.meta?.timezone || '', r.meta?.device || '', r.meta?.location || '', '' ]);
                });
              } else {
                rows.push([ `\t${d}`, userName, t === 'sleep' ? '睡眠' : '起床', getStatusLabel(rec.ontime, isDoggy), rec.time || '', rec.ontime ? '是' : '否', formatTime(rec.meta?.timestamp || rec.timestamp), rec.meta?.timezone || '', rec.meta?.device || '', rec.meta?.location || '', rec.meta?.sleepDuration ? Math.floor(rec.meta.sleepDuration / 60) : '' ]);
              }
            }
          }
        }
      }
      
      const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `dawn-duo-records-all-${getLogicalDateStr()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast('CSV 导出成功 📊', 'success');
    } catch (e) { showToast('CSV 导出失败: ' + e.message, 'late'); }
  });
};

window.openExportOptions = function(type) {
    currentExportType = type;
    const mName = getPureName(P().texts.masterName) || '主人';
    const dName = getPureName(P().texts.doggyName) || '小狗';
    
    document.getElementById('export-opt-title').textContent = type === 'image' ? '🖼️ 导出图片设置' : '🖨️ 打印/PDF设置';
    document.getElementById('export-opt-master').textContent = mName;
    document.getElementById('export-opt-doggy').textContent = dName;
    
    const userSelect = document.getElementById('export-opt-user');
    if (userSelect) {
        userSelect.value = identity === 'doggy' ? 'doggy' : (identity === 'master' ? 'master' : 'both');
        if (window.refreshCustomSelects) window.refreshCustomSelects();
    }
    
    document.getElementById('export-options-modal').classList.add('show');
};

window.confirmExportOptions = function() {
    const user = document.getElementById('export-opt-user').value;
    const days = document.getElementById('export-opt-days').value;
    document.getElementById('export-options-modal').classList.remove('show');
    
    if (currentExportType === 'image') {
        generateExportImage(user, days);
    } else {
        generateExportPDF(user, days);
    }
};

function getExportDates(daysStr) {
    let dates = [];
    if (daysStr === 'all') {
        const allD = new Set([...Object.keys(db.master || {}), ...Object.keys(db.doggy || {})]);
        dates = Array.from(allD).sort((a,b) => b.localeCompare(a)); 
    } else {
        const num = parseInt(daysStr, 10);
        for(let i=0; i<num; i++) {
            dates.push(getLogicalDateStr(i));
        }
    }
    return dates;
}

window.generateExportImage = function(user, days) {
  try {
    const scale = 2; 
    const W = 650;
    const dates = getExportDates(days);
    if(dates.length === 0) return showToast('暂无打卡记录', 'late');
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const isService = configs.mode === 'service';
    
    const bg = isDark ? '#120f17' : '#F8FAFC';
    const cardBg = isDark ? '#1c1825' : '#FFFFFF';
    const text = isDark ? '#f3eef6' : '#1e293b';
    const muted = isDark ? '#9c8fa6' : '#64748B';
    const masterColor = P().colors?.master || '#38bdf8'; 
    const doggyColor = P().colors?.doggy || '#f472b6';

    const mName = getPureName(P().texts?.masterName) || '先生';
    const dName = getPureName(P().texts?.doggyName) || '宝宝';
    
    const isBoth = user === 'both';
    const cardH = isBoth ? 170 : 120;
    const gap = 16;
    const headerH = 100;
    const footerH = 80;
    
    const H = headerH + dates.length * (cardH + gap) + footerH;
    
    const canvas = document.createElement('canvas'); 
    canvas.width = W * scale; canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    
    ctx.fillStyle = bg; 
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 0); ctx.fill();

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, masterColor); grad.addColorStop(1, doggyColor);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(0, 0, W, 8, [0, 0, 4, 4]); ctx.fill();

    ctx.fillStyle = text; 
    ctx.font = '900 24px "PingFang SC", "Microsoft YaHei", sans-serif'; 
    ctx.textAlign = 'center';
    ctx.fillText(P().texts?.title || '契约打卡报告', W/2, 50);
    
    ctx.font = '14px "PingFang SC", sans-serif'; 
    ctx.fillStyle = muted; 
    ctx.fillText(`日期范围：${dates[dates.length-1]} 至 ${dates[0]}`, W/2, 75);

    let currentY = 100;

    dates.forEach((ds) => {
        const mRec = db.master?.[ds] || {};
        const dRec = db.doggy?.[ds] || {};
        const mSleep = mRec.sleep || {}, mWake = mRec.wake || {};
        const dSleep = dRec.sleep || {}, dWake = dRec.wake || {};
        
        ctx.shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.04)';
        ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
        ctx.fillStyle = cardBg;
        ctx.beginPath(); ctx.roundRect(30, currentY, W - 60, cardH, 16); ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = muted;
        ctx.font = 'bold 14px "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ds, 50, currentY + 30);
        
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        ctx.beginPath(); ctx.moveTo(50, currentY + 42); ctx.lineTo(W - 50, currentY + 42); ctx.stroke();

        const drawUserRow = (u, name, sleep, wake, y, color) => {
            const isDoggy = u === 'doggy';
            ctx.fillStyle = color;
            ctx.font = 'bold 15px "PingFang SC", sans-serif';
            ctx.fillText(`${u === 'master' ? '👑' : (isService ? '⛓️' : '🎀')} ${name}`, 50, y);
            
            ctx.fillStyle = muted; ctx.font = '12px "PingFang SC", sans-serif';
            ctx.fillText('🌙 睡眠', 160, y);
            ctx.fillStyle = sleep?.done ? text : muted;
            ctx.font = 'bold 18px "DIN Alternate", "PingFang SC", sans-serif';
            ctx.fillText(sleep?.done ? sleep.time : '--:--', 220, y);
            
            if (sleep?.done) {
                ctx.fillStyle = sleep.ontime ? '#10b981' : '#ef4444';
                ctx.font = 'bold 11px "PingFang SC", sans-serif';
                ctx.fillText(getStatusLabel(sleep.ontime, isDoggy), 275, y);
            }

            ctx.fillStyle = muted; ctx.font = '12px "PingFang SC", sans-serif';
            ctx.fillText('☀️ 起床', 350, y);
            ctx.fillStyle = wake?.done ? text : muted;
            ctx.font = 'bold 18px "DIN Alternate", "PingFang SC", sans-serif';
            ctx.fillText(wake?.done ? wake.time : '--:--', 410, y);
            
            if (wake?.done) {
                ctx.fillStyle = wake.ontime ? '#10b981' : '#ef4444';
                ctx.font = 'bold 11px "PingFang SC", sans-serif';
                ctx.fillText(getStatusLabel(wake.ontime, isDoggy), 465, y);
            }
        };

        if (isBoth) {
            drawUserRow('master', mName, mSleep, mWake, currentY + 75, masterColor);
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
            ctx.beginPath(); ctx.moveTo(50, currentY + 95); ctx.lineTo(W - 50, currentY + 95); ctx.stroke();
            drawUserRow('doggy', dName, dSleep, dWake, currentY + 130, doggyColor);
        } else if (user === 'master') {
            drawUserRow('master', mName, mSleep, mWake, currentY + 85, masterColor);
        } else {
            drawUserRow('doggy', dName, dSleep, dWake, currentY + 85, doggyColor);
        }

        currentY += cardH + gap;
    });

    ctx.fillStyle = muted; 
    ctx.font = '13px "PingFang SC", sans-serif'; 
    ctx.textAlign = 'center';
    ctx.fillText('💗 由「契约」生成 · 记录我们的每一天', W/2, H - 30);

    canvas.toBlob(blob => {
      if (!blob) return showToast('图片生成失败', 'late');
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `契约打卡记录-${user}-${getLogicalDateStr()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast('分享图已保存 🖼️', 'success');
    }, 'image/png');
  } catch (e) { showToast('图片生成失败: ' + e.message, 'late'); console.error(e); }
};

window.generateExportPDF = function(user, days) {
    const dates = getExportDates(days);
    if(dates.length === 0) return showToast('暂无打卡记录', 'late');
    
    const mName = getPureName(P().texts?.masterName) || '先生';
    const dName = getPureName(P().texts?.doggyName) || '宝宝';
    
    let simpleRows = '';
    dates.forEach(ds => {
        const mRec = db.master?.[ds] || {};
        const dRec = db.doggy?.[ds] || {};
        
        const makeCells = (sleep, wake, isDoggy) => {
            const sc = sleep?.ontime ? '#10b981' : '#ef4444';
            const wc = wake?.ontime ? '#10b981' : '#ef4444';
            return `<td>${sleep?.done ? sleep.time : '--:--'}</td><td style="color:${sleep?.done?sc:'#999'}">${sleep?.done?getStatusLabel(sleep.ontime, isDoggy):'-'}</td>
                    <td>${wake?.done ? wake.time : '--:--'}</td><td style="color:${wake?.done?wc:'#999'}">${wake?.done?getStatusLabel(wake.ontime, isDoggy):'-'}</td>`;
        };

        if (user === 'master' || user === 'both') {
            simpleRows += `<tr><td style="font-weight:bold; background:#f8fafc;">${ds}</td><td style="color:#0284c7; font-weight:bold;">${mName}</td>${makeCells(mRec.sleep, mRec.wake, false)}</tr>`;
        }
        if (user === 'doggy' || user === 'both') {
            const dateTd = user === 'both' ? '' : `<td style="font-weight:bold; background:#f8fafc;">${ds}</td>`;
            simpleRows += `<tr>${dateTd}<td style="color:#ec4899; font-weight:bold;">${dName}</td>${makeCells(dRec.sleep, dRec.wake, true)}</tr>`;
        }
    });

    const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><title>契约打卡记录</title>
    <style>
        body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; color: #111; margin-bottom: 5px; font-size: 24px; }
        .sub { text-align: center; color: #666; font-size: 12px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: center; }
        th, td { border: 1px solid #e5e7eb; padding: 12px 8px; }
        th { background: #f3f4f6; color: #4b5563; font-weight: bold; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
        @media print { body { padding: 0; } }
    </style></head><body>
        <h1>${P().texts?.title || '契约打卡记录'}</h1>
        <div class="sub">导出日期：${getLogicalDateStr()} | 范围：${dates[dates.length-1]} 至 ${dates[0]}</div>
        <table>
            <thead><tr><th>日期</th><th>对象</th><th>休息时间</th><th>休息状态</th><th>起床时间</th><th>起床状态</th></tr></thead>
            <tbody>${simpleRows}</tbody>
        </table>
        <div class="footer">💗 由「契约」生成 · 记录我们的每一天</div>
    </body></html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
};

window.importData = function(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.master || data.doggy) {
        if (data.master) db.master = Object.assign(db.master, data.master);
        if (data.doggy) db.doggy = Object.assign(db.doggy, data.doggy);
      } else if (data.records) {
        if (data.records.master) db.master = Object.assign(db.master, data.records.master);
        if (data.records.doggy) db.doggy = Object.assign(db.doggy, data.records.doggy);
      } else if (data.db) {
        db = data.db;
      } else throw new Error('无效的数据格式');
      
      if (data.config) {
          configs = deepMerge(DEFAULT_CONFIGS, data.config);
          localStorage.setItem('dawn-duo-configs', JSON.stringify(configs));
          applyConfigsToPage(); updateClocks();
      }
      
      saveLocalData(); closeSettings(); showToast('数据导入成功！', 'success');
    } catch (err) { showToast('导入失败: ' + err.message, 'late'); }
  };
  reader.readAsText(file); event.target.value = '';
};

window.clearLocalData = function() {
  window.showCustomConfirm('⚠️ 清空记录', '确定要清除本机所有打卡记录吗？<br>此操作不可逆！（云端数据不受影响）', () => {
    localStorage.removeItem('dawn-duo-data'); localStorage.removeItem('dawn-duo-notify-log');
    db = { master: {}, doggy: {} }; notifyLog = {};
    render(); showToast('本机数据已清空。', 'late'); closeSettings();
  });
};