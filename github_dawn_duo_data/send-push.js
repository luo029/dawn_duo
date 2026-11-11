const fs = require('fs');
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:example@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const SUBS_FILE = 'subscriptions.json';
const CONFIG_FILE = 'config.json';
const TEST_MODE = process.env.TEST_MODE === 'true';

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

  let remoteDb = { master: {}, doggy: {} };
  try {
    if (fs.existsSync('master_records.json')) remoteDb.master = JSON.parse(fs.readFileSync('master_records.json', 'utf8'));
    if (fs.existsSync('doggy_records.json')) remoteDb.doggy = JSON.parse(fs.readFileSync('doggy_records.json', 'utf8'));
  } catch (e) { console.warn('Failed to read records:', e.message); }

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

  for (const sub of subscriptions) {
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

    const mTime = getTimeInTZ(timeZones.master);
    const dTime = getTimeInTZ(timeZones.doggy);
    
    const mMins = getMins(mTime);
    const dMins = getMins(dTime);
    
    const mSleepGoal = toMins(goals.master?.sleep || '23:00');
    const mWakeGoal = toMins(goals.master?.wake || '07:00');
    const dSleepGoal = toMins(goals.doggy?.sleep || '22:30');
    const dWakeGoal = toMins(goals.doggy?.wake || '07:30');

    let textKey = '', replacements = {}, sendType = '';

    const mSleepDiff = Math.abs(mMins - mSleepGoal);
    const mWakeDiff = Math.abs(mMins - mWakeGoal);
    const dSleepDiff = Math.abs(dMins - dSleepGoal);
    const dWakeDiff = Math.abs(dMins - dWakeGoal);

    if (sendMaster) {
      if (mSleepDiff < mWakeDiff) { textKey = 'master_sleep'; sendType = 'sleep'; } 
      else { textKey = 'master_wake'; sendType = 'wake'; }
      replacements = { name: mName };
      
      // 测试模式下直接无视打卡记录
      if (!TEST_MODE) {
        const isDone = sendType === 'sleep' ? remoteDb.master[mDateStr]?.sleep?.done : remoteDb.master[mDateStr]?.wake?.done;
        if (isDone) { console.log(`[跳过] ${mName} 今日已打卡 ${sendType}`); continue; }
      } else {
        console.log(`[测试模式] 无视防误触，强制发送给 ${mName}`);
      }

      if (notifyItems[textKey] === false && !TEST_MODE) { console.log(`[跳过] ${mName} ${sendType} 提醒已关闭`); continue; }

      if (notifySettings.enableOvertime) {
        let isLate = false, minsLate = 0;
        if (sendType === 'sleep') {
          let diff = mMins - mSleepGoal;
          if (diff > 720) diff -= 1440;
          if (diff > 30) { isLate = true; minsLate = diff; }
        } else {
          let diff = mMins - mWakeGoal;
          if (diff > 30) { isLate = true; minsLate = diff; }
        }
        if (isLate) { 
          textKey = sendType === 'sleep' ? 'overtime_sleep' : 'overtime_wake'; 
          replacements.mins = minsLate; 
          if (notifyItems[textKey] === false && !TEST_MODE) { console.log(`[跳过] ${textKey} 已关闭`); continue; }
        }
      }

      body = checkPushText(notifyTexts, textKey, replacements);
      if (body) {
        const textObj = notifyTexts[textKey] || {};
        title = textObj.title || (sendType === 'sleep' ? '🌙 休息提醒' : '☀️ 起床提醒');
        if (textKey.startsWith('overtime') && !textObj.title) title = sendType === 'sleep' ? '⚠️ 熬夜警告' : '⚠️ 赖床警告';
        icon = textObj.icon || '/icon-512.png';
      }
    } else if (sendDoggy) {
      if (dSleepDiff < dWakeDiff) { textKey = 'doggy_sleep'; sendType = 'sleep'; } 
      else { textKey = 'doggy_wake'; sendType = 'wake'; }
      replacements = { name: dName };
      
      if (!TEST_MODE) {
        const isDone = sendType === 'sleep' ? remoteDb.doggy[dDateStr]?.sleep?.done : remoteDb.doggy[dDateStr]?.wake?.done;
        if (isDone) { console.log(`[跳过] ${dName} 今日已打卡 ${sendType}`); continue; }
      } else {
        console.log(`[测试模式] 无视防误触，强制发送给 ${dName}`);
      }

      if (notifyItems[textKey] === false && !TEST_MODE) { console.log(`[跳过] ${dName} ${sendType} 提醒已关闭`); continue; }

      if (notifySettings.enableOvertime) {
        let isLate = false, minsLate = 0;
        if (sendType === 'sleep') {
          let diff = dMins - dSleepGoal;
          if (diff > 720) diff -= 1440;
          if (diff > 30) { isLate = true; minsLate = diff; }
        } else {
          let diff = dMins - dWakeGoal;
          if (diff > 30) { isLate = true; minsLate = diff; }
        }
        if (isLate) { 
          textKey = sendType === 'sleep' ? 'overtime_sleep' : 'overtime_wake'; 
          replacements.mins = minsLate; 
          if (notifyItems[textKey] === false && !TEST_MODE) { console.log(`[跳过] ${textKey} 已关闭`); continue; }
        }
      }

      body = checkPushText(notifyTexts, textKey, replacements);
      if (body) {
        const textObj = notifyTexts[textKey] || {};
        title = textObj.title || (sendType === 'sleep' ? '🌙 休息提醒' : '☀️ 起床提醒');
        if (textKey.startsWith('overtime') && !textObj.title) title = sendType === 'sleep' ? '⚠️ 熬夜警告' : '⚠️ 赖床警告';
        icon = textObj.icon || '/icon-512.png';
      }
    }

    if (!body) continue;

    const payload = JSON.stringify({ title, body, icon });

    try {
      await webpush.sendNotification(sub, payload);
      console.log(`Sent to ${sub.endpoint.slice(0, 50)}... (Identity: ${id}) | Type: ${textKey}`);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log(`Expired subscription, removing: ${sub.endpoint.slice(0, 50)}...`);
        failedEndpoints.push(sub.endpoint);
      } else {
        console.error(`Failed:`, err.message);
      }
    }
  }

  if (failedEndpoints.length > 0) {
    const remaining = subscriptions.filter(s => !failedEndpoints.includes(s.endpoint));
    fs.writeFileSync(SUBS_FILE, JSON.stringify(remaining, null, 2));
    console.log(`Removed ${failedEndpoints.length} expired subscription(s).`);
  }
})();