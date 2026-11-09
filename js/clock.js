function updateClocks() {
  try {
    const container = document.getElementById('clock-container');
    const cardMaster = document.getElementById('clock-card-master');
    const cardDoggy = document.getElementById('clock-card-doggy');
    if(!container) return;
    container.className = 'grid-clocks'; 
    
    const showM = configs.showMasterClock;
    const showD = configs.showDoggyClock;
    
    if (!showM && !showD) { container.style.display = 'none'; } 
    else {
      container.style.display = '';
      cardMaster.style.display = showM ? '' : 'none';
      cardDoggy.style.display = showD ? '' : 'none';
      
      if (configs.clockLayout === 'merge') {
        container.classList.add('merge-layout');
        if (showM && showD) { cardMaster.style.borderRadius = ''; cardMaster.style.borderRight = ''; cardDoggy.style.borderRadius = ''; }
        else if (showM) { cardMaster.style.borderRadius = '20px'; cardMaster.style.borderRight = '1px solid var(--border)'; }
        else if (showD) { cardDoggy.style.borderRadius = '20px'; }
        container.style.gridTemplateColumns = '';
      } else {
        container.classList.remove('merge-layout');
        cardMaster.style.borderRadius = ''; cardMaster.style.borderRight = ''; cardDoggy.style.borderRadius = '';
        container.style.gridTemplateColumns = (!showM || !showD) ? '1fr' : '';
      }
    }

    const timeOpts = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    if (configs.showSeconds) timeOpts.second = '2-digit';
    let infoM = null, infoD = null;
    
    if (showM) {
      const nowM = getTimeInTZ(configs.timeZones.master, timeOpts);
      document.getElementById('time-master').textContent = nowM;
      document.getElementById('date-master').textContent = getTimeInTZ(configs.timeZones.master, { month: 'long', day: 'numeric', weekday: 'short' });
      if (configs.showShichen) {
        const hM = parseInt(nowM.split(':')[0], 10);
        infoM = getShichenInfo(isNaN(hM) ? 0 : hM);
        const sM = document.getElementById('shichen-master');
        sM.style.display = 'inline-block'; sM.textContent = `${infoM.name} (${infoM.organ})`;
      } else document.getElementById('shichen-master').style.display = 'none';
    }

    if (showD) {
      const nowD = getTimeInTZ(configs.timeZones.doggy, timeOpts);
      document.getElementById('time-doggy').textContent = nowD;
      document.getElementById('date-doggy').textContent = getTimeInTZ(configs.timeZones.doggy, { month: 'long', day: 'numeric', weekday: 'short' });
      if (configs.showShichen) {
        const hD = parseInt(nowD.split(':')[0], 10);
        infoD = getShichenInfo(isNaN(hD) ? 0 : hD);
        const sD = document.getElementById('shichen-doggy');
        sD.style.display = 'inline-block'; sD.textContent = `${infoD.name} (${infoD.organ})`;
      } else document.getElementById('shichen-doggy').style.display = 'none';
    }

    const wellnessPanel = document.getElementById('wellness-panel');
    const wellnessText = document.getElementById('wellness-text');
    
    if (configs.showShichen && configs.showWellness && (infoM || infoD)) {
      let html = '';
      if (showM && infoM) html += `<div class="wellness-item"><span>🌿</span> <strong>${infoM.name}</strong> (${infoM.time}) · <strong>${infoM.organ}经</strong>当令 <span class="wellness-msg">${infoM.msg}</span></div>`;
      if (showD && infoD) html += `<div class="wellness-item is-doggy"><span>🍃</span> <strong>${infoD.name}</strong> (${infoD.time}) · <strong>${infoD.organ}经</strong>当令 <span class="wellness-msg">${infoD.msg}</span></div>`;
      wellnessText.innerHTML = html; wellnessPanel.style.display = 'flex';
    } else wellnessPanel.style.display = 'none';

    const offset1 = getUTC_Offset(configs.timeZones.master);
    const offset2 = getUTC_Offset(configs.timeZones.doggy);
    let diffHours = Math.round(Math.abs(offset1 - offset2) * 10) / 10;
    if (diffHours % 1 === 0) diffHours = diffHours.toString();

    let daysTogether = 0;
    const annDate = new Date(configs.anniversary);
    const currDate = new Date(getLogicalDateStr());
    const d = Math.ceil(Math.abs(currDate - annDate) / (1000 * 60 * 60 * 24));
    if (Number.isFinite(d)) daysTogether = d;

    const diffHoursEl = document.getElementById('diff-hours');
    const daysTogetherEl = document.getElementById('days-together');
    if (diffHoursEl) diffHoursEl.textContent = diffHours;
    if (daysTogetherEl) daysTogetherEl.textContent = daysTogether;

    const currentLogicalDate = getLogicalDateStr();
    if (currentLogicalDate !== lastLogicalDate) { lastLogicalDate = currentLogicalDate; render(); }

    const dateObj = new Date(lastLogicalDate);
    if (!isNaN(dateObj.getTime())) document.getElementById('logical-date-display').textContent = `契约日: ${dateObj.getMonth()+1}月${dateObj.getDate()}日`;
    
    if (localStorage.getItem('dawn-duo-theme-locked') !== 'true') {
      try {
        const hourStr = getTimeInTZ(configs.timeZones.master, { hour: 'numeric', hourCycle: 'h23' });
        const hour = parseInt(hourStr, 10);
        if (!isNaN(hour)) {
          const targetTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
          if (document.documentElement.getAttribute('data-theme') !== targetTheme) {
            document.documentElement.setAttribute('data-theme', targetTheme);
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.textContent = targetTheme === 'dark' ? '🌙' : '☀️';
          }
        }
      } catch (e) {}
    }
    checkNotifications();
  } catch(e) { console.warn("时钟更新异常", e); }
}

window.toggleTheme = function() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('dawn-duo-theme', next);
  localStorage.setItem('dawn-duo-theme-locked', 'true');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
};