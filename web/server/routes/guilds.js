// API quản lý server: lọc server người dùng là Administrator, đọc/ghi cấu hình module từng server.
// Quyền được kiểm tra lại mỗi request bằng access token Discord (có cache 60 giây).
import { Router } from 'express';
import mongoose from 'mongoose';
import { getSession } from './auth.js';

const router = Router();
const API = 'https://discord.com/api/v10';
const ADMIN_BIT = 0x8n;
const CACHE_MS = 60_000;
const guildCache = new Map(); // userId -> { at, guilds }
const db = () => mongoose.connection.db;

// Giá trị mặc định (phải khớp với schema của bot để hiển thị đúng khi chưa cấu hình)
const DEFAULTS = {
  welcome: { enabled: false, channelId: '', message: 'Chào mừng {user} đến với {server}! 🎉', useEmbed: true },
  goodbye: { enabled: false, channelId: '', message: '{username} đã rời khỏi {server}. 👋', useEmbed: true },
  boost: { enabled: false, channelId: '', message: '🚀 {user} vừa boost {server}! Hiện có {boosts} boost.' },
  stats: { enabled: false, template: '{label}: {count}' },
  antispam: { enabled: false, maxMessages: 5, windowSeconds: 5, timeoutMinutes: 5, blockedWords: [] },
  ai: { provider: 'gemini', model: '', baseUrl: '' },
};

// Các trường cho phép ghi từ Dashboard (whitelist để tránh ghi đè trường nhạy cảm)
const EDITABLE = {
  welcome: ['enabled', 'channelId', 'message', 'useEmbed'],
  goodbye: ['enabled', 'channelId', 'message', 'useEmbed'],
  boost: ['enabled', 'channelId', 'message'],
  stats: ['enabled', 'template'],
  antispam: ['enabled', 'maxMessages', 'windowSeconds', 'timeoutMinutes', 'blockedWords'],
  ai: ['provider', 'model', 'baseUrl'],
};

// Lấy danh sách server của user từ Discord (có cache)
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

// Administrator hoặc chủ server
const isAdmin = (g) => g.owner || (BigInt(g.permissions) & ADMIN_BIT) === ADMIN_BIT;

// Mọi route /api/guilds đều yêu cầu đăng nhập
router.use((req, res, next) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  req.session = session;
  next();
});

// Middleware: server trong URL phải tồn tại và user là Admin
async function requireAdminGuild(req, res, next) {
  const guilds = await getUserGuilds(req.session);
  const guild = guilds.find((g) => g.id === req.params.guildId && isAdmin(g));
  if (!guild) return res.status(403).json({ error: 'NOT_ADMIN' });
  req.guild = guild;
  next();
}

// Danh sách server quản trị, đánh dấu bot đã có mặt hay chưa
router.get('/', async (req, res) => {
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
});

// Thông số tổng quan + trạng thái module của một server
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
    },
  });
});

// Đọc cấu hình, API key được che (chỉ hiện 4 ký tự cuối)
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

// Chuẩn hoá giá trị đầu vào theo loại trường
function sanitize(key, value) {
  if (key === 'blockedWords') return Array.isArray(value) ? value.map(String).slice(0, 200) : [];
  if (['maxMessages', 'windowSeconds', 'timeoutMinutes'].includes(key)) {
    return Math.min(Math.max(Number(value) || 1, 1), 3600);
  }
  if (key === 'provider') return ['gemini', 'claude', 'openai', 'custom'].includes(value) ? value : 'gemini';
  if (typeof value === 'boolean') return value;
  return String(value ?? '').slice(0, 2000);
}

// Cập nhật cấu hình: chỉ ghi các trường trong whitelist; API key chỉ ghi khi người dùng nhập mới
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
  res.json({ ok: true });
});

export default router;
