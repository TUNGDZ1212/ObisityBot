// Slash command /aisetup: AI Server Manager. Admin mô tả bằng ngôn ngữ tự nhiên, AI sinh kế hoạch JSON,
// bot kiểm tra an toàn rồi thực thi: tạo danh mục/kênh/role, hệ thống ticket, anti-spam, từ khoá cấm, slowmode.
import {
  SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import GuildConfig from '../database/models/GuildConfig.js';
import { generatePlan } from '../ai/aiManager.js';
import { baseEmbed, errorEmbed, successEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

const MAX_ACTIONS = 25;
const CHANNEL_TYPES = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
};
// Không cho AI cấp quyền Administrator để tránh leo thang đặc quyền
const SAFE_PERMISSIONS = Object.keys(PermissionFlagsBits).filter((p) => p !== 'Administrator');

export const data = new SlashCommandBuilder()
  .setName('aisetup')
  .setDescription('AI Server Manager: mô tả bằng ngôn ngữ tự nhiên để AI tự cấu hình server')
  .addStringOption((o) =>
    o.setName('prompt').setDescription('Ví dụ: tạo ticket hỗ trợ, role Mod và bật anti-spam').setRequired(true).setMaxLength(1000),
  );

export async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ embeds: [errorEmbed('Lệnh này yêu cầu quyền Administrator.')], flags: MessageFlags.Ephemeral });
  }

  const config = await GuildConfig.findOne({ guildId: interaction.guildId }).lean();
  if (!config?.ai?.apiKey) {
    return interaction.reply({
      embeds: [errorEmbed('Chưa có API Key. Hãy cấu hình tại Dashboard > AI Settings.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const guild = interaction.guild;
    const context = {
      channels: guild.channels.cache.map((c) => c.name).slice(0, 100),
      roles: guild.roles.cache.map((r) => r.name).slice(0, 100),
    };
    const plan = await generatePlan(config, interaction.options.getString('prompt'), context);
    const actions = Array.isArray(plan.actions) ? plan.actions.slice(0, MAX_ACTIONS) : [];
    const log = await executePlan(guild, actions);

    return interaction.editReply({
      embeds: [successEmbed(log.length ? log.join('\n').slice(0, 4000) : 'AI không đề xuất thay đổi nào.')],
    });
  } catch (err) {
    logger.error('aisetup failed', err);
    return interaction.editReply({ embeds: [errorEmbed(`Lỗi: ${err.message}`)] });
  }
}

// Thực thi danh sách action. Sắp xếp: danh mục trước, role sau, còn lại cuối cùng.
export async function executePlan(guild, actions) {
  const log = [];
  const categories = new Map();
  const roles = new Map();
  const order = { createCategory: 0, createRole: 1 };
  const sorted = [...actions].sort((a, b) => (order[a.type] ?? 2) - (order[b.type] ?? 2));

  for (const action of sorted) {
    try {
      switch (action.type) {
        case 'createCategory': {
          const cat = await guild.channels.create({ name: clean(action.name, 100), type: ChannelType.GuildCategory });
          categories.set(cat.name, cat);
          log.push(`📁 Danh mục **${cat.name}**`);
          break;
        }
        case 'createRole': {
          const role = await guild.roles.create({
            name: clean(action.name, 100),
            color: action.color || undefined,
            hoist: Boolean(action.hoist),
            permissions: (action.permissions ?? []).filter((p) => SAFE_PERMISSIONS.includes(p)),
            reason: 'AI Server Manager',
          });
          roles.set(role.name, role);
          log.push(`🎖️ Role **${role.name}**`);
          break;
        }
        case 'createChannel': {
          const parent = findCategory(guild, categories, action.category);
          const ch = await guild.channels.create({
            name: clean(action.name, 100),
            type: CHANNEL_TYPES[action.channelType] ?? ChannelType.GuildText,
            parent: parent?.id,
            topic: action.topic ? clean(action.topic, 1000) : undefined,
            permissionOverwrites: action.private
              ? [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }]
              : [],
          });
          log.push(`📝 Kênh **${ch.name}**`);
          break;
        }
        case 'createTicketSystem': {
          const cat = await guild.channels.create({
            name: clean(action.categoryName || '🎫 Tickets', 100),
            type: ChannelType.GuildCategory,
          });
          const support = action.supportRole
            ? roles.get(action.supportRole) ?? guild.roles.cache.find((r) => r.name === action.supportRole)
            : null;
          // Kênh panel: mọi người xem được nhưng không gửi tin
          const panel = await guild.channels.create({
            name: clean(action.channelName || 'ticket-support', 100),
            type: ChannelType.GuildText,
            parent: cat.id,
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages],
              },
            ],
          });
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket:open').setLabel('🎫 Mở ticket').setStyle(ButtonStyle.Primary),
          );
          await panel.send({
            embeds: [baseEmbed({ title: '🎫 Hỗ trợ', description: 'Nhấn nút bên dưới để mở ticket riêng với đội ngũ hỗ trợ.' })],
            components: [row],
          });
          // Lưu thông tin ticket để interactionCreate dùng khi người dùng mở ticket
          await GuildConfig.updateOne(
            { guildId: guild.id },
            { $set: { 'ticket.categoryId': cat.id, 'ticket.supportRoleId': support?.id ?? null } },
            { upsert: true },
          );
          log.push(`🎫 Hệ thống ticket tại **${panel.name}**`);
          break;
        }
        case 'setAntispam':
          await GuildConfig.updateOne(
            { guildId: guild.id },
            {
              $set: {
                'antispam.enabled': Boolean(action.enabled),
                'antispam.maxMessages': clampNum(action.maxMessages, 2, 50, 5),
                'antispam.windowSeconds': clampNum(action.windowSeconds, 1, 60, 5),
                'antispam.timeoutMinutes': clampNum(action.timeoutMinutes, 1, 40320, 5),
              },
            },
            { upsert: true },
          );
          log.push(`🛡️ Anti-spam ${action.enabled ? 'đã bật' : 'đã tắt'}`);
          break;
        case 'setBlockedWords': {
          const words = (action.words ?? []).map(String).slice(0, 200);
          await GuildConfig.updateOne({ guildId: guild.id }, { $set: { 'antispam.blockedWords': words } }, { upsert: true });
          log.push(`🚫 Từ khoá bị cấm: ${words.length}`);
          break;
        }
        case 'setSlowmode': {
          const ch = guild.channels.cache.find((c) => c.name === action.channel);
          if (!ch?.setRateLimitPerUser) throw new Error(`không tìm thấy kênh ${action.channel}`);
          await ch.setRateLimitPerUser(clampNum(action.seconds, 0, 21600, 0));
          log.push(`🐢 Slowmode #${ch.name}`);
          break;
        }
        default:
          log.push(`⚠️ Bỏ qua action không hỗ trợ: ${action.type}`);
      }
    } catch (err) {
      log.push(`⚠️ ${action.type}: ${err.message}`);
    }
  }
  return log;
}

// Helpers nội bộ
const clean = (s, max) => String(s ?? '').trim().slice(0, max) || 'new';
const clampNum = (v, min, max, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
};
function findCategory(guild, categories, name) {
  if (!name) return null;
  return (
    categories.get(name) ??
    guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === name) ??
    null
  );
}
