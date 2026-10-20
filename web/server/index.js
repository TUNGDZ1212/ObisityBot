// Express Server chính cho Web Dashboard: REST API (auth, bot status, guilds) và phục vụ build frontend khi production
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import botStatusRoutes from './routes/botStatus.js';
import guildRoutes from './routes/guilds.js';

// Cấu hình chỉ định chính xác đường dẫn tới file web/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// BẮT BUỘC KHI DEPLOY LÊN RENDER: Giúp Express nhận diện đúng HTTPS và Cookie Secure từ Reverse Proxy
app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/bot', botStatusRoutes);
app.use('/api/guilds', guildRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Production: phục vụ thư mục dist của Vite và fallback về index.html cho SPA routing
const dist = path.join(__dirname, '../dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// Xử lý lỗi tập trung. Express 5 tự chuyển lỗi từ async handler vào đây
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(err.status ?? 500).json({ error: err.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR' });
});

const PORT = Number(process.env.PORT) || 4000;

if (!process.env.MONGO_URI) {
  console.error('[ERROR] Vẫn chưa nạp được MONGO_URI từ file .env!');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[DB] MongoDB connected');
    app.listen(PORT, () => console.log(`[WEB] API server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  });
