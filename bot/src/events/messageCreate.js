// Anti-spam & kiểm duyệt từ khoá: xoá tin chứa từ bị cấm, timeout người gửi quá nhiều tin trong thời gian ngắn.
// Cấu hình được cache 60 giây để không truy vấn DB cho mỗi tin nhắn.
import { PermissionFlagsBits } from 'discord.js';
import GuildConfig from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

export const name = 'messageCreate';

const configCache = new Map(); // guildId -> { at, data }
const history = new Map();     // "guildId:userId" -> mảng timestamp các tin gần đây
const CACHE_MS = 60_000;

async function getAntispamConfig(guildId) {
  const cached = configCache.get(guildId);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  const doc = await GuildConfig.findOne({ guildId }).lean();
  configCache.set(guildId, { at: Date.now(), data: doc?.antispam ?? null });
  return doc?.antispam ?? null;
}

// Gửi thông báo tự xoá sau 5 giây
const notify = (channel, text) =>
  channel.send(text).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});

export async function execute(message) {
  if (!message.guild || message.author.bot) return;
  // Thành viên có quyền Manage Messages được miễn kiểm tra
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const cfg = await getAntispamConfig(message.guild.id);
  if (!cfg?.enabled) return;

  // 1) Kiểm duyệt từ khoá
  const content = message.content.toLowerCase();
  if (cfg.blockedWords?.some((w) => w && content.includes(w.toLowerCase()))) {
    await message.delete().catch(() => {});
    return notify(message.channel, `${message.author}, tin nhắn chứa từ bị cấm.`);
  }

  // 2) Anti-spam theo tốc độ gửi tin
  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const windowMs = cfg.windowSeconds * 1000;
  const times = (history.get(key) ?? []).filter((t) => now - t < windowMs);
  times.push(now);
  history.set(key, times);

  if (times.length > cfg.maxMessages) {
    history.delete(key);
    await message.delete().catch(() => {});
    await message.member?.timeout(cfg.timeoutMinutes * 60_000, 'Anti-spam').catch((err) =>
      logger.warn(`Timeout failed: ${err.message}`),
    );
    notify(message.channel, `${message.author} bị timeout ${cfg.timeoutMinutes} phút do spam.`);
  }
}
