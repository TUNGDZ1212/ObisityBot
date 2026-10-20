// Màn hình chọn server: hiển thị các server user là Administrator, có tìm kiếm.
// Bot đã có mặt -> nút Manage; chưa có -> nút Invite (link mời bot với quyền Administrator).
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api.js';
import ServerCard from '../components/ServerCard.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function ServerPicker() {
  const { tr } = useLanguage();
  const [guilds, setGuilds] = useState(null);
  const [clientId, setClientId] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/guilds'), api('/bot/status')])
      .then(([g, s]) => {
        setGuilds(g);
        setClientId(s.clientId || '');
      })
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(
    () => (guilds ?? []).filter((g) => g.name.toLowerCase().includes(query.toLowerCase())),
    [guilds, query],
  );

  // Link mời bot: quyền Administrator (permissions=8), scope bot + slash commands
  const inviteUrl = (id) =>
    `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${id}&disable_guild_select=true`;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{tr('Server của bạn', 'Your servers')}</h1>
          <p className="opacity-70">{tr('Chỉ hiển thị các server bạn có quyền Administrator.', 'Only servers where you have Administrator permission are shown.')}</p>
        </div>
        <input className="glass-input md:w-72" placeholder={tr('Tìm server...', 'Search servers...')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </motion.div>

      {error && <div className="glass p-4 text-red-300">⚠️ {error}</div>}
      {!guilds && !error && <p className="opacity-70 text-center py-10">{tr('Đang tải danh sách server...', 'Loading servers...')}</p>}
      {guilds && filtered.length === 0 && <p className="opacity-70 text-center py-10">{tr('Không tìm thấy server nào.', 'No servers found.')}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((g, i) => (
          <ServerCard key={g.id} guild={g} index={i} inviteUrl={inviteUrl(g.id)} />
        ))}
      </div>
    </div>
  );
}
