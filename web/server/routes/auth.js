// Discord OAuth2 Login / Session
import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const router = Router();
const API = 'https://discord.com/api/v10';
const SESSION_COOKIE = 'session';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

const getRedirectUri = () => {
  const baseUrl = process.env.SERVER_URL?.replace(/\/$/, '') || '';
  return `${baseUrl}/api/auth/callback`;
};

export function getSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Bước 1: Redirect sang Discord OAuth2
router.get('/discord', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    sameSite: 'lax', 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 10 * 60 * 1000 
  });

  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'identify guilds',
    state,
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

// Bước 2: Nhận Callback và Đổi Code lấy Token
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies?.oauth_state;

    if (!code || !state || (savedState && state !== savedState)) {
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
        code: String(code),
        redirect_uri: getRedirectUri(),
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('[OAuth2 Error Details]:', errorText);
      return res.status(401).send('Token exchange failed');
    }

    const { access_token } = await tokenRes.json();

    const meRes = await fetch(`${API}/users/@me`, { 
      headers: { Authorization: `Bearer ${access_token}` } 
    });
    
    if (!meRes.ok) return res.status(401).send('Failed to fetch user profile from Discord');

    const me = await meRes.json();
    const user = { id: me.id, username: me.username, global_name: me.global_name, avatar: me.avatar };

    const token = jwt.sign({ user, accessToken: access_token }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie(SESSION_COOKIE, token, { 
      httpOnly: true, 
      sameSite: 'lax', 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: SESSION_TTL 
    });

    const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '') || '';
    res.redirect(`${clientUrl}/servers`);
  } catch (err) {
    console.error('[OAuth2 Callback Error]:', err);
    next(err);
  }
});

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
