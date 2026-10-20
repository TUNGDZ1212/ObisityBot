// Module Welcome / Goodbye: bật/tắt, chọn kênh, soạn nội dung và xem trước kết quả (Live Preview)
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPreview } from '../api.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function WelcomeGoodbyeModule() {
  const { guildId } = useParams();
  const { tr } = useLanguage();
  const [type, setType] = useState('welcome');
  const [config, setConfig] = useState(null);
  const [channels, setChannels] = useState([]);
  const [guildName, setGuildName] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api(`/guilds/${guildId}/config`), api(`/guilds/${guildId}/overview`)])
      .then(([c, o]) => {
        setConfig(c);
        setChannels(o.channels);
        setGuildName(o.guild.name);
      })
      .catch((e) => setError(e.message));
  }, [guildId]);

  if (error) return <div className="glass p-6 text-red-300">⚠️ {error}</div>;
  if (!config) return <p className="opacity-70">{tr('Đang tải...', 'Loading...')}</p>;

  const block = config[type];
  const patch = (p) => setConfig((c) => ({ ...c, [type]: { ...c[type], ...p } }));

  const save = async () => {
    await api(`/guilds/${guildId}/config`, { method: 'PUT', body: { [type]: block } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Dữ liệu giả để xem trước placeholder
  const preview = formatPreview(block.message, {
    user: '@Nguyễn Văn A', username: 'nguyenvana', server: guildName, membercount: 1234, boosts: 7,
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['welcome', 'goodbye'].map((t) => (
          <button key={t} onClick={() => setType(t)} className={type === t ? 'btn-primary' : 'btn-ghost'}>
            {t === 'welcome' ? '👋 Welcome' : '🚪 Goodbye'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div key={type} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass p-6 space-y-5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold">{tr('Bật tính năng', 'Enable')}</span>
            <input type="checkbox" className="h-5 w-5 accent-violet-500" checked={block.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />
          </label>

          <div>
            <label className="text-sm opacity-80">{tr('Kênh gửi tin', 'Channel')}</label>
            <select className="glass-input mt-1 bg-slate-900/60" value={block.channelId} onChange={(e) => patch({ channelId: e.target.value })}>
              <option value="">{tr('-- Chọn kênh --', '-- Select channel --')}</option>
              {channels.map((c) => <option key={c.id} value={c.id} className="bg-slate-900">#{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm opacity-80">{tr('Nội dung', 'Message')}</label>
            <textarea rows={4} className="glass-input mt-1" value={block.message} onChange={(e) => patch({ message: e.target.value })} />
            <p className="text-xs opacity-60 mt-1">{'{user} {username} {server} {membercount} {boosts}'}</p>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span>{tr('Hiển thị dạng Embed', 'Show as embed')}</span>
            <input type="checkbox" className="h-5 w-5 accent-violet-500" checked={block.useEmbed} onChange={(e) => patch({ useEmbed: e.target.checked })} />
          </label>

          <button onClick={save} className="btn-primary w-full">
            {saved ? `✅ ${tr('Đã lưu!', 'Saved!')}` : `💾 ${tr('Lưu cấu hình', 'Save')}`}
          </button>
        </motion.div>

        {/* Live Preview: mô phỏng embed/tin nhắn trên Discord */}
        <motion.div key={`${type}-preview`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass p-6">
          <p className="text-sm opacity-70 mb-3">👁️ {tr('Xem trước', 'Live Preview')}</p>
          <div className="rounded-xl bg-slate-900/80 border-l-4 border-violet-500 p-4">
            {block.useEmbed ? (
              <>
                <p className="font-bold">{type === 'welcome' ? '👋 Chào mừng!' : '👋 Tạm biệt'}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm opacity-90">{preview || '...'}</p>
              </>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{preview || '...'}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
