// Dispatch slash commands tới file tương ứng và xử lý nút bấm hệ thống ticket (ticket:open / ticket:close)
import {
  ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} from 'discord.js';
import GuildConfig from '../database/models/GuildConfig.js';
import { baseEmbed, errorEmbed, successEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

export const name = 'interactionCreate';

export async function execute(interaction, client) {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (err) {
      logger.error(`Command /${interaction.commandName} failed`, err);
      const payload = { embeds: [errorEmbed('Đã có lỗi xảy ra khi thực thi lệnh.')], flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
      else await interaction.reply(payload).catch(() => {});
    }
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'ticket:open') return openTicket(interaction);
    if (interaction.customId === 'ticket:close') return closeTicket(interaction);
  }
}

// Tạo kênh ticket riêng: chỉ người mở, support role và bot được xem
async function openTicket(interaction) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId }).lean();
  const categoryId = config?.ticket?.categoryId;
  if (!categoryId) {
    return interaction.reply({ embeds: [errorEmbed('Hệ thống ticket chưa được thiết lập.')], flags: MessageFlags.Ephemeral });
  }

  // Mỗi người chỉ mở một ticket: topic của kênh lưu userId chủ ticket
  const existing = interaction.guild.channels.cache.find(
    (c) => c.parentId === categoryId && c.topic === interaction.user.id,
  );
  if (existing) {
    return interaction.reply({ content: `Bạn đã có ticket: ${existing}`, flags: MessageFlags.Ephemeral });
  }

  const view = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory];
  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: view },
    { id: interaction.client.user.id, allow: [...view, PermissionFlagsBits.ManageChannels] },
  ];
  if (config.ticket.supportRoleId) overwrites.push({ id: config.ticket.supportRoleId, allow: view });

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    parent: categoryId,
    topic: interaction.user.id,
    permissionOverwrites: overwrites,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:close').setLabel('🔒 Đóng ticket').setStyle(ButtonStyle.Danger),
  );
  await channel.send({
    content: `${interaction.user}`,
    embeds: [baseEmbed({ title: '🎫 Ticket đã được mở', description: 'Hãy mô tả vấn đề, đội ngũ hỗ trợ sẽ phản hồi sớm nhất.' })],
    components: [row],
  });
  return interaction.reply({ content: `Đã tạo ticket: ${channel}`, flags: MessageFlags.Ephemeral });
}

// Đóng ticket: chỉ chủ ticket hoặc người có quyền Manage Channels
async function closeTicket(interaction) {
  const isOwner = interaction.channel?.topic === interaction.user.id;
  const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
  if (!isOwner && !canManage) {
    return interaction.reply({ embeds: [errorEmbed('Bạn không có quyền đóng ticket này.')], flags: MessageFlags.Ephemeral });
  }
  await interaction.reply({ embeds: [successEmbed('Ticket sẽ bị xoá sau 5 giây.')] });
  setTimeout(() => interaction.channel.delete('Ticket closed').catch(() => {}), 5000);
}
