// Trang Overview: thông số tổng quan của server (thành viên, boost, ping, số kênh) và trạng thái các module
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, guildIconUrl } from '../api.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Overview() {
  const { guildId } = useParams();
  const { tr } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api(`/guilds/${guildId}/overview`).then(setData).catch((e) => setError(e.message));
  }, [guildId]);

  if (error === 'BOT_NOT_IN_GUILD') {
    return (
      <div className="glass p-8 text-center space-y-4">
        <p className="text-xl">🤖 {tr('Bot chưa được mời vào server này.', 'The bot has not been invited to this server.')}</p>
        <Link to="/servers" className="btn-ghost">← {tr('Quay lại', 'Back')}</Link>
      </div>
    );
  }
  if (error) return <div className="glass p-6 text-red-300">⚠️ {error}</div>;
  if (!data) return <p className="opacity-70 py-10 text-center">{tr('Đang tải...', 'Loading...')}</p>;

  const cards = [
    { label: tr('Thành viên', 'Members'), value: data.memberCount },
    { label: 'Boost', value: data.boosts },
    { label: 'Ping', value: `${data.ping ?? '--'} ms` },
    { label: tr('Kênh văn bản', 'Text channels'), value: data.channels.length },
  ];
  const modules = [
    ['welcome', 'Welcome'], ['goodbye', 'Goodbye'], ['boost', 'Boost'],
    ['stats', 'Server Stats'], ['antispam', 'Anti-spam'], ['ai', 'AI'],
  ];
  const icon = guildIconUrl(data.guild.id, data.guild.icon, 128);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 flex items-center gap-5">
        {icon && <img src={icon} alt="" className="h-16 w-16 rounded-2xl" />}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{data.guild.name}</h1>
          <p className="opacity-70 text-sm">{tr('Tổng quan server', 'Server overview')}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="glass p-5">
            <p className="text-sm opacity-70">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass p-6">
        <h2 className="font-semibold text-lg mb-4">{tr('Trạng thái module', 'Module status')}</h2>
        <div className="flex flex-wrap gap-3">
          {modules.map(([key, label]) => (
            <span key={key} className={`px-3 py-1.5 rounded-full text-sm border ${data.modules[key] ? 'border-green-400/60 bg-green-400/10' : 'border-white/20 opacity-60'}`}>
              {label}: {data.modules[key] ? 'ON' : 'OFF'}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
