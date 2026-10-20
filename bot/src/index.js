// Entry point của Discord Bot: kết nối MongoDB, nạp commands/events, đăng nhập Discord
// và định kỳ ghi trạng thái bot vào collection "botstatuses" để Web Dashboard đọc realtime.
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { connectDatabase, getDb } from './database/connect.js';
import { logger } from './utils/logger.js';
import { refreshAllStats } from './utils/stats.js';

// Cấu hình đường dẫn tuyệt đối tới file .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Intents: GuildMembers và MessageContent là Privileged, phải bật trong Developer Portal
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// Nạp toàn bộ slash commands từ thư mục commands/ (mỗi file export { data, execute })
async function loadCommands() {
  const dir = path.join(__dirname, 'commands');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    client.commands.set(mod.data.name, mod);
  }
  logger.info(`Loaded ${client.commands.size} commands`);
}

// Nạp toàn bộ event handlers từ thư mục events/ (mỗi file export { name, execute, once? })
async function loadEvents() {
  const dir = path.join(__dirname, 'events');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    const handler = (...args) => mod.execute(...args, client);
    if (mod.once) client.once(mod.name, handler);
    else client.on(mod.name, handler);
  }
}

// Ghi trạng thái bot: ping, số server, danh sách server + kênh văn bản để Dashboard hiển thị
async function reportStatus(online = true) {
  const db = getDb();
  if (!db) return;
  const guilds = client.guilds.cache.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    memberCount: g.memberCount,
    boosts: g.premiumSubscriptionCount ?? 0,
    // Chỉ lấy kênh text (0) và announcement (5) để Dashboard chọn kênh gửi tin
    channels: g.channels.cache
      .filter((c) => c.type === 0 || c.type === 5)
      .map((c) => ({ id: c.id, name: c.name }))
      .slice(0, 300),
  }));
  await db
    .collection('botstatuses')
    .updateOne(
      { _id: 'main' },
      {
        $set: {
          online,
          ping: Math.round(client.ws.ping),
          guildCount: guilds.length,
          guilds,
          clientId: client.user?.id ?? process.env.CLIENT_ID,
          botTag: client.user?.tag ?? null,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )
    .catch((err) => logger.error('reportStatus failed', err));
}

client.once('ready', () => {
  logger.info(`Logged in as ${client.user.tag}`);

  // Đăng ký slash commands toàn cục (Discord có thể mất tới ~1 giờ để hiển thị)
  client.application.commands
    .set(client.commands.map((c) => c.data.toJSON()))
    .then(() => logger.info('Slash commands registered'))
    .catch((err) => logger.error('Register commands failed', err));

  reportStatus(true);
  setInterval(() => reportStatus(true), Number(process.env.STATUS_INTERVAL_MS) || 30_000);
  setInterval(() => refreshAllStats(client), Number(process.env.STATS_INTERVAL_MS) || 600_000);
});

// Tắt an toàn: đánh dấu offline trước khi thoát
async function shutdown() {
  logger.info('Shutting down...');
  await reportStatus(false);
  client.destroy();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', err));

(async () => {
  await connectDatabase(process.env.MONGO_URI);
  await loadCommands();
  await loadEvents();
  await client.login(process.env.DISCORD_TOKEN);
})().catch((err) => {
  logger.error('Failed to start bot', err);
  process.exit(1);
});