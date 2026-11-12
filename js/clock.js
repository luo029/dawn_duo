let __clockRefs = null;
let __lastClockSlow = 0;
let __lastClockSig = '';
function getClockRefs() {
  if (__clockRefs && document.body.contains(__clockRefs.container)) return __clockRefs;
  const container = document.getElementById('clock-container');
  if (!container) return { container: null };
  __clockRefs = {
    container,
    cardMaster: document.getElementById('clock-card-master'),
    cardDoggy: document.getElementById('clock-card-doggy'),
    timeMaster: document.getElementById('time-master'),
    dateMaster: document.getElementById('date-master'),
    timeDoggy: document.getElementById('time-doggy'),
    dateDoggy: document.getElementById('date-doggy'),
    shichenMaster: document.getElementById('shichen-master'),
    shichenDoggy: document.getElementById('shichen-doggy'),
    wellnessPanel: document.getElementById('wellness-panel'),
    wellnessText: document.getElementById('wellness-text'),
    diffHours: document.getElementById('diff-hours'),
    daysTogether: document.getElementById('days-together'),
    logicalDateDisplay: document.getElementById('logical-date-display'),
    themeToggle: document.getElementById('theme-toggle')
  };
  return __clockRefs;
}
function updateClocks(force) {
  try {
    const refs = getClockRefs();
    if (!refs.container) return;
    const nowTs = Date.now();
    const sig = [configs.showMasterClock, configs.showDoggyClock, configs.clockLayout, configs.showSeconds, configs.showShichen, configs.showWellness].join('|');
    const sigChanged = sig !== __lastClockSig;
    if (sigChanged) __lastClockSig = sig;
    const doSlow = force === true || sigChanged || (nowTs - __lastClockSlow >= 30000);
    if (doSlow) __lastClockSlow = nowTs;
    const showM = !!configs.showMasterClock;
    const showD = !!configs.showDoggyClock;
    if (doSlow) {
      refs.container.className = 'grid-clocks';
      if (!showM && !showD) {
        refs.container.style.display = 'none';
      } else {
        refs.container.style.display = '';
        if (refs.cardMaster) refs.cardMaster.style.display = showM ? '' : 'none';
        if (refs.cardDoggy) refs.cardDoggy.style.display = showD ? '' : 'none';
        if (configs.clockLayout === 'merge') {
          refs.container.classList.add('merge-layout');
          if (showM && showD) {
            if (refs.cardMaster) { refs.cardMaster.style.borderRadius = ''; refs.cardMaster.style.borderRight = ''; }
            if (refs.cardDoggy) refs.cardDoggy.style.borderRadius = '';
          } else if (showM) {
            if (refs.cardMaster) { refs.cardMaster.style.borderRadius = '20px'; refs.cardMaster.style.borderRight = '1px solid var(--border)'; }
          } else if (showD) {
            if (refs.cardDoggy) { refs.cardDoggy.style.borderRadius = '20px'; }
          }
          refs.container.style.gridTemplateColumns = '';
        } else {
          refs.container.classList.remove('merge-layout');
          if (refs.cardMaster) { refs.cardMaster.style.borderRadius = ''; refs.cardMaster.style.borderRight = ''; }
          if (refs.cardDoggy) { refs.cardDoggy.style.borderRadius = ''; }
          refs.container.style.gridTemplateColumns = (!showM || !showD) ? '1fr' : '';
        }
      }
    }
    if (!configs.showSeconds && !doSlow) return;
    const timeOpts = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    if (configs.showSeconds) timeOpts.second = '2-digit';
    let infoM = null, infoD = null;
    if (showM) {
      const nowM = getTimeInTZ(configs.timeZones.master, timeOpts);
      if (refs.timeMaster) refs.timeMaster.textContent = nowM;
      if (doSlow) {
        if (refs.dateMaster) refs.dateMaster.textContent = getTimeInTZ(configs.timeZones.master, { month: 'long', day: 'numeric', weekday: 'short' });
        if (configs.showShichen) {
          const hM = parseInt(nowM.split(':')[0], 10);
          infoM = getShichenInfo(isNaN(hM) ? 0 : hM);
          if (refs.shichenMaster) { refs.shichenMaster.style.display = 'inline-block'; refs.shichenMaster.textContent = `${infoM.name} (${infoM.organ})`; }
        } else if (refs.shichenMaster) {
          refs.shichenMaster.style.display = 'none';
        }
      }
    }
    if (showD) {
      const nowD = getTimeInTZ(configs.timeZones.doggy, timeOpts);
      if (refs.timeDoggy) refs.timeDoggy.textContent = nowD;
      if (doSlow) {
        if (refs.dateDoggy) refs.dateDoggy.textContent = getTimeInTZ(configs.timeZones.doggy, { month: 'long', day: 'numeric', weekday: 'short' });
        if (configs.showShichen) {
          const hD = parseInt(nowD.split(':')[0], 10);
          infoD = getShichenInfo(isNaN(hD) ? 0 : hD);
          if (refs.shichenDoggy) { refs.shichenDoggy.style.display = 'inline-block'; refs.shichenDoggy.textContent = `${infoD.name} (${infoD.organ})`; }
        } else if (refs.shichenDoggy) {
          refs.shichenDoggy.style.display = 'none';
        }
      }
    }
    if (doSlow) {
      if (configs.showShichen && configs.showWellness && (infoM || infoD)) {
        let html = '';
        if (showM && infoM) html += `<div class="wellness-item"><span>🌿</span> <strong>${infoM.name}</strong> (${infoM.time}) · <strong>${infoM.organ}经</strong>当令 <span class="wellness-msg">${infoM.msg}</span></div>`;
        if (showD && infoD) html += `<div class="wellness-item is-doggy"><span>🍃</span> <strong>${infoD.name}</strong> (${infoD.time}) · <strong>${infoD.organ}经</strong>当令 <span class="wellness-msg">${infoD.msg}</span></div>`;
        if (refs.wellnessText) refs.wellnessText.innerHTML = html;
        if (refs.wellnessPanel) refs.wellnessPanel.style.display = 'flex';
      } else if (refs.wellnessPanel) {
        refs.wellnessPanel.style.display = 'none';
      }
      const offset1 = getUTC_Offset(configs.timeZones.master), offset2 = getUTC_Offset(configs.timeZones.doggy);
      let diffHours = Math.round(Math.abs(offset1 - offset2) * 10) / 10;
      if (diffHours % 1 === 0) diffHours = diffHours.toString();
      let daysTogether = 0;
      const annDate = new Date(configs.anniversary), currDate = new Date(getLogicalDateStr());
      const d = Math.ceil(Math.abs(currDate - annDate) / (1000 * 60 * 60 * 24));
      if (Number.isFinite(d)) daysTogether = d;
      if (refs.diffHours) refs.diffHours.textContent = diffHours;
      if (refs.daysTogether) refs.daysTogether.textContent = daysTogether;
      
      const currentLogicalDate = getLogicalDateStr();
      if (currentLogicalDate !== lastLogicalDate) { lastLogicalDate = currentLogicalDate; render(); }
      
      // 修复：读取绑定纪念日（契约日），而不是默认当前的逻辑日期
      if (refs.logicalDateDisplay) {
          let displayAnnDate = new Date(configs.anniversary || '2026-11-04');
          if (isNaN(displayAnnDate.getTime())) displayAnnDate = new Date(); // 容错
          refs.logicalDateDisplay.textContent = `契约日: ${displayAnnDate.getMonth()+1}月${displayAnnDate.getDate()}日`;
      }
      
      if (localStorage.getItem('dawn-duo-theme-locked') !== 'true') {
        try {
          const hourStr = getTimeInTZ(configs.timeZones.master, { hour: 'numeric', hourCycle: 'h23' });
          const hour = parseInt(hourStr, 10);
          if (!isNaN(hour)) {
            const targetTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
            if (document.documentElement.getAttribute('data-theme') !== targetTheme) {
              document.documentElement.setAttribute('data-theme', targetTheme);
              if (refs.themeToggle) refs.themeToggle.textContent = targetTheme === 'dark' ? '🌙' : '☀️';
            }
          }
        } catch (e) {}
      }
      checkNotifications();
    }
  } catch(e) { console.warn("时钟更新异常", e); }
}
window.toggleTheme = function() {
  const html = document.documentElement; const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next); localStorage.setItem('dawn-duo-theme', next); localStorage.setItem('dawn-duo-theme-locked', 'true');
  const btn = document.getElementById('theme-toggle'); if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
};