// Anti-spam, kiểm duyệt từ khoá & AI Auto-responder khi Ping Bot
import { PermissionFlagsBits } from 'discord.js';
import GuildConfig from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';
// TODO: Sửa lại đường dẫn import này cho đúng với vị trí file AI thực tế trong dự án (ví dụ: ../commands/setupai.js)
import { generateAIResponse } from '../services/aiService.js'; 

export const name = 'messageCreate';

const configCache = new Map();
const history = new Map();
const CACHE_MS = 60_000;

async function getGuildConfig(guildId) {
  const cached = configCache.get(guildId);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  const doc = await GuildConfig.findOne({ guildId }).lean();
  configCache.set(guildId, { at: Date.now(), data: doc });
  return doc;
}

const notify = (channel, text) =>
  channel.send(text).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});

export async function execute(message) {
  if (!message.guild || message.author.bot) return;

  const doc = await getGuildConfig(message.guild.id);
  const cfg = doc?.antispam ?? null;
  const isExempt = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);

  // 1 & 2) Kiểm duyệt từ khóa & Anti-spam
  if (cfg?.enabled && !isExempt) {
    const content = message.content.toLowerCase();
    if (cfg.blockedWords?.some((w) => w && content.includes(w.toLowerCase()))) {
      await message.delete().catch(() => {});
      return notify(message.channel, `${message.author}, tin nhắn chứa từ bị cấm.`);
    }

    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const windowMs = (cfg.windowSeconds || 5) * 1000;
    const times = (history.get(key) ?? []).filter((t) => now - t < windowMs);
    times.push(now);
    history.set(key, times);

    if (times.length > cfg.maxMessages) {
      history.delete(key);
      await message.delete().catch(() => {});
      await message.member?.timeout(cfg.timeoutMinutes * 60_000, 'Anti-spam').catch((err) =>
        logger.warn(`Timeout failed: ${err.message}`),
      );
      return notify(message.channel, `${message.author} bị timeout ${cfg.timeoutMinutes} phút do spam.`);
    }
  }

  // 3) Xử lý AI khi người dùng Ping (@Bot)
  if (message.mentions.has(message.client.user)) {
    const prompt = message.content
      .replace(`<@${message.client.user.id}>`, '')
      .replace(`<@!${message.client.user.id}>`, '')
      .trim();

    if (!prompt) {
      return message.reply('Bạn cần mình hỗ trợ gì thế? Hãy nhắn câu hỏi kèm lượt ping nhé!');
    }

    try {
      await message.channel.sendTyping();
      const response = await generateAIResponse(prompt, message.guild.id);
      await message.reply(response);
    } catch (err) {
      logger.error(`[AI Mention Error]: ${err.message}`);
      await message.reply('Đã xảy ra lỗi khi xử lý câu hỏi AI của bạn.');
    }
  }
}
