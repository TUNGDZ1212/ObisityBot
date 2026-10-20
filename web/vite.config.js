// Cấu hình Vite: plugin React và proxy /api sang Express server để tránh lỗi CORS khi phát triển
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000', // Đã đổi localhost sang 127.0.0.1
        changeOrigin: true,
      },
    },
  },
});