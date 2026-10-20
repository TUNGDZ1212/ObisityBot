// Module Server Stats: bật/tắt cập nhật tự động và chỉnh mẫu tên kênh. Tạo kênh bằng lệnh /setstats.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPreview } from '../api.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function StatsModule() {
  const { guildId } = useParams();
  const { tr } = useLanguage();
  const [stats, setStats] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api(`/guilds/${guildId}/config`).then((c) => setStats(c.stats));
  }, [guildId]);

  if (!stats) return <p className="opacity-70">{tr('Đang tải...', 'Loading...')}</p>;

  const save = async () => {
    await api(`/guilds/${guildId}/config`, { method: 'PUT', body: { stats } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const samples = [
    ['👥 Members', 1234], ['🧑 Humans', 1100], ['🤖 Bots', 134], ['🚀 Boosts', 7],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass p-6 space-y-5">
        <h2 className="text-xl font-bold">📈 {tr('Thống kê server', 'Server Stats')}</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="font-semibold">{tr('Bật cập nhật tự động', 'Enable auto-update')}</span>
          <input type="checkbox" className="h-5 w-5 accent-violet-500" checked={stats.enabled} onChange={(e) => setStats({ ...stats, enabled: e.target.checked })} />
        </label>
        <div>
          <label className="text-sm opacity-80">{tr('Mẫu tên kênh', 'Channel name template')}</label>
          <input className="glass-input mt-1" value={stats.template} onChange={(e) => setStats({ ...stats, template: e.target.value })} />
          <p className="text-xs opacity-60 mt-1">{'{label} {count}'}</p>
        </div>
        <p className="text-sm opacity-70 bg-white/5 rounded-xl p-3">
          {tr(
            'Để tạo kênh thống kê, gõ /setstats trong Discord. Bot sẽ tạo danh mục và các kênh voice tự cập nhật mỗi 10 phút.',
            'To create stats channels, run /setstats in Discord. The bot creates a category and voice channels that update every 10 minutes.',
          )}
        </p>
        <button onClick={save} className="btn-primary w-full">{saved ? `✅ ${tr('Đã lưu!', 'Saved!')}` : `💾 ${tr('Lưu', 'Save')}`}</button>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass p-6">
        <p className="text-sm opacity-70 mb-3">👁️ {tr('Xem trước tên kênh', 'Channel name preview')}</p>
        <div className="space-y-2">
          {samples.map(([label, count]) => (
            <div key={label} className="rounded-xl bg-slate-900/80 px-4 py-3 font-mono text-sm">
              🔊 {formatPreview(stats.template, { label, count })}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
