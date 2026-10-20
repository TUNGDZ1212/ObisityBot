// Discord OAuth2 Login / Session. Phiên đăng nhập lưu trong cookie httpOnly chứa JWT (user + access token Discord).
import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const router = Router();
const API = 'https://discord.com/api/v10';
const SESSION_COOKIE = 'session';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const isProd = process.env.NODE_ENV === 'production';
const redirectUri = () => `${process.env.SERVER_URL}/api/auth/callback`;

// Đọc và xác thực JWT phiên từ cookie. Trả về null nếu không hợp lệ.
export function getSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Bước 1: chuyển người dùng sang trang cấp quyền của Discord, kèm state chống CSRF
router.get('/discord', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'identify guilds',
    state,
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// Bước 2: Discord redirect về đây với code, đổi code lấy access token và tạo phiên
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state || state !== req.cookies?.oauth_state) {
      return res.status(400).send('Invalid OAuth state');
    }
    res.clearCookie('oauth_state');

    const tokenRes = await fetch(`${API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri(),
      }),
    });
    if (!tokenRes.ok) return res.status(401).send('Token exchange failed');
    const { access_token } = await tokenRes.json();

    const me = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bearer ${access_token}` } }).then((r) => r.json());
    const user = { id: me.id, username: me.username, global_name: me.global_name, avatar: me.avatar };

    const token = jwt.sign({ user, accessToken: access_token }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: SESSION_TTL });
    res.redirect(`${process.env.CLIENT_URL}/servers`);
  } catch (err) {
    next(err);
  }
});

// Trả thông tin người dùng hiện tại (dùng cho AuthContext ở frontend)
router.get('/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  res.json(session.user);
});

router.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

export default router;
