// API quản lý server: lọc server người dùng là Administrator, đọc/ghi cấu hình module từng server, Audit Logs & Security
import { Router } from 'express';
import mongoose from 'mongoose';
import { getSession } from './auth.js';

// Khai báo an toàn: Lấy model đã register hoặc tự định nghĩa Schema nếu chưa có
const AuditLogSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    executor: { type: String, default: 'System' },
    target: { type: String, default: '' },
    details: { type: String, default: '' },
    level: { type: String, enum: ['INFO', 'WARN', 'DANGER'], default: 'INFO' }
  },
  { timestamps: true }
);

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

const router = Router();
const API = 'https://discord.com/api/v10';
const ADMIN_BIT = 0x8n;
const CACHE_MS = 60_000;
const guildCache = new Map();
const db = () => mongoose.connection.db;

// Giá trị mặc định cho toàn bộ các module (Phải trùng khớp với Mongoose Schema của Bot)
const DEFAULTS = {
  welcome: { enabled: false, channelId: '', message: 'Chào mừng {user} đến với {server}! 🎉', useEmbed: true },
  goodbye: { enabled: false, channelId: '', message: '{username} đã rời khỏi {server}. 👋', useEmbed: true },
  boost: { enabled: false, channelId: '', message: '🚀 {user} vừa boost {server}! Hiện có {boosts} boost.' },
  stats: { enabled: false, template: '{label}: {count}' },
  antispam: { enabled: false, maxMessages: 5, windowSeconds: 5, timeoutMinutes: 5, blockedWords: [] },
  ai: { provider: 'gemini', model: '', baseUrl: '' },
  security: {
    // Tab 1: Anti-Nuke & Raid
    antiRaidEnabled: false,
    minAccountAgeDays: 7,
    antiNukeChannelsEnabled: false,
    maxChannelDeletePerMin: 3,
    antiNukeRolesEnabled: false,
    maxRoleDeletePerMin: 3,
    antiMassBanEnabled: false,
    maxBanPerMin: 5,
    antiBotJoinEnabled: false,

    // Tab 2: Content & Anti-Spam
    antiLinkEnabled: false,
    antiInviteEnabled: false,
    antiMassMentionEnabled: false,
    maxMentions: 5,
    antiBadwordsEnabled: false,
    badwordsList: [],
    antiGhostPingEnabled: false,
    antiDuplicateEnabled: false,

    // Tab 3: Verification & Roles
    autoRoleEnabled: false,
    autoRoleId: '',
    verificationGateEnabled: false,
    verificationRoleId: '',
    whitelistRoles: [],
    whitelistUsers: [],

    // Tab 4: Emergency & Logs
    lockdownMode: false,
    logChannelId: ''
  }
};

// Danh sách Whitelist các trường được phép cập nhật từ Web Dashboard
const EDITABLE = {
  welcome: ['enabled', 'channelId', 'message', 'useEmbed'],
  goodbye: ['enabled', 'channelId', 'message', 'useEmbed'],
  boost: ['enabled', 'channelId', 'message'],
  stats: ['enabled', 'template'],
  antispam: ['enabled', 'maxMessages', 'windowSeconds', 'timeoutMinutes', 'blockedWords'],
  ai: ['provider', 'model', 'baseUrl'],
  security: [
    'antiRaidEnabled', 'minAccountAgeDays', 'antiNukeChannelsEnabled', 'maxChannelDeletePerMin',
    'antiNukeRolesEnabled', 'maxRoleDeletePerMin', 'antiMassBanEnabled', 'maxBanPerMin', 'antiBotJoinEnabled',
    'antiLinkEnabled', 'antiInviteEnabled', 'antiMassMentionEnabled', 'maxMentions',
    'antiBadwordsEnabled', 'badwordsList', 'antiGhostPingEnabled', 'antiDuplicateEnabled',
    'autoRoleEnabled', 'autoRoleId', 'verificationGateEnabled', 'verificationRoleId',
    'whitelistRoles', 'whitelistUsers', 'lockdownMode', 'logChannelId'
  ]
};

