// Slash command /setgoodbye: cấu hình thông báo khi thành viên rời server
import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import GuildConfig from '../database/models/GuildConfig.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('setgoodbye')
  .setDescription('Thiết lập thông báo khi thành viên rời server')
  .addChannelOption((o) =>
    o.setName('channel').setDescription('Kênh gửi thông báo').addChannelTypes(ChannelType.GuildText).setRequired(true),
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

  const $set = {
    'goodbye.enabled': true,
    'goodbye.channelId': channel.id,
    'goodbye.useEmbed': useEmbed,
  };
  if (message) $set['goodbye.message'] = message;
  await GuildConfig.updateOne({ guildId: interaction.guildId }, { $set }, { upsert: true });

  return interaction.reply({
    embeds: [successEmbed(`Đã bật thông báo tạm biệt tại ${channel}.`)],
    flags: MessageFlags.Ephemeral,
  });
}
