// Sự kiện cập nhật thành viên: phát hiện khi thành viên BẮT ĐẦU boost server (premiumSince từ null -> có giá trị)
import GuildConfig from '../database/models/GuildConfig.js';
import { buildAnnouncement } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

export const name = 'guildMemberUpdate';

export async function execute(oldMember, newMember) {
  // Chỉ xử lý khi vừa bắt đầu boost, bỏ qua các thay đổi khác
  if (oldMember.premiumSince || !newMember.premiumSince) return;

  const config = await GuildConfig.findOne({ guildId: newMember.guild.id }).lean();
  if (!config?.boost?.enabled || !config.boost.channelId) return;

  const channel = newMember.guild.channels.cache.get(config.boost.channelId);
  if (!channel?.isTextBased()) return;

  const payload = buildAnnouncement(
    config.boost.message,
    true,
    {
      user: `<@${newMember.id}>`,
      username: newMember.user.username,
      server: newMember.guild.name,
      boosts: newMember.guild.premiumSubscriptionCount ?? 0,
      membercount: newMember.guild.memberCount,
      avatar: newMember.user.displayAvatarURL({ size: 256 }),
    },
    { title: '🚀 Server Boost!', color: 0xf472b6 },
  );
  await channel.send(payload).catch((err) => logger.warn(`Boost notify failed: ${err.message}`));
}