// Lấy danh sách server của user từ Discord (có cache 60s)
async function getUserGuilds(session) {
  const cached = guildCache.get(session.user.id);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.guilds;

  const r = await fetch(`${API}/users/@me/guilds`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
  if (!r.ok) {
    const err = new Error('Discord session expired');
    err.status = 401;
    throw err;
  }
  const guilds = await r.json();
  guildCache.set(session.user.id, { at: Date.now(), guilds });
  return guilds;
}

// Kiểm tra Administrator hoặc Owner
const isAdmin = (g) => g.owner || (BigInt(g.permissions) & ADMIN_BIT) === ADMIN_BIT;

// Middleware yêu cầu đăng nhập
router.use((req, res, next) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  req.session = session;
  next();
});

// Middleware xác thực quyền Admin đối với Guild trong tham số
async function requireAdminGuild(req, res, next) {
  try {
    const guilds = await getUserGuilds(req.session);
    const guild = guilds.find((g) => g.id === req.params.guildId && isAdmin(g));
    if (!guild) return res.status(403).json({ error: 'NOT_ADMIN' });
    req.guild = guild;
    next();
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// Lấy danh sách Guild người dùng quản trị
router.get('/', async (req, res) => {
  try {
    const guilds = await getUserGuilds(req.session);
    const status = await db().collection('botstatuses').findOne({ _id: 'main' });
    const botGuilds = new Set((status?.guilds ?? []).map((g) => g.id));
    res.json(
      guilds.filter(isAdmin).map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        botIn: botGuilds.has(g.id),
      })),
    );
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// Lấy dữ liệu tổng quan cho Dashboard
router.get('/:guildId/overview', requireAdminGuild, async (req, res) => {
  const { guildId } = req.params;
  const status = await db().collection('botstatuses').findOne({ _id: 'main' });
  const entry = status?.guilds?.find((g) => g.id === guildId);
  if (!entry) return res.status(404).json({ error: 'BOT_NOT_IN_GUILD' });

  const config = (await db().collection('guildconfigs').findOne({ guildId })) ?? {};
  res.json({
    guild: { id: guildId, name: entry.name, icon: entry.icon },
    memberCount: entry.memberCount,
    boosts: entry.boosts,
    ping: status.ping,
    channels: entry.channels ?? [],
    modules: {
      welcome: Boolean(config.welcome?.enabled),
      goodbye: Boolean(config.goodbye?.enabled),
      boost: Boolean(config.boost?.enabled),
      stats: Boolean(config.stats?.enabled),
      antispam: Boolean(config.antispam?.enabled),
      ai: Boolean(config.ai?.apiKey),
      security: Boolean(
        config.security?.autoRoleEnabled || 
        config.security?.antiRaidEnabled || 
        config.security?.antiLinkEnabled ||
        config.security?.lockdownMode
      )
    },
  });
});

// Đọc cấu hình tổng quát
router.get('/:guildId/config', requireAdminGuild, async (req, res) => {
  const stored = (await db().collection('guildconfigs').findOne({ guildId: req.params.guildId })) ?? {};
  const merged = {};
  for (const [section, def] of Object.entries(DEFAULTS)) {
    merged[section] = { ...def, ...(stored[section] ?? {}) };
  }
  const key = stored.ai?.apiKey ?? '';
  delete merged.ai.apiKey;
  merged.ai.hasKey = Boolean(key);
  merged.ai.maskedKey = key ? `••••${key.slice(-4)}` : '';
  res.json(merged);
});

// Hàm ép kiểu và làm sạch dữ liệu đầu vào theo loại trường
function sanitize(key, value) {
  if (['blockedWords', 'badwordsList', 'whitelistRoles', 'whitelistUsers'].includes(key)) {
    return Array.isArray(value) ? value.map(String).slice(0, 500) : [];
  }
  if ([
    'maxMessages', 'windowSeconds', 'timeoutMinutes', 'minAccountAgeDays', 
    'maxChannelDeletePerMin', 'maxRoleDeletePerMin', 'maxBanPerMin', 'maxMentions'
  ].includes(key)) {
    return Math.min(Math.max(Number(value) || 0, 0), 3600);
  }
  if (key === 'provider') return ['gemini', 'claude', 'openai', 'custom'].includes(value) ? value : 'gemini';
  if (typeof value === 'boolean') return value;
  return String(value ?? '').slice(0, 2000);
}

// Cập nhật cấu hình chung
router.put('/:guildId/config', requireAdminGuild, async (req, res) => {
  const body = req.body ?? {};
  const set = {};

  for (const [section, keys] of Object.entries(EDITABLE)) {
    const input = body[section];
    if (!input || typeof input !== 'object') continue;
    for (const key of keys) {
      if (input[key] !== undefined) set[`${section}.${key}`] = sanitize(key, input[key]);
    }
  }

  const newKey = body.ai?.apiKey;
  if (typeof newKey === 'string' && newKey.trim() && !newKey.includes('••')) {
    set['ai.apiKey'] = newKey.trim().slice(0, 300);
  }

  if (!Object.keys(set).length) return res.status(400).json({ error: 'NO_CHANGES' });

  set.updatedAt = new Date();
  await db().collection('guildconfigs').updateOne({ guildId: req.params.guildId }, { $set: set }, { upsert: true });

  await AuditLog.create({
    guildId: req.params.guildId,
    action: 'DASHBOARD_CONFIG_UPDATE',
    executor: req.session.user.username || 'Dashboard User',
    details: 'Cập nhật cấu hình server từ Web Dashboard',
    level: 'INFO'
  }).catch(() => {});

  res.json({ ok: true });
});

// -------------------------------------------------------------
// API Lấy danh sách Audit Logs (Cho tab 📋 Nhật Ký Hoạt Động)
// -------------------------------------------------------------
router.get('/:guildId/logs', requireAdminGuild, async (req, res) => {
  try {
    const { guildId } = req.params;
    const logs = await AuditLog.find({ guildId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// API Lấy & Lưu Cấu Hình Bảo Mật Nâng Cao (Tab 🛡️ Bảo Mật Server)
// -------------------------------------------------------------
router.get('/:guildId/security', requireAdminGuild, async (req, res) => {
  try {
    const { guildId } = req.params;
    const doc = await db().collection('guildconfigs').findOne({ guildId });
    const securityData = { ...DEFAULTS.security, ...(doc?.security ?? {}) };
    res.json({ success: true, security: securityData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:guildId/security', requireAdminGuild, async (req, res) => {
  try {
    const { guildId } = req.params;
    const inputSecurity = req.body.security || req.body;

    const set = {};
    if (inputSecurity && typeof inputSecurity === 'object') {
      for (const key of EDITABLE.security) {
        if (inputSecurity[key] !== undefined) {
          set[`security.${key}`] = sanitize(key, inputSecurity[key]);
        }
      }
    }

    if (!Object.keys(set).length) return res.status(400).json({ success: false, error: 'NO_CHANGES' });

    set.updatedAt = new Date();
    await db().collection('guildconfigs').updateOne({ guildId }, { $set: set }, { upsert: true });

    // Lưu vết Audit Log thao tác thay đổi cài đặt bảo mật
    await AuditLog.create({
      guildId,
      action: 'SECURITY_UPDATE',
      executor: req.session.user.username || 'Dashboard Admin',
      details: 'Cập nhật cấu hình Trung Tâm Bảo Mật đa phân khu',
      level: 'WARN'
    }).catch(() => {});

    res.json({ success: true, message: 'Đã lưu cấu hình bảo mật thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
