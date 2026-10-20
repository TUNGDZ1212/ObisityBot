// Trạng thái bot realtime: bot ghi vào collection botstatuses, API này đọc và xác định online/offline
// (coi là offline nếu lần cập nhật cuối cách hiện tại quá 90 giây).
import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();
const STALE_MS = 90_000;

router.get('/status', async (req, res) => {
  const doc = await mongoose.connection.db.collection('botstatuses').findOne({ _id: 'main' });
  const fresh = doc?.updatedAt && Date.now() - new Date(doc.updatedAt).getTime() < STALE_MS;

  res.json({
    online: Boolean(doc?.online && fresh),
    ping: doc?.ping ?? null,
    guildCount: doc?.guildCount ?? 0,
    clientId: doc?.clientId ?? process.env.CLIENT_ID,
    botTag: doc?.botTag ?? null,
    updatedAt: doc?.updatedAt ?? null,
  });
});

export default router;
