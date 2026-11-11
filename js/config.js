function deepMerge(base, override) { if (Array.isArray(base) || Array.isArray(override)) { if (Array.isArray(override)) return override.slice(); return Array.isArray(base) ? base.slice() : override; } const isObj = (v) => v && typeof v === 'object'; if (isObj(base)) { const ov = isObj(override) ? override : {}; const out = {}; for (const k of Object.keys(base)) out[k] = deepMerge(base[k], ov[k]); for (const k of Object.keys(ov)) if (!(k in out)) out[k] = deepMerge(undefined, ov[k]); return out; } return override === undefined ? base : override; }
function migrateConfigs(raw) { 
  if (!raw || typeof raw !== 'object') return {}; 
  if (raw.configVersion >= 17) return raw; 
  const out = Object.assign({}, raw); 
  out.configVersion = 17; 
  if (out.timeZones && typeof out.timeZones.master === 'string') out.timeZones = { master: { type: 'iana', value: out.timeZones.master }, doggy: { type: 'iana', value: out.timeZones.doggy } }; 
  if (!out.profiles) out.profiles = { daily: {}, service: {} }; 
  const oldNotifyTexts = out.notifySettings && out.notifySettings.texts ? out.notifySettings.texts : null; 
  if (oldNotifyTexts) { 
    if (!out.profiles.daily.notifyTexts) out.profiles.daily.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.daily, oldNotifyTexts); 
    if (!out.profiles.service.notifyTexts) out.profiles.service.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.service); 
    delete out.notifySettings.texts; 
  } 
  ['daily', 'service'].forEach(m => { 
    if (!out.profiles[m]) out.profiles[m] = {}; 
    const pt = out.profiles[m].progressTexts; 
    if (pt && !pt.master) out.profiles[m].progressTexts = { master: { ...pt }, doggy: { ...pt }, both: { ...pt } }; 
  }); 
  
  if (out.notifySettings) {
      const ns = out.notifySettings;
      if (!ns.items) ns.items = {};
      if (ns.items.overtime_sleep !== undefined && ns.items.master_sleep_overtime === undefined) { ns.items.master_sleep_overtime = ns.items.overtime_sleep; ns.items.doggy_sleep_overtime = ns.items.overtime_sleep; delete ns.items.overtime_sleep; }
      if (ns.items.overtime_wake !== undefined && ns.items.master_wake_overtime === undefined) { ns.items.master_wake_overtime = ns.items.overtime_wake; ns.items.doggy_wake_overtime = ns.items.overtime_wake; delete ns.items.overtime_wake; }
      if (ns.master_window_enabled === undefined) {
          ns.master_window_enabled = ns.overtime_window_enabled !== false;
          ns.doggy_window_enabled = ns.overtime_window_enabled !== false;
          ns.master_sleep_start = ns.overtime_sleep_start || '21:00';
          ns.master_sleep_end = ns.overtime_sleep_end || '05:00';
          ns.master_wake_start = ns.overtime_wake_start || '05:00';
          ns.master_wake_end = ns.overtime_wake_end || '12:00';
          ns.master_max_times = ns.overtime_max_times !== undefined ? ns.overtime_max_times : 3;
          ns.doggy_sleep_start = ns.overtime_sleep_start || '21:00';
          ns.doggy_sleep_end = ns.overtime_sleep_end || '05:00';
          ns.doggy_wake_start = ns.overtime_wake_start || '05:00';
          ns.doggy_wake_end = ns.overtime_wake_end || '12:00';
          ns.doggy_max_times = ns.overtime_max_times !== undefined ? ns.overtime_max_times : 3;
          delete ns.overtime_window_enabled; delete ns.overtime_sleep_start; delete ns.overtime_sleep_end; delete ns.overtime_wake_start; delete ns.overtime_wake_end; delete ns.overtime_max_times;
      }
      if (ns.master_on_time_before === undefined) { ns.master_on_time_before = 15; ns.master_on_time_after = 15; ns.doggy_on_time_before = 15; ns.doggy_on_time_after = 15; }
  }
  return out; 
}
let savedConfigs = {}; try { savedConfigs = migrateConfigs(JSON.parse(localStorage.getItem('dawn-duo-configs')) || {}); } catch (e) { savedConfigs = {}; }
let configs = deepMerge(DEFAULT_CONFIGS, savedConfigs);
function P() { return configs.profiles[configs.mode] || configs.profiles.daily; }
function modeLabel() { return configs.mode === 'service' ? '主仆' : '日常'; }
const IDENTITY_KEY = 'dawn-duo-identity'; let identity = ''; try { identity = localStorage.getItem(IDENTITY_KEY) || ''; } catch (e) { identity = ''; } if (['master', 'doggy', 'both'].indexOf(identity) === -1) identity = '';
const CONFIG_KEY = 'dawn-duo-gh-config'; let ghConfig = { user: 'luo029', repo: 'dawn_duo_data', path: 'records.json', configPath: 'config.json', token: '', autoSync: true, syncInterval: 5, syncPrompt: true }; try { const savedGh = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}; ghConfig.token = savedGh.token || ''; ghConfig.autoSync = savedGh.autoSync !== false; ghConfig.syncInterval = savedGh.syncInterval !== undefined ? Number(savedGh.syncInterval) : 5; ghConfig.syncPrompt = savedGh.syncPrompt !== false; } catch (e) { }
let db = { master: {}, doggy: {} }; try { const local = localStorage.getItem('dawn-duo-data'); if (local) { const parsed = JSON.parse(local); db.master = parsed.master || {}; db.doggy = parsed.doggy || parsed.dog || {}; } } catch (e) { db = { master: {}, doggy: {} }; }
let notifyLog = JSON.parse(localStorage.getItem('dawn-duo-notify-log') || '{}'); let lastLogicalDate = getLogicalDateStr();