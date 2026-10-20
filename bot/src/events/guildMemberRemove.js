// Sự kiện thành viên rời server: gửi thông báo tạm biệt và cập nhật kênh thống kê
import GuildConfig from '../database/models/GuildConfig.js';
import { buildAnnouncement } from '../utils/embeds.js';
import { updateGuildStats } from '../utils/stats.js';
import { logger } from '../utils/logger.js';

export const name = 'guildMemberRemove';

export async function execute(member) {
  const config = await GuildConfig.findOne({ guildId: member.guild.id }).lean();

  if (config?.goodbye?.enabled && config.goodbye.channelId) {
    const channel = member.guild.channels.cache.get(config.goodbye.channelId);
    if (channel?.isTextBased()) {
      const payload = buildAnnouncement(
        config.goodbye.message,
        config.goodbye.useEmbed,
        {
          user: member.user?.username ?? 'Thành viên',
          username: member.user?.username ?? 'Thành viên',
          server: member.guild.name,
          membercount: member.guild.memberCount,
          boosts: member.guild.premiumSubscriptionCount ?? 0,
          avatar: member.user?.displayAvatarURL?.({ size: 256 }),
        },
        { title: '👋 Tạm biệt', color: 0xf97316 },
      );
      await channel.send(payload).catch((err) => logger.warn(`Goodbye send failed: ${err.message}`));
    }
  }

  await updateGuildStats(member.guild);
}
