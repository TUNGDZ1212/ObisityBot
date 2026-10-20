// Cập nhật realtime các kênh thống kê (Server Stats). Discord giới hạn đổi tên kênh 2 lần / 10 phút
// nên có throttle 5 phút cho mỗi server, và hàm refreshAllStats ép cập nhật theo chu kỳ.
import GuildConfig from '../database/models/GuildConfig.js';
import { formatTemplate } from './embeds.js';
import { logger } from './logger.js';

// Các loại thống kê hỗ trợ. humans/bots dựa trên member cache (cần intent GuildMembers)
const KINDS = {
  members: { label: '👥 Members', value: (g) => g.memberCount },
  humans: { label: '🧑 Humans', value: (g) => g.members.cache.filter((m) => !m.user.bot).size },
  bots: { label: '🤖 Bots', value: (g) => g.members.cache.filter((m) => m.user.bot).size },
  boosts: { label: '🚀 Boosts', value: (g) => g.premiumSubscriptionCount ?? 0 },
};

export const STAT_KINDS = Object.keys(KINDS);
export const statLabel = (kind) => KINDS[kind]?.label ?? kind;

const lastUpdate = new Map(); // guildId -> timestamp lần cập nhật gần nhất
const THROTTLE_MS = 5 * 60_000;

export async function updateGuildStats(guild, { force = false } = {}) {
  const config = await GuildConfig.findOne({ guildId: guild.id }).lean();
  if (!config?.stats?.enabled || !config.stats.channels?.length) return;

  const now = Date.now();
  if (!force && now - (lastUpdate.get(guild.id) ?? 0) < THROTTLE_MS) return;
  lastUpdate.set(guild.id, now);

  const template = config.stats.template || '{label}: {count}';
  for (const entry of config.stats.channels) {
    const kind = KINDS[entry.kind];
    const channel = guild.channels.cache.get(entry.channelId);
    if (!kind || !channel) continue;
    const name = formatTemplate(template, { label: kind.label, count: kind.value(guild) }).slice(0, 100);
    if (channel.name !== name) {
      await channel.setName(name, 'Server stats update').catch((err) => logger.warn(`setName failed: ${err.message}`));
    }
  }
}

export async function refreshAllStats(client) {
  for (const guild of client.guilds.cache.values()) {
    await updateGuildStats(guild, { force: true });
  }
}
