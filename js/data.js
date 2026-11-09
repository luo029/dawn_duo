// ================= 默认文案池 =================
const MSG_DAILY = {
  master: {
    sleep: { success: ["先生休息啦，宝宝也早点睡，晚安好梦 🌙", "先生晚安～今天辛苦了，好好休息哦 💤", "先生睡啦，宝宝把灯关好，明天见 ✨"], late: ["先生今天晚睡了，宝宝有点担心，早点休息呀 🌙", "夜深了先生，别熬太晚，宝宝等你睡觉呢 💤"] },
    wake: { success: ["先生早安！新的一天开始啦 ☀️", "先生起床啦，宝宝已经准备好迎接今天了 🌸", "先生早上好～今天也要元气满满哦 💪"], late: ["先生赖床啦，宝宝悄悄准备好早餐等你 🍞", "太阳晒屁股啦先生，该起床咯 ☀️"] }
  },
  doggy: {
    sleep: { success: ["宝宝真乖，按时睡觉啦，晚安好梦 🌙", "宝宝钻进被窝了，先生也放心啦 💤", "宝宝乖乖睡觉，明天见 ✨"], late: ["宝宝今天晚睡了哦，早点休息呀 🌙", "夜深啦宝宝，别玩太晚，快去睡觉 💤"] },
    wake: { success: ["宝宝早安！今天也要开开心心哦 ☀️", "宝宝起床啦，真棒！ 🌸", "早安宝宝，新的一天开始啦 ✨"], late: ["宝宝赖床啦，快起来哦 ☀️", "太阳晒屁股啦宝宝，该起床咯 ⏰"] }
  }
};

const MSG_SERVICE = {
  master: {
    sleep: { success: ["主人已休息，晚安。", "主人休息了，明天见。", "主人已躺下，好梦。"], late: ["主人今天晚睡了。", "主人休息得有点晚，注意身体。"] },
    wake: { success: ["主人早安。", "主人已起床，新的一天开始了。", "主人醒了。"], late: ["主人起晚了。", "主人今天赖床了。"] }
  },
  doggy: {
    sleep: { success: ["小狗乖乖睡觉了。", "小狗已休息，晚安。", "小狗钻进被窝了。"], late: ["小狗今天晚睡了。", "小狗还不睡吗？"] },
    wake: { success: ["小狗早安。", "小狗起床了，真乖。", "小狗醒了。"], late: ["小狗赖床了。", "小狗起晚了。"] }
  }
};

const DEFAULT_NOTIFY_TEXTS = {
  daily: {
    master_sleep: '{name}，到点啦，该休息了哦~', 
    master_wake: '{name}，早安，该起床啦！', 
    doggy_sleep: '{name}，乖乖睡觉的时间到了哦~', 
    doggy_wake: '{name}，太阳晒屁股啦，起床吧！', 
    overtime_sleep: '{name}，已经熬夜 {mins} 分钟了，该睡觉了！', 
    overtime_wake: '{name}，已经赖床 {mins} 分钟了，快起床吧！',
    partner_master_sleep: '👑 {name} 已休息啦 🌙 ({time})', 
    partner_master_wake: '👑 {name} 已起床啦 ☀️ ({time})',
    partner_doggy_sleep: '🎀 {name} 已休息啦 🌙 ({time})', 
    partner_doggy_wake: '🎀 {name} 已起床啦 ☀️ ({time})',
    status_master_sleep: '🌙 {name} 已经休息啦 ({time})',
    status_master_wake: '☀️ {name} 已经醒来啦 ({time})',
    status_doggy_sleep: '🌙 {name} 已经休息啦 ({time})',
    status_doggy_wake: '☀️ {name} 已经醒来啦 ({time})'
  },
  service: {
    master_sleep: '{name}，该休息了。', 
    master_wake: '{name}，该起床了。', 
    doggy_sleep: '{name}，该睡觉了。', 
    doggy_wake: '{name}，该起来了。', 
    overtime_sleep: '{name}，已经熬夜 {mins} 分钟了。', 
    overtime_wake: '{name}，已经赖床 {mins} 分钟了。',
    partner_master_sleep: '👑 {name} 已休息。({time})', 
    partner_master_wake: '👑 {name} 已起床。({time})',
    partner_doggy_sleep: '🎀 {name} 已休息。({time})', 
    partner_doggy_wake: '🎀 {name} 已起床。({time})',
    status_master_sleep: '🌙 主人已安寝，小狗请保持安静 ({time})',
    status_master_wake: '☀️ 主人已苏醒，准备迎接新的一天 ({time})',
    status_doggy_sleep: '🌙 小狗已乖乖入梦 ({time})',
    status_doggy_wake: '☀️ 小狗已醒来，等待主人 ({time})'
  }
};

