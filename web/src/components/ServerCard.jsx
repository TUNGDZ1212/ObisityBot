// Thẻ server: avatar + tên thật của server, nút Manage (nếu bot đã có mặt) hoặc Invite (nếu chưa)
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { guildIconUrl } from '../api.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function ServerCard({ guild, inviteUrl, index = 0 }) {
  const { tr } = useLanguage();
  const icon = guildIconUrl(guild.id, guild.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass p-5 flex flex-col items-center text-center gap-3"
    >
      {icon ? (
        <img src={icon} alt={guild.name} className="h-16 w-16 rounded-2xl shadow-lg" />
      ) : (
        <div className="h-16 w-16 rounded-2xl bg-violet-500/40 flex items-center justify-center text-2xl font-bold">
          {guild.name?.[0] ?? '?'}
        </div>
      )}
      <h3 className="font-semibold truncate w-full" title={guild.name}>{guild.name}</h3>

      {guild.botIn ? (
        <Link to={`/manage/${guild.id}`} className="btn-primary w-full">⚙️ {tr('Quản lý', 'Manage')}</Link>
      ) : (
        <a href={inviteUrl} target="_blank" rel="noreferrer" className="btn-primary w-full">➕ {tr('Mời Bot', 'Invite')}</a>
      )}
    </motion.div>
  );
}
