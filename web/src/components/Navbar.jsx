// Thanh điều hướng trên cùng: trạng thái bot realtime (online/offline, ping, số server),
// chọn ngôn ngữ Việt/Anh và đăng nhập / đăng xuất Discord OAuth2
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, userAvatarUrl } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, tr } = useLanguage();
  const [status, setStatus] = useState(null);

  // Polling trạng thái bot mỗi 15 giây
  useEffect(() => {
    let alive = true;
    const load = () => api('/bot/status').then((d) => alive && setStatus(d)).catch(() => alive && setStatus(null));
    load();
    const id = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const online = Boolean(status?.online);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-4 z-40 mx-4 mt-4 glass px-5 py-3 flex flex-wrap items-center justify-between gap-4"
    >
      <Link to="/" className="text-lg font-extrabold bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
        Discord System
      </Link>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          {online ? tr('Trực tuyến', 'Online') : tr('Ngoại tuyến', 'Offline')}
        </span>
        <span>🏓 {status?.ping ?? '--'} ms</span>
        <span>🌐 {status?.guildCount ?? 0} {tr('Server', 'Servers')}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex overflow-hidden rounded-xl border border-white/20 text-xs">
          {['vi', 'en'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 transition ${lang === l ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {user ? (
          <>
            {userAvatarUrl(user.id, user.avatar, 64) ? (
              <img src={userAvatarUrl(user.id, user.avatar, 64)} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-violet-500/50" />
            )}
            <span className="hidden md:inline text-sm">{user.global_name || user.username}</span>
            <button onClick={logout} className="btn-ghost text-sm">{tr('Đăng xuất', 'Logout')}</button>
          </>
        ) : (
          <a href="/api/auth/discord" className="btn-primary text-sm">
            {tr('Đăng nhập Discord', 'Login with Discord')}
          </a>
        )}
      </div>
    </motion.header>
  );
}