const DEFAULT_TEXTS_DAILY = {
  title: '☀️ 先生与宝宝的契约', subtitle: '跨越半个地球的日常陪伴', masterName: '🧘 先生', masterTag: '👑 先生', masterRegion: '上海', doggyName: '🍼 宝宝', doggyTag: '🎀 宝宝', doggyRegion: '纽约', masterSleepBtn: '先生休息', masterWakeBtn: '先生起床', doggySleepBtn: '宝宝睡觉', doggyWakeBtn: '宝宝起床',
  dailyModeIcon: '💕', serviceModeIcon: '🐕'
};

const DEFAULT_TEXTS_SERVICE = {
  title: '🐾 主人与小狗的契约', subtitle: '跨越半个地球的温柔驯养', masterName: '🖤 主人', masterTag: '👑 主人', masterRegion: '中国', doggyName: '🐕 小狗', doggyTag: '🎀 小狗', doggyRegion: '美国', masterSleepBtn: '主人休息', masterWakeBtn: '主人起床', doggySleepBtn: '小狗睡觉', doggyWakeBtn: '小狗起床',
  dailyModeIcon: '💕', serviceModeIcon: '🐕'
};

// ================= 十二时辰养生数据 =================
const SHICHEN_DATA = [
  { name: '子时', time: '23:00-01:00', organ: '胆', msg: '胆经当令，宜睡眠，养足胆气。' },
  { name: '丑时', time: '01:00-03:00', organ: '肝', msg: '肝经当令，熟睡养肝，排毒。' },
  { name: '寅时', time: '03:00-05:00', organ: '肺', msg: '肺经当令，深度睡眠，气血运行。' },
  { name: '卯时', time: '05:00-07:00', organ: '大肠', msg: '大肠经当令，起床排便，喝温水。' },
  { name: '辰时', time: '07:00-09:00', organ: '胃', msg: '胃经当令，吃早餐，补充营养。' },
  { name: '巳时', time: '09:00-11:00', organ: '脾', msg: '脾经当令，工作学习，精神最好。' },
  { name: '午时', time: '11:00-13:00', organ: '心', msg: '心经当令，午休小憩，养心安神。' },
  { name: '未时', time: '13:00-15:00', organ: '小肠', msg: '小肠经当令，多喝水，促进吸收。' },
  { name: '申时', time: '15:00-17:00', organ: '膀胱', msg: '膀胱经当令，工作运动，多排尿。' },
  { name: '酉时', time: '17:00-19:00', organ: '肾', msg: '肾经当令，休息养肾，不宜过劳。' },
  { name: '戌时', time: '19:00-21:00', organ: '心包', msg: '心包经当令，散步放松，保持心情愉悦。' },
  { name: '亥时', time: '21:00-23:00', organ: '三焦', msg: '三焦经当令，准备入睡，泡脚助眠。' }
];

// ================= 核心配置 =================
const DEFAULT_CONFIGS = {
  configVersion: 7,
  mode: 'daily',
  simpleMode: false,
  notifications: false,
  showPartnerCard: true,
  showPartnerStatus: true,
  showLogicalDate: true,
  notifySettings: { enableOvertime: false, overtimeInterval: 30, partnerNotify: true },
  profiles: {
    daily: { texts: DEFAULT_TEXTS_DAILY, colors: { master: '#38bdf8', doggy: '#f472b6' }, msgPool: MSG_DAILY, notifyTexts: DEFAULT_NOTIFY_TEXTS.daily },
    service: { texts: DEFAULT_TEXTS_SERVICE, colors: { master: '#a855f7', doggy: '#fb7185' }, msgPool: MSG_SERVICE, notifyTexts: DEFAULT_NOTIFY_TEXTS.service }
  },
  goals: { master: { sleep: '23:00', wake: '07:00' }, doggy: { sleep: '22:30', wake: '07:30' } },
  timeZones: { master: { type: 'iana', value: 'Asia/Shanghai' }, doggy: { type: 'iana', value: 'America/New_York' } },
  anniversary: '2026-11-04',
  showHistory: false,
  historyType: 'days',
  historyDays: 30,
  historyYear: '2026',
  historyMonth: '11',

  clockLayout: 'separate',
  showMasterClock: true,
  showDoggyClock: true,
  showSeconds: true,
  showShichen: false,
  showWellness: false
};