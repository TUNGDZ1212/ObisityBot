// Logger đơn giản có mức độ (error < warn < info < debug), ghi timestamp chuẩn ISO
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function write(level, message, extra) {
  if (LEVELS[level] > current) return;
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  const out = level === 'error' ? console.error : console.log;
  if (extra !== undefined) out(line, extra);
  else out(line);
}

export const logger = {
  error: (msg, extra) => write('error', msg, extra),
  warn: (msg, extra) => write('warn', msg, extra),
  info: (msg, extra) => write('info', msg, extra),
  debug: (msg, extra) => write('debug', msg, extra),
};
