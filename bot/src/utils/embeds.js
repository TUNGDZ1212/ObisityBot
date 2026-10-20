// Tiện ích tạo Discord Embed chuẩn hoá, thay thế placeholder trong tin nhắn và build payload thông báo
import { EmbedBuilder } from 'discord.js';

export const BRAND_COLOR = 0x7c5cff;

// Embed cơ bản: tiêu đề, mô tả, màu, thumbnail, footer
export function baseEmbed({ title, description, color = BRAND_COLOR, thumbnail, footer = 'Discord System' } = {}) {
  const embed = new EmbedBuilder().setColor(color).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

export const successEmbed = (description) => baseEmbed({ title: '✅ Thành công', description, color: 0x22c55e });
export const errorEmbed = (description) => baseEmbed({ title: '❌ Lỗi', description, color: 0xef4444 });

// Thay thế {key} bằng giá trị trong vars; placeholder không khớp thì giữ nguyên
export function formatTemplate(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

// Tạo payload gửi tin: dạng embed hoặc plain text tuỳ cấu hình
export function buildAnnouncement(template, useEmbed, vars, { title, color } = {}) {
  const text = formatTemplate(template, vars);
  if (!useEmbed) return { content: text };
  return { embeds: [baseEmbed({ title, description: text, color, thumbnail: vars.avatar })] };
}
