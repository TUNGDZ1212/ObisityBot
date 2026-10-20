// Sự kiện thành viên mới: gửi tin chào mừng và cập nhật kênh thống kê server
import GuildConfig from '../database/models/GuildConfig.js';
import { buildAnnouncement } from '../utils/embeds.js';
import { updateGuildStats } from '../utils/stats.js';
import { logger } from '../utils/logger.js';

export const name = 'guildMemberAdd';

export async function execute(member) {
  const config = await GuildConfig.findOne({ guildId: member.guild.id }).lean();

  if (config?.welcome?.enabled && config.welcome.channelId) {
    const channel = member.guild.channels.cache.get(config.welcome.channelId);
    if (channel?.isTextBased()) {
      const payload = buildAnnouncement(
        config.welcome.message,
        config.welcome.useEmbed,
        {
          user: `<@${member.id}>`,
          username: member.user.username,
          server: member.guild.name,
          membercount: member.guild.memberCount,
          boosts: member.guild.premiumSubscriptionCount ?? 0,
          avatar: member.user.displayAvatarURL({ size: 256 }),
        },
        { title: '👋 Chào mừng!', color: 0x4ade80 },
      );
      await channel.send(payload).catch((err) => logger.warn(`Welcome send failed: ${err.message}`));
    }
  }

  await updateGuildStats(member.guild);
}
