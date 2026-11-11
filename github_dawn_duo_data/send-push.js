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
const CUSTOM_TITLE = process.env.CUSTOM_TITLE || '';
const CUSTOM_BODY = process.env.CUSTOM_BODY || '';
const TEST_TARGET = process.env.TEST_TARGET || 'all';
const TRIGGER_FROM = process.env.TRIGGER_FROM || '';

const SHICHEN = [
  {name:'子时', time:'23:00-01:00', organ:'胆'}, {name:'丑时', time:'01:00-03:00', organ:'肝'}, {name:'寅时', time:'03:00-05:00', organ:'肺'}, 
  {name:'卯时', time:'05:00-07:00', organ:'大肠'}, {name:'辰时', time:'07:00-09:00', organ:'胃'}, {name:'巳时', time:'09:00-11:00', organ:'脾'}, 
  {name:'午时', time:'11:00-13:00', organ:'心'}, {name:'未时', time:'13:00-15:00', organ:'小肠'}, {name:'申时', time:'15:00-17:00', organ:'膀胱'}, 
  {name:'酉时', time:'17:00-19:00', organ:'肾'}, {name:'戌时', time:'19:00-21:00', organ:'心包'}, {name:'亥时', time:'21:00-23:00', organ:'三焦'}
];
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getShichenInfo(hour) { let index = Math.floor((hour + 1) / 2) % 12; return SHICHEN[index]; }

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
function minsToTime(m) { if (!Number.isFinite(m)) return ''; const h = Math.floor(m / 60); const min = Math.floor(m % 60); return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`; }

function checkPushText(notifyTexts, key, replacements) {
  const item = notifyTexts[key];
  if (!item) return null;
  if (item.channel && item.channel !== 'both' && item.channel !== 'push') return null;
  const texts = item.texts || [];
  if (texts.length === 0) return null;
  let text = texts[Math.floor(Math.random() * texts.length)];
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v === undefined || v === null ? '' : v);
  }
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

  const isService = mode === 'service';
  const mName = (texts.masterName || (isService ? '主人' : '先生')).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim();
  const dName = (texts.doggyName || (isService ? '小狗' : '宝宝')).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim();

  const failedEndpoints = [];
  let logUpdated = false;

  for (const sub of subscriptions) {
    if (sub.blocked === true) continue;
    if (TEST_MODE && TEST_TARGET !== 'all' && !sub.endpoint.endsWith(TEST_TARGET)) continue;

    let title = '', body = '', icon = '/icon-512.png';
    let id = sub.identity || 'both';
    try { id = decodeURIComponent(id); } catch(e) {}
    
    const checkMaster = (id === 'master' || id.includes(mName) || id === '主人');
    const checkDoggy = (id === 'doggy' || id.includes(dName) || id === '小狗');
    const checkBoth = (id === 'both' || id === '联合身份');

    const sendMaster = checkMaster || checkBoth;
    const sendDoggy = checkDoggy || checkBoth;

    if (TEST_MODE && CUSTOM_TITLE && CUSTOM_BODY) {
        try {
            await webpush.sendNotification(sub, JSON.stringify({ title: CUSTOM_TITLE, body: CUSTOM_BODY, icon }));
            console.log(`[测试模式] 发送自定义通知: ${CUSTOM_TITLE}`);
        } catch(err) {
            if (err.statusCode === 404 || err.statusCode === 410) failedEndpoints.push(sub.endpoint);
        }
        continue; 
    }

    const mNow = getTimeInTZ(timeZones.master);
    const dNow = getTimeInTZ(timeZones.doggy);
    const mDateStr = getDateStr(timeZones.master);
    const dDateStr = getDateStr(timeZones.doggy);
    const mMins = getMins(mNow);
    const dMins = getMins(dNow);
    
    const mSleepGoal = toMins(goals.master?.sleep || '23:00');
    const mWakeGoal = toMins(goals.master?.wake || '07:00');
    const dSleepGoal = toMins(goals.doggy?.sleep || '22:30');
    const dWakeGoal = toMins(goals.doggy?.wake || '07:30');

    let targetUser = '', textKey = '', replacements = {}, sendType = '';

    if (TRIGGER_FROM === 'partner') {
      if (sendMaster) {
        if (remoteDb.doggy[dDateStr]?.wake?.done) { textKey = 'partner_doggy_wake'; sendType = 'wake'; }
        else if (remoteDb.doggy[dDateStr]?.sleep?.done) { textKey = 'partner_doggy_sleep'; sendType = 'sleep'; }
        else continue;
        const rTime = remoteDb.doggy[dDateStr]?.[sendType]?.time || '';
        replacements = { name: dName, time: rTime, time_s: rTime, shichen: '', shichen_organ: '', shichen_time: '', weekday: '', date: '', duration: '', mins: '' };
        if (notifyItems[textKey] === false) continue;
        body = checkPushText(notifyTexts, textKey, replacements);
        title = '📡 对方动态';
      } else if (sendDoggy) {
        if (remoteDb.master[mDateStr]?.wake?.done) { textKey = 'partner_master_wake'; sendType = 'wake'; }
        else if (remoteDb.master[mDateStr]?.sleep?.done) { textKey = 'partner_master_sleep'; sendType = 'sleep'; }
        else continue;
        const rTime = remoteDb.master[mDateStr]?.[sendType]?.time || '';
        replacements = { name: mName, time: rTime, time_s: rTime, shichen: '', shichen_organ: '', shichen_time: '', weekday: '', date: '', duration: '', mins: '' };
        if (notifyItems[textKey] === false) continue;
        body = checkPushText(notifyTexts, textKey, replacements);
        title = '📡 对方动态';
      }
      
      if (body) {
         try {
            await webpush.sendNotification(sub, JSON.stringify({ title, body, icon }));
         } catch(err) {
            if (err.statusCode === 404 || err.statusCode === 410) failedEndpoints.push(sub.endpoint);
         }
      }
      continue;
    }

    if (sendMaster) {
      targetUser = 'master';
      if (Math.abs(mMins - mSleepGoal) < Math.abs(mMins - mWakeGoal)) { sendType = 'sleep'; } else { sendType = 'wake'; }
    } else if (sendDoggy) {
      targetUser = 'doggy';
      if (Math.abs(dMins - dSleepGoal) < Math.abs(dMins - dWakeGoal)) { sendType = 'sleep'; } else { sendType = 'wake'; }
    } else { continue; }

    const isMaster = targetUser === 'master';
    const currentMins = isMaster ? mMins : dMins;
    const sleepGoal = isMaster ? mSleepGoal : dSleepGoal;
    const wakeGoal = isMaster ? mWakeGoal : dWakeGoal;
    const goalMin = sendType === 'sleep' ? sleepGoal : wakeGoal;
    
    let diff = currentMins - goalMin;
    if (sendType === 'sleep') { if (diff > 720) diff -= 1440; if (diff < -720) diff += 1440; }

    const isDone = sendType === 'sleep' ? (isMaster ? remoteDb.master[mDateStr]?.sleep?.done : remoteDb.doggy[dDateStr]?.sleep?.done) : (isMaster ? remoteDb.master[mDateStr]?.wake?.done : remoteDb.doggy[dDateStr]?.wake?.done);
    if (isDone && !TEST_MODE) continue;

    const beforeMins = isMaster ? (notifySettings.master_on_time_before !== undefined ? notifySettings.master_on_time_before : 15) : (notifySettings.doggy_on_time_before !== undefined ? notifySettings.doggy_on_time_before : 15);
    const afterMins = isMaster ? (notifySettings.master_on_time_after !== undefined ? notifySettings.master_on_time_after : 15) : (notifySettings.doggy_on_time_after !== undefined ? notifySettings.doggy_on_time_after : 15);

    const targetNow = isMaster ? mNow : dNow;
    const shichenInfo = getShichenInfo(targetNow.getHours());
    let commonReplacements = { 
        name: isMaster ? mName : dName, 
        time: minsToTime(currentMins), 
        time_s: `${minsToTime(currentMins)}:${String(targetNow.getSeconds()).padStart(2,'0')}`, 
        shichen: shichenInfo.name, 
        shichen_organ: shichenInfo.organ, 
        shichen_time: shichenInfo.time, 
        weekday: WEEKDAYS[targetNow.getDay()], 
        date: `${targetNow.getMonth()+1}月${targetNow.getDate()}日`, 
        duration: '', 
        mins: '' 
    };

    let targetWindowEnabled = isMaster ? (notifySettings.master_window_enabled !== false) : (notifySettings.doggy_window_enabled !== false);
    let tSleepStart = toMins(isMaster ? (notifySettings.master_sleep_start || '21:00') : (notifySettings.doggy_sleep_start || '21:00'));
    let tSleepEnd = toMins(isMaster ? (notifySettings.master_sleep_end || '05:00') : (notifySettings.doggy_sleep_end || '05:00'));
    let tWakeStart = toMins(isMaster ? (notifySettings.master_wake_start || '05:00') : (notifySettings.doggy_wake_start || '05:00'));
    let tWakeEnd = toMins(isMaster ? (notifySettings.master_wake_end || '12:00') : (notifySettings.doggy_wake_end || '12:00'));
    let tMaxTimes = isMaster ? (notifySettings.master_max_times !== undefined ? notifySettings.master_max_times : 3) : (notifySettings.doggy_max_times !== undefined ? notifySettings.doggy_max_times : 3);

    let inWindow = true;
    if (targetWindowEnabled) {
        const start = sendType === 'sleep' ? tSleepStart : tWakeStart;
        const end = sendType === 'sleep' ? tSleepEnd : tWakeEnd;
        if (start > end) inWindow = currentMins >= start || currentMins < end;
        else inWindow = currentMins >= start && currentMins < end;
    }

    if (diff >= -beforeMins && diff <= afterMins) {
        if (notifyItems[`${targetUser}_${sendType}`] === false && !TEST_MODE) continue;
        if (!inWindow && !TEST_MODE) continue;
        textKey = `${targetUser}_${sendType}`;
        replacements = commonReplacements;
    } else if (diff > afterMins) {
        if (notifyItems[`${targetUser}_${sendType}_overtime`] === false && !TEST_MODE) continue;
        if (!inWindow && !TEST_MODE) continue;
        
        if (tMaxTimes > 0 && !TEST_MODE) {
            const logKey = `${isMaster ? mDateStr : dDateStr}_${targetUser}_${sendType}_overtime`;
            if ((pushLog[logKey] || 0) >= tMaxTimes) continue;
            pushLog[logKey] = (pushLog[logKey] || 0) + 1; logUpdated = true;
        }
        
        textKey = `${targetUser}_${sendType}_overtime`;
        const oh = Math.floor(diff / 60);
        const om = diff % 60;
        let durStr = '';
        if (oh > 0 && om > 0) durStr = `${oh} h ${om} m`;
        else if (oh > 0) durStr = `${oh} h`;
        else durStr = `${om} m`;
        
        replacements = Object.assign({}, commonReplacements, { duration: durStr, mins: diff });
    } else {
        continue;
    }

    body = checkPushText(notifyTexts, textKey, replacements);
    if (body) {
      const textObj = notifyTexts[textKey] || {};
      title = textObj.title || (sendType === 'sleep' ? '🌙 休息提醒' : '☀️ 起床提醒');
      if (textKey.includes('overtime') && !textObj.title) title = sendType === 'sleep' ? '⚠️ 熬夜警告' : '⚠️ 赖床警告';
      icon = textObj.icon || '/icon-512.png';
    }

    if (!body) continue;
    const payload = JSON.stringify({ title, body, icon });

    try {
      await webpush.sendNotification(sub, payload);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) { failedEndpoints.push(sub.endpoint); }
    }
  }

  if (failedEndpoints.length > 0) {
    const remaining = subscriptions.filter(s => !failedEndpoints.includes(s.endpoint));
    fs.writeFileSync(SUBS_FILE, JSON.stringify(remaining, null, 2));
  }
  if (logUpdated) {
    fs.writeFileSync(LOG_FILE, JSON.stringify(pushLog, null, 2));
  }
})();