const fs = require('fs');
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:example@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const SUBS_FILE = 'subscriptions.json';
const CONFIG_FILE = 'config.json';
const LOG_FILE = 'push_log.json';
const TEST_MODE = process.env.TEST_MODE === 'true';
const TRIGGER_FROM = process.env.TRIGGER_FROM || '';

function getTimeInTZ(tzObj) {
  if (!tzObj || !tzObj.type) return new Date();
  if (tzObj.type === 'offset') {
    const offset = parseFloat(tzObj.value) || 0;
    return new Date(Date.now() + (offset + 8) * 3600000);
  } else {
    try {
      const now = new Date();
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tzObj.value || 'Asia/Shanghai' }));
      const offset = (tzDate.getTime() - utcDate.getTime()) / 3600000;
      return new Date(Date.now() + offset * 3600000);
    } catch (e) { return new Date(); }
  }
}
function getDateStr(tzObj) {
  return new Date().toLocaleDateString('en-CA', { timeZone: tzObj.value || 'Asia/Shanghai' });
}
function getMins(date) { return date.getHours() * 60 + date.getMinutes(); }
function toMins(t) { if (typeof t !== 'string') return NaN; const p = t.split(':'); if (p.length < 2) return NaN; const h = Number(p[0]), m = Number(p[1]); return (Number.isFinite(h) && Number.isFinite(m)) ? h * 60 + m : NaN; }
function checkPushText(notifyTexts, key, replacements) {
  const item = notifyTexts[key];
  if (!item) return null;
  if (item.channel && item.channel !== 'both' && item.channel !== 'push') return null;
  const texts = item.texts || [];
  if (texts.length === 0) return null;
  let text = texts[Math.floor(Math.random() * texts.length)];
  for (const [k, v] of Object.entries(replacements)) text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  return text;
}

