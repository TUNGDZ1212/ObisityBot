// Slash command /setstats: tạo danh mục + các kênh voice thống kê (members, humans, bots, boosts)
// tự cập nhật số liệu, tương tự ServerStats bot. Kênh được khoá Connect để không ai join.
import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import GuildConfig from '../database/models/GuildConfig.js';
import { errorEmbed, successEmbed, formatTemplate } from '../utils/embeds.js';
import { STAT_KINDS, statLabel, updateGuildStats } from '../utils/stats.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('setstats')
  .setDescription('Tạo kênh thống kê server tự cập nhật realtime')
  .addStringOption((o) =>
    o.setName('template').setDescription('Mẫu tên kênh. Dùng {label} và {count}').setMaxLength(80),
  );

export async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ embeds: [errorEmbed('Bạn cần quyền Manage Server.')], flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = interaction.guild;
  const template = interaction.options.getString('template') || '{label}: {count}';

  try {
    // Xoá các kênh thống kê cũ trước khi tạo lại
    const old = await GuildConfig.findOne({ guildId: guild.id }).lean();
    for (const ch of old?.stats?.channels ?? []) {
      await guild.channels.cache.get(ch.channelId)?.delete('Refresh stats').catch(() => {});
    }
    if (old?.stats?.categoryId) {
      await guild.channels.cache.get(old.stats.categoryId)?.delete('Refresh stats').catch(() => {});
    }

    const category = await guild.channels.create({ name: '📊 SERVER STATS', type: ChannelType.GuildCategory });
    const created = [];
    for (const kind of STAT_KINDS) {
      const ch = await guild.channels.create({
        name: formatTemplate(template, { label: statLabel(kind), count: '…' }).slice(0, 100),
        type: ChannelType.GuildVoice,
        parent: category.id,
        // Khoá Connect cho @everyone (guild.id = id của role everyone)
        permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.Connect] }],
      });
      created.push({ kind, channelId: ch.id });
    }

    await GuildConfig.updateOne(
      { guildId: guild.id },
      { $set: { 'stats.enabled': true, 'stats.categoryId': category.id, 'stats.channels': created, 'stats.template': template } },
      { upsert: true },
    );
    await updateGuildStats(guild, { force: true });

    return interaction.editReply({
      embeds: [successEmbed(`Đã tạo ${created.length} kênh thống kê trong **${category.name}**.\nCập nhật tự động mỗi 10 phút và khi có người vào/rời server.`)],
    });
  } catch (err) {
    logger.error('setstats failed', err);
    return interaction.editReply({ embeds: [errorEmbed(`Không thể tạo kênh: ${err.message}`)] });
  }
}
