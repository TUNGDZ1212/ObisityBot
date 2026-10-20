// Kết nối MongoDB bằng Mongoose và cung cấp getDb() để truy cập collection trực tiếp (ví dụ botstatuses)
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDatabase(uri) {
  if (!uri) throw new Error('Thiếu MONGO_URI trong .env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info('MongoDB connected');
}

// Trả về native Db driver khi đã kết nối, ngược lại trả về null
export function getDb() {
  return mongoose.connection.readyState === 1 ? mongoose.connection.db : null;
}
