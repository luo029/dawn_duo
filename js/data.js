// ================= 默认文案池 =================
// 日常模式文案
const MSG_DAILY = {
  master: {
    sleep: {
      success: ["先生休息啦，宝宝也早点睡，晚安好梦 🌙", "先生晚安～今天辛苦了，好好休息哦 💤", "先生睡啦，宝宝把灯关好，明天见 ✨"],
      late: ["先生今天晚睡了，宝宝有点担心，早点休息呀 🌙", "夜深了先生，别熬太晚，宝宝等你睡觉呢 💤"]
    },
    wake: {
      success: ["先生早安！新的一天开始啦 ☀️", "先生起床啦，宝宝已经准备好迎接今天了 🌸", "先生早上好～今天也要元气满满哦 💪"],
      late: ["先生赖床啦，宝宝悄悄准备好早餐等你 🍞", "太阳晒屁股啦先生，该起床咯 ☀️"]
    }
  },
  doggy: {
    sleep: {
      success: ["宝宝真乖，按时睡觉啦，晚安好梦 🌙", "宝宝钻进被窝了，先生也放心啦 💤", "宝宝乖乖睡觉，明天见 ✨"],
      late: ["宝宝今天晚睡了哦，早点休息呀 🌙", "夜深啦宝宝，别玩太晚，快去睡觉 💤"]
    },
    wake: {
      success: ["宝宝早安！今天也要开开心心哦 ☀️", "宝宝起床啦，真棒！ 🌸", "早安宝宝，新的一天开始啦 ✨"],
      late: ["宝宝赖床啦，快起来哦 ☀️", "太阳晒屁股啦宝宝，该起床咯 ⏰"]
    }
  }
};

// 主仆模式文案 (目前为空，后续您可以填入自己想要的文案)
const MSG_SERVICE = {
  master: {
    sleep: { success: [], late: [] },
    wake: { success: [], late: [] }
  },
  doggy: {
    sleep: { success: [], late: [] },
    wake: { success: [], late: [] }
  }
};

// 默认通知文案 (按模式分离)
const DEFAULT_NOTIFY_TEXTS = {
  daily: {
    master_sleep: '{name}，到点啦，该休息了哦~',
    master_wake: '{name}，早安，该起床啦！',
    doggy_sleep: '{name}，乖乖睡觉的时间到了哦~',
    doggy_wake: '{name}，太阳晒屁股啦，起床吧！',
    overtime_sleep: '{name}，已经熬夜 {mins} 分钟了，该睡觉了！',
    overtime_wake: '{name}，已经赖床 {mins} 分钟了，快起床吧！'
  },
  service: {
    master_sleep: '{name}，该休息了。',
    master_wake: '{name}，该起床了。',
    doggy_sleep: '{name}，该睡觉了。',
    doggy_wake: '{name}，该起来了。',
    overtime_sleep: '{name}，已经熬夜 {mins} 分钟了。',
    overtime_wake: '{name}，已经赖床 {mins} 分钟了。'
  }
};

// 默认通用文本
const DEFAULT_TEXTS_DAILY = {
  title: '☀️ 先生与宝宝的契约', subtitle: '跨越半个地球的日常陪伴',
  masterName: '🧘 先生', masterTag: '👑 先生', masterRegion: '上海',
  doggyName: '🍼 宝宝', doggyTag: '🎀 宝宝', doggyRegion: '纽约',
  masterSleepBtn: '先生休息', masterWakeBtn: '先生起床', doggySleepBtn: '宝宝睡觉', doggyWakeBtn: '宝宝起床'
};

const DEFAULT_TEXTS_SERVICE = {
  title: '🐾 主人与小狗的契约', subtitle: '跨越半个地球的温柔驯养',
  masterName: '🖤 主人', masterTag: '👑 主人', masterRegion: '中国',
  doggyName: '🐶 小狗', doggyTag: '🎀 小狗', doggyRegion: '美国',
  masterSleepBtn: '主人休息', masterWakeBtn: '主人起床', doggySleepBtn: '小狗睡觉', doggyWakeBtn: '小狗起床'
};

// ================= 核心配置 =================
const DEFAULT_CONFIGS = {
  configVersion: 5, // 👈 升级版本号到 5，强制清理旧缓存
  mode: 'service', 
  simpleMode: false,
  notifications: false,
  notifySettings: {
    enableOvertime: false,
    overtimeInterval: 30
  },
  profiles: {
    daily: { 
      texts: DEFAULT_TEXTS_DAILY, 
      colors: { master: '#38bdf8', doggy: '#f472b6' }, 
      msgPool: MSG_DAILY,
      notifyTexts: DEFAULT_NOTIFY_TEXTS.daily 
    },
    service: { 
      texts: DEFAULT_TEXTS_SERVICE, 
      colors: { master: '#a855f7', doggy: '#fb7185' }, 
      msgPool: MSG_SERVICE,
      notifyTexts: DEFAULT_NOTIFY_TEXTS.service 
    }
  },
  goals: { master: { sleep: '23:00', wake: '07:00' }, doggy: { sleep: '22:30', wake: '07:30' } },
  timeZones: { 
    master: { type: 'iana', value: 'Asia/Shanghai' }, 
    doggy: { type: 'iana', value: 'America/New_York' } 
  },
  anniversary: '2026-11-04',
  showHistory: false,
  historyType: 'days',
  historyDays: 30,
  historyYear: '2026',
  historyMonth: '11'
};