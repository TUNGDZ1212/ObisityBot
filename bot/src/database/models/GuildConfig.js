// Schema cấu hình từng server: welcome/goodbye, boost, stats, AI provider/API Key, anti-spam, ticket
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const GuildConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },

    welcome: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: null },
      message: { type: String, default: 'Chào mừng {user} đến với {server}! Bạn là thành viên thứ {membercount}.' },
      useEmbed: { type: Boolean, default: true },
    },

    goodbye: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: null },
      message: { type: String, default: '{username} đã rời khỏi {server}. Hẹn gặp lại!' },
      useEmbed: { type: Boolean, default: true },
    },

    stats: {
      enabled: { type: Boolean, default: false },
      categoryId: { type: String, default: null },
      // Danh sách kênh thống kê đã tạo: kind = members | humans | bots | boosts
      channels: [{ kind: String, channelId: String }],
      template: { type: String, default: '{label}: {count}' },
    },

    boost: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: null },
      message: { type: String, default: '🚀 {user} vừa boost {server}! Hiện có {boosts} boost.' },
    },

    ai: {
      provider: { type: String, enum: ['gemini', 'claude', 'openai', 'custom'], default: 'gemini' },
      model: { type: String, default: '' },
      apiKey: { type: String, default: '' },
      baseUrl: { type: String, default: '' }, // Dùng cho provider custom (OpenAI-compatible)
    },

    antispam: {
      enabled: { type: Boolean, default: false },
      maxMessages: { type: Number, default: 5 },
      windowSeconds: { type: Number, default: 5 },
      timeoutMinutes: { type: Number, default: 5 },
      blockedWords: { type: [String], default: [] },
    },

    ticket: {
      categoryId: { type: String, default: null },
      supportRoleId: { type: String, default: null },
    },
  },
  { timestamps: true },
);

export default model('GuildConfig', GuildConfigSchema);
