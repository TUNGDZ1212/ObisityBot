// Module Server Boost: thông báo khi có thành viên boost server, kèm Live Preview
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPreview } from '../api.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function BoostModule() {
  const { guildId } = useParams();
  const { tr } = useLanguage();
  const [boost, setBoost] = useState(null);
  const [channels, setChannels] = useState([]);
  const [guildName, setGuildName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api(`/guilds/${guildId}/config`), api(`/guilds/${guildId}/overview`)]).then(([c, o]) => {
      setBoost(c.boost);
      setChannels(o.channels);
      setGuildName(o.guild.name);
    });
  }, [guildId]);

  if (!boost) return <p className="opacity-70">{tr('Đang tải...', 'Loading...')}</p>;

  const save = async () => {
    await api(`/guilds/${guildId}/config`, { method: 'PUT', body: { boost } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const preview = formatPreview(boost.message, { user: '@Trần Thị B', username: 'tranthib', server: guildName, boosts: 8, membercount: 1234 });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass p-6 space-y-5">
        <h2 className="text-xl font-bold">🚀 Server Boost</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="font-semibold">{tr('Bật thông báo', 'Enable notifications')}</span>
          <input type="checkbox" className="h-5 w-5 accent-violet-500" checked={boost.enabled} onChange={(e) => setBoost({ ...boost, enabled: e.target.checked })} />
        </label>
        <div>
          <label className="text-sm opacity-80">{tr('Kênh thông báo', 'Notification channel')}</label>
          <select className="glass-input mt-1 bg-slate-900/60" value={boost.channelId} onChange={(e) => setBoost({ ...boost, channelId: e.target.value })}>
            <option value="">{tr('-- Chọn kênh --', '-- Select channel --')}</option>
            {channels.map((c) => <option key={c.id} value={c.id} className="bg-slate-900">#{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm opacity-80">{tr('Nội dung', 'Message')}</label>
          <textarea rows={3} className="glass-input mt-1" value={boost.message} onChange={(e) => setBoost({ ...boost, message: e.target.value })} />
          <p className="text-xs opacity-60 mt-1">{'{user} {username} {server} {boosts}'}</p>
        </div>
        <button onClick={save} className="btn-primary w-full">{saved ? `✅ ${tr('Đã lưu!', 'Saved!')}` : `💾 ${tr('Lưu', 'Save')}`}</button>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass p-6">
        <p className="text-sm opacity-70 mb-3">👁️ {tr('Xem trước', 'Live Preview')}</p>
        <div className="rounded-xl bg-slate-900/80 border-l-4 border-pink-400 p-4">
          <p className="font-bold">🚀 Server Boost!</p>
          <p className="mt-2 text-sm">{preview}</p>
        </div>
      </motion.div>
    </div>
  );
}
