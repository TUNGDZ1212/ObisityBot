// Express Server chính cho Web Dashboard
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Bật trust proxy cho Render
app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/bot', botStatusRoutes);
app.use('/api/guilds', guildRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

const dist = path.join(__dirname, '../dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(err.status ?? 500).json({ error: err.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR' });
});

const PORT = Number(process.env.PORT) || 4000;

if (!process.env.MONGO_URI) {
  console.error('[ERROR] Vẫn chưa nạp được MONGO_URI!');
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
