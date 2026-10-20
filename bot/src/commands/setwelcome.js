// Slash command /setwelcome: cấu hình tin nhắn chào mừng khi có thành viên mới
import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import GuildConfig from '../database/models/GuildConfig.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('setwelcome')
  .setDescription('Thiết lập tin nhắn chào mừng thành viên mới')
  .addChannelOption((o) =>
    o.setName('channel').setDescription('Kênh gửi tin chào mừng').addChannelTypes(ChannelType.GuildText).setRequired(true),
  )
  .addStringOption((o) =>
    o.setName('message').setDescription('Nội dung. Biến: {user} {username} {server} {membercount}').setMaxLength(1000),
  )
  .addBooleanOption((o) => o.setName('embed').setDescription('Gửi dưới dạng embed (mặc định: có)'));

export async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ embeds: [errorEmbed('Bạn cần quyền Manage Server.')], flags: MessageFlags.Ephemeral });
  }

  const channel = interaction.options.getChannel('channel', true);
  const message = interaction.options.getString('message');
  const useEmbed = interaction.options.getBoolean('embed') ?? true;

  // Ghi cấu hình; upsert để tạo document nếu server chưa có cấu hình
  const $set = {
    'welcome.enabled': true,
    'welcome.channelId': channel.id,
    'welcome.useEmbed': useEmbed,
  };
  if (message) $set['welcome.message'] = message;
  await GuildConfig.updateOne({ guildId: interaction.guildId }, { $set }, { upsert: true });

  return interaction.reply({
    embeds: [successEmbed(`Đã bật chào mừng tại ${channel}.\nNội dung: ${message ?? '(giữ nguyên mẫu cũ)'}`)],
    flags: MessageFlags.Ephemeral,
  });
}