(async () => {
  if (!fs.existsSync(SUBS_FILE)) return console.log('No subscriptions file found.');
  let subscriptions = [];
  try { subscriptions = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8')); } catch (e) { return console.error('Failed to parse subscriptions.json:', e.message); }
  if (!subscriptions.length) return console.log('No subscriptions to notify.');

  let configs = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try { configs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch (e) { console.warn('Failed to parse config.json:', e.message); }
  }

  if (configs.notifySettings && configs.notifySettings.global_testing && !TEST_MODE) {
      return console.log('全段测试模式已开启，拒绝发送任何真实推送。');
  }

  let remoteDb = { master: {}, doggy: {} };
  try {
    if (fs.existsSync('master_records.json')) remoteDb.master = JSON.parse(fs.readFileSync('master_records.json', 'utf8'));
    if (fs.existsSync('doggy_records.json')) remoteDb.doggy = JSON.parse(fs.readFileSync('doggy_records.json', 'utf8'));
  } catch (e) { console.warn('Failed to read records:', e.message); }

  let pushLog = {};
  if (fs.existsSync(LOG_FILE)) { try { pushLog = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch (e) {} }

  const mode = configs.mode || 'service';
  const prof = (configs.profiles && configs.profiles[mode]) || {};
  const notifyTexts = prof.notifyTexts || {};
  const texts = prof.texts || {};
  const goals = configs.goals || { master: { sleep: '23:00', wake: '07:00' }, doggy: { sleep: '22:30', wake: '07:30' } };
  const timeZones = configs.timeZones || { master: { type: 'iana', value: 'Asia/Shanghai' }, doggy: { type: 'iana', value: 'America/New_York' } };
  const notifySettings = configs.notifySettings || {};
  const notifyItems = notifySettings.items || {};
  
  const windowEnabled = notifySettings.overtime_window_enabled !== false;
  const sleepStart = toMins(notifySettings.overtime_sleep_start || '21:00');
  const sleepEnd = toMins(notifySettings.overtime_sleep_end || '05:00');
  const wakeStart = toMins(notifySettings.overtime_wake_start || '05:00');
  const wakeEnd = toMins(notifySettings.overtime_wake_end || '12:00');
  const maxTimes = notifySettings.overtime_max_times !== undefined ? notifySettings.overtime_max_times : 3;

  const isService = mode === 'service';
  const mName = (texts.masterName || (isService ? '主人' : '先生')).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim();
  const dName = (texts.doggyName || (isService ? '小狗' : '宝宝')).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim();

  const failedEndpoints = [];
  let logUpdated = false;

  const isInWindow = (currentMins, start, end) => { if (!windowEnabled) return true; if (start > end) { return currentMins >= start || currentMins < end; } else { return currentMins >= start && currentMins < end; } };

  for (const sub of subscriptions) {
    // 新增：如果设备被屏蔽，直接跳过
    if (sub.blocked === true) {
        console.log(`[跳过] 设备已屏蔽: ${sub.endpoint.slice(0, 30)}...`);
        continue;
    }

    let title = '', body = '', icon = '/icon-512.png';
    let id = sub.identity || 'both';
    try { id = decodeURIComponent(id); } catch(e) {}
    
    const checkMaster = (id === 'master' || id.includes(mName) || id === '主人');
    const checkDoggy = (id === 'doggy' || id.includes(dName) || id === '小狗');
    const checkBoth = (id === 'both' || id === '联合身份');

    const sendMaster = checkMaster || checkBoth;
    const sendDoggy = checkDoggy || checkBoth;

    const mDateStr = getDateStr(timeZones.master);
    const dDateStr = getDateStr(timeZones.doggy);
    const mMins = getMins(getTimeInTZ(timeZones.master));
    const dMins = getMins(getTimeInTZ(timeZones.doggy));
    
    const mSleepGoal = toMins(goals.master?.sleep || '23:00');
    const mWakeGoal = toMins(goals.master?.wake || '07:00');
    const dSleepGoal = toMins(goals.doggy?.sleep || '22:30');
    const dWakeGoal = toMins(goals.doggy?.wake || '07:30');

    let textKey = '', replacements = {}, sendType = '', targetDate = '', targetUser = '';

    if (TRIGGER_FROM === 'partner') {
      if (sendMaster) {
        if (remoteDb.doggy[dDateStr]?.wake?.done) { textKey = 'partner_doggy_wake'; sendType = 'wake'; }
        else if (remoteDb.doggy[dDateStr]?.sleep?.done) { textKey = 'partner_doggy_sleep'; sendType = 'sleep'; }
        else continue;
        replacements = { name: dName, time: remoteDb.doggy[dDateStr]?.[sendType]?.time || '' };
        if (notifyItems[textKey] === false) continue;
        body = checkPushText(notifyTexts, textKey, replacements);
        title = '📡 对方动态';
      } else if (sendDoggy) {
        if (remoteDb.master[mDateStr]?.wake?.done) { textKey = 'partner_master_wake'; sendType = 'wake'; }
        else if (remoteDb.master[mDateStr]?.sleep?.done) { textKey = 'partner_master_sleep'; sendType = 'sleep'; }
        else continue;
        replacements = { name: mName, time: remoteDb.master[mDateStr]?.[sendType]?.time || '' };
        if (notifyItems[textKey] === false) continue;
        body = checkPushText(notifyTexts, textKey, replacements);
        title = '📡 对方动态';
      }
      
      if (body) {
         try {
            await webpush.sendNotification(sub, JSON.stringify({ title, body, icon }));
            console.log(`[伙伴打卡触发] Sent to ${sub.endpoint.slice(0, 50)}...`);
         } catch(err) {
            if (err.statusCode === 404 || err.statusCode === 410) failedEndpoints.push(sub.endpoint);
         }
      }
      continue;
    }

    if (sendMaster) {
      targetUser = 'master'; targetDate = mDateStr;
      if (Math.abs(mMins - mSleepGoal) < Math.abs(mMins - mWakeGoal)) { textKey = 'master_sleep'; sendType = 'sleep'; } else { textKey = 'master_wake'; sendType = 'wake'; }
      replacements = { name: mName };
      
      const isDone = sendType === 'sleep' ? remoteDb.master[mDateStr]?.sleep?.done : remoteDb.master[mDateStr]?.wake?.done;
      if (isDone && !TEST_MODE) { console.log(`[跳过] ${mName} 今日已打卡 ${sendType}`); continue; }

      if (sendType === 'sleep') {
        if (!isInWindow(mMins, sleepStart, sleepEnd) && !TEST_MODE) continue;
        let diff = mMins - mSleepGoal; if (diff > 720) diff -= 1440;
        if (diff < 30 && !TEST_MODE) continue; 
      } else {
        if (!isInWindow(mMins, wakeStart, wakeEnd) && !TEST_MODE) continue;
        if (mMins - mWakeGoal < 30 && !TEST_MODE) continue;
      }
    } else if (sendDoggy) {
      targetUser = 'doggy'; targetDate = dDateStr;
      if (Math.abs(dMins - dSleepGoal) < Math.abs(dMins - dWakeGoal)) { textKey = 'doggy_sleep'; sendType = 'sleep'; } else { textKey = 'doggy_wake'; sendType = 'wake'; }
      replacements = { name: dName };
      
      const isDone = sendType === 'sleep' ? remoteDb.doggy[dDateStr]?.sleep?.done : remoteDb.doggy[dDateStr]?.wake?.done;
      if (isDone && !TEST_MODE) { console.log(`[跳过] ${dName} 今日已打卡 ${sendType}`); continue; }

      if (sendType === 'sleep') {
        if (!isInWindow(dMins, sleepStart, sleepEnd) && !TEST_MODE) continue;
        let diff = dMins - dSleepGoal; if (diff > 720) diff -= 1440;
        if (diff < 30 && !TEST_MODE) continue; 
      } else {
        if (!isInWindow(dMins, wakeStart, wakeEnd) && !TEST_MODE) continue;
        if (dMins - dWakeGoal < 30 && !TEST_MODE) continue;
      }
    }

    if (notifyItems[textKey] === false && !TEST_MODE) continue;

    const isOvertime = !TEST_MODE && (
      (sendType === 'sleep' && (mMins - (targetUser === 'master' ? mSleepGoal : dSleepGoal) >= 30 || (mMins + 1440 - (targetUser === 'master' ? mSleepGoal : dSleepGoal)) % 1440 >= 30)) ||
      (sendType === 'wake' && mMins - (targetUser === 'master' ? mWakeGoal : dWakeGoal) >= 30)
    );

    if (isOvertime) {
      textKey = sendType === 'sleep' ? 'overtime_sleep' : 'overtime_wake';
      const goalMin = sendType === 'sleep' ? (targetUser === 'master' ? mSleepGoal : dSleepGoal) : (targetUser === 'master' ? mWakeGoal : dWakeGoal);
      const currentMin = targetUser === 'master' ? mMins : dMins;
      replacements.mins = (sendType === 'sleep' ? (currentMin - goalMin + 1440) % 1440 : currentMin - goalMin);

      if (maxTimes > 0) {
        const logKey = `${targetDate}_${targetUser}_${sendType}_overtime`;
        if ((pushLog[logKey] || 0) >= maxTimes) { console.log(`[跳过] ${replacements.name} 超时提醒已达最大次数`); continue; }
        pushLog[logKey] = (pushLog[logKey] || 0) + 1; logUpdated = true;
      }
    }

    body = checkPushText(notifyTexts, textKey, replacements);
    if (body) {
      const textObj = notifyTexts[textKey] || {};
      title = textObj.title || (sendType === 'sleep' ? '🌙 休息提醒' : '☀️ 起床提醒');
      if (textKey.startsWith('overtime') && !textObj.title) title = sendType === 'sleep' ? '⚠️ 熬夜警告' : '⚠️ 赖床警告';
      icon = textObj.icon || '/icon-512.png';
    }

    if (!body) continue;
    const payload = JSON.stringify({ title, body, icon });

    try {
      await webpush.sendNotification(sub, payload);
      console.log(`Sent to ${sub.endpoint.slice(0, 50)}... (Identity: ${id}) | Type: ${textKey}`);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) { failedEndpoints.push(sub.endpoint); } else { console.error(`Failed:`, err.message); }
    }
  }

  if (failedEndpoints.length > 0) {
    const remaining = subscriptions.filter(s => !failedEndpoints.includes(s.endpoint));
    fs.writeFileSync(SUBS_FILE, JSON.stringify(remaining, null, 2));
    console.log(`Removed ${failedEndpoints.length} expired subscription(s).`);
  }
  if (logUpdated) {
    fs.writeFileSync(LOG_FILE, JSON.stringify(pushLog, null, 2));
  }
})();