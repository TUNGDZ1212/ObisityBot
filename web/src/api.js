// Helper gọi REST API backend: luôn gửi cookie phiên, tự đóng gói JSON và ném lỗi có thông điệp
export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Thay thế biến {user} {server}... trong nội dung để xem trước (Live Preview)
export function formatPreview(template, vars) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// URL icon server / avatar người dùng từ CDN Discord
export const guildIconUrl = (id, icon, size = 128) =>
  icon ? `https://cdn.discordapp.com/icons/${id}/${icon}.png?size=${size}` : null;
export const userAvatarUrl = (id, avatar, size = 128) =>
  avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=${size}` : null;
