// Trang AI Settings: chọn provider (Gemini/Claude/ChatGPT/custom), tên model, base URL và API Key.
// API key được lưu phía server và chỉ hiển thị dạng che (••••xxxx).
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api.js';
import AISelector from '../components/AISelector.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function AISettings() {
  const { guildId } = useParams();
  const { tr } = useLanguage();
  const [ai, setAi] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/guilds/${guildId}/config`).then((c) => setAi(c.ai)).catch((e) => setError(e.message));
  }, [guildId]);

  if (error) return <div className="glass p-6 text-red-300">⚠️ {error}</div>;
  if (!ai) return <p className="opacity-70">{tr('Đang tải...', 'Loading...')}</p>;

  const save = async () => {
    // Chỉ gửi apiKey khi người dùng nhập key mới
    const body = { ai: { provider: ai.provider, model: ai.model, baseUrl: ai.baseUrl } };
    if (apiKey.trim()) body.ai.apiKey = apiKey.trim();
    await api(`/guilds/${guildId}/config`, { method: 'PUT', body });
    setApiKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    api(`/guilds/${guildId}/config`).then((c) => setAi(c.ai));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 md:p-8 max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🤖 AI Settings</h2>
        <p className="opacity-70 text-sm mt-1">
          {tr(
            'Dùng API Key của riêng bạn để kích hoạt /aisetup: tạo kênh ticket, role, anti-spam và kiểm duyệt bằng câu lệnh tự nhiên.',
            'Use your own API key to power /aisetup: create ticket channels, roles, anti-spam and moderation using natural language.',
          )}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm opacity-80">Provider</label>
        <AISelector value={ai.provider} onChange={(v) => setAi({ ...ai, provider: v })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm opacity-80">{tr('Tên Model', 'Model name')}</label>
        <input className="glass-input" placeholder="gemini-2.0-flash" value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} />
      </div>

      {ai.provider === 'custom' && (
        <div className="space-y-2">
          <label className="text-sm opacity-80">Base URL (OpenAI-compatible)</label>
          <input className="glass-input" placeholder="https://api.groq.com/openai/v1" value={ai.baseUrl} onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })} />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm opacity-80">API Key</label>
        <input type="password" className="glass-input" placeholder={ai.hasKey ? `${ai.maskedKey} (${tr('để trống nếu không đổi', 'leave empty to keep')})` : 'sk-... / AIza...'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
        <p className="text-xs opacity-60">
          {ai.hasKey ? `✅ ${tr('Đã có API Key', 'API key is set')}` : `⚠️ ${tr('Chưa có API Key', 'No API key yet')}`}
        </p>
      </div>

      <button onClick={save} className="btn-primary w-full">{saved ? `✅ ${tr('Đã lưu!', 'Saved!')}` : `💾 ${tr('Lưu cấu hình AI', 'Save AI settings')}`}</button>
    </motion.div>
  );
}
