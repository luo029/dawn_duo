function deepMerge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) {
    if (Array.isArray(override)) return override.slice();
    return Array.isArray(base) ? base.slice() : override;
  }
  const isObj = (v) => v && typeof v === 'object';
  if (isObj(base)) {
    const ov = isObj(override) ? override : {};
    const out = {};
    for (const k of Object.keys(base)) out[k] = deepMerge(base[k], ov[k]);
    for (const k of Object.keys(ov)) if (!(k in out)) out[k] = deepMerge(undefined, ov[k]);
    return out;
  }
  return override === undefined ? base : override;
}

function migrateConfigs(raw) {
  if (!raw || typeof raw !== 'object') return {};
  if (raw.configVersion >= 8) return raw;
  const out = Object.assign({}, raw);
  out.configVersion = 8;
  out.mode = 'service';
  if (out.timeZones && typeof out.timeZones.master === 'string') {
    out.timeZones = { master: { type: 'iana', value: out.timeZones.master }, doggy: { type: 'iana', value: out.timeZones.doggy } };
  }
  if (!out.profiles) out.profiles = { daily: {}, service: {} };
  const oldNotifyTexts = out.notifySettings && out.notifySettings.texts ? out.notifySettings.texts : null;
  if (oldNotifyTexts) {
    if (!out.profiles.daily.notifyTexts) out.profiles.daily.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.daily, oldNotifyTexts);
    if (!out.profiles.service.notifyTexts) out.profiles.service.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.service);
    delete out.notifySettings.texts; 
  }
  if (out.showLogicalDate === undefined) out.showLogicalDate = true;
  if (out.showPartnerCard === undefined) out.showPartnerCard = true;
  if (out.showPartnerStatus === undefined) out.showPartnerStatus = true;
  if (!out.clockLayout) out.clockLayout = 'separate';
  if (out.showMasterClock === undefined) out.showMasterClock = true;
  if (out.showDoggyClock === undefined) out.showDoggyClock = true;
  if (out.showSeconds === undefined) out.showSeconds = true;
  if (out.showShichen === undefined) out.showShichen = false;
  if (out.showWellness === undefined) out.showWellness = false;
  return out;
}

let savedConfigs = {};
try { savedConfigs = migrateConfigs(JSON.parse(localStorage.getItem('dawn-duo-configs')) || {}); } catch (e) { savedConfigs = {}; }
let configs = deepMerge(DEFAULT_CONFIGS, savedConfigs);
if (!configs.profiles) configs.profiles = deepMerge(DEFAULT_CONFIGS.profiles, {});
if (!configs.profiles.daily.notifyTexts) configs.profiles.daily.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.daily);
if (!configs.profiles.service.notifyTexts) configs.profiles.service.notifyTexts = Object.assign({}, DEFAULT_NOTIFY_TEXTS.service);
if (!configs.notifySettings) configs.notifySettings = { enableOvertime: false, overtimeInterval: 30, partnerNotify: true };
if (configs.notifySettings.partnerNotify === undefined) configs.notifySettings.partnerNotify = true;

function P() { return configs.profiles[configs.mode] || configs.profiles.daily; }
function modeLabel() { return configs.mode === 'service' ? '主仆' : '日常'; }

const IDENTITY_KEY = 'dawn-duo-identity';
let identity = '';
try { identity = localStorage.getItem(IDENTITY_KEY) || ''; } catch (e) { identity = ''; }
if (['master', 'doggy', 'both'].indexOf(identity) === -1) identity = '';

const CONFIG_KEY = 'dawn-duo-gh-config';
let ghConfig = { user: 'luo029', repo: 'dawn_duo_data', path: 'records.json', configPath: 'config.json', token: '', autoSync: true };
try { 
  const savedGh = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  ghConfig.token = savedGh.token || ''; 
  ghConfig.autoSync = savedGh.autoSync !== false;
} catch (e) { }

let db = { master: {}, doggy: {} };
try {
  const local = localStorage.getItem('dawn-duo-data');
  if (local) {
    const parsed = JSON.parse(local);
    db.master = parsed.master || {}; db.doggy = parsed.doggy || parsed.dog || {};
  }
} catch (e) { db = { master: {}, doggy: {} }; }

let notifyLog = JSON.parse(localStorage.getItem('dawn-duo-notify-log') || '{}');
let lastLogicalDate = getLogicalDateStr();