function getPureName(str) {
  return (str || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim();
}
function getLogicalDateStr(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() - offsetDays);
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
function getTimeInTZ(tzObj, options) {
  try {
    if (!tzObj || !tzObj.type) return '--:--:--';
    if (tzObj.type === 'offset') {
      const offset = parseFloat(tzObj.value) || 0;
      const targetUtcOffset = 8 + offset;
      const date = new Date(new Date().getTime() + targetUtcOffset * 3600000);
      return new Intl.DateTimeFormat('zh-CN', Object.assign({ timeZone: 'UTC' }, options)).format(date);
    } else {
      return new Intl.DateTimeFormat('zh-CN', Object.assign({ timeZone: tzObj.value || 'Asia/Shanghai' }, options)).format(new Date());
    }
  } catch (e) { return '--:--:--'; }
}
function getUTC_Offset(tzObj) {
  try {
    if (!tzObj || !tzObj.type) return 8;
    if (tzObj.type === 'offset') return 8 + (parseFloat(tzObj.value) || 0);
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tzObj.value || 'Asia/Shanghai' }));
    return (tzDate.getTime() - utcDate.getTime()) / 3600000;
  } catch(e) { return 8; }
}
function formatCheckinTime(tzObj) {
  return getTimeInTZ(tzObj, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}
function toMins(t) {
  if (typeof t !== 'string') return NaN;
  const parts = t.split(':');
  if (parts.length < 2) return NaN;
  const h = Number(parts[0]); const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}
function checkGoal(user, type, timeStr) {
  if (!timeStr) return false;
  const goalStr = (configs.goals?.[user]?.[type]) || (DEFAULT_CONFIGS.goals?.[user]?.[type]);
  const tMins = toMins(timeStr); const gMins = toMins(goalStr);
  if (!Number.isFinite(tMins) || !Number.isFinite(gMins)) return false;
  if (type === 'sleep') {
    let diff = tMins - gMins;
    if (diff > 720) diff -= 1440;
    if (diff < -720) diff += 1440;
    return diff <= 0;
  }
  return tMins <= gMins;
}
function getDeviceInfo() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Device';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown Device';
}
function getShichenInfo(hour) {
  let index = Math.floor((hour + 1) / 2) % 12;
  return SHICHEN_DATA[index];
}
function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve("Unknown");
    const timeout = setTimeout(() => resolve("Timeout"), 3000);
    navigator.geolocation.getCurrentPosition(
      pos => { clearTimeout(timeout); resolve(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`); },
      err => { clearTimeout(timeout); resolve("Denied/Error"); },
      { timeout: 3000, maximumAge: 60000 }
    );
  });
}
let toastTimer;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'show ' + type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500 + msg.length * 120);
}
function getHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}
function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = ''; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(binary);
}
function decodeBase64Utf8(b64) {
  const binary = atob(String(b64).replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}
window.handleShichenToggle = function() {
  if (!document.getElementById('cfg-show-shichen').checked) document.getElementById('cfg-show-wellness').checked = false;
};
window.handleWellnessToggle = function() {
  if (document.getElementById('cfg-show-wellness').checked) document.getElementById('cfg-show-shichen').checked = true;
};

// 计算字符串相似度 (Jaccard 相似度算法)
function getSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  const set1 = new Set(str1.replace(/\s+/g, '').split(''));
  const set2 = new Set(str2.replace(/\s+/g, '').split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}