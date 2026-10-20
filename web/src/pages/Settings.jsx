// Trang Settings: ngôn ngữ, màu nhấn và độ đậm lớp phủ nền. Lưu trong localStorage và áp dụng ngay.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext.jsx';

const DEFAULTS = { accent: '#7c5cff', accent2: '#22d3ee', overlay: 0.6 };

// Chuyển '#rrggbb' sang 'r g b' để dùng trong biến CSS rgb(var(--accent))
const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

// Áp dụng cài đặt giao diện đã lưu (được gọi từ App khi khởi động)
export function applyUiSettings() {
  const saved = JSON.parse(localStorage.getItem('ui-settings') || 'null') ?? DEFAULTS;
  const root = document.documentElement.style;
  root.setProperty('--accent', hexToRgb(saved.accent));
  root.setProperty('--accent-2', hexToRgb(saved.accent2));
  root.setProperty('--overlay', String(saved.overlay));
}

export default function Settings() {
  const { lang, setLang, tr } = useLanguage();
  const [ui, setUi] = useState(() => JSON.parse(localStorage.getItem('ui-settings') || 'null') ?? DEFAULTS);

  // Cập nhật state và áp dụng ngay lên giao diện
  const update = (patch) => {
    const next = { ...ui, ...patch };
    setUi(next);
    localStorage.setItem('ui-settings', JSON.stringify(next));
    applyUiSettings();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 md:p-8 max-w-2xl space-y-7">
      <h2 className="text-2xl font-bold">⚙️ {tr('Cài đặt giao diện', 'Interface settings')}</h2>

      <div className="space-y-2">
        <label className="font-semibold">{tr('Ngôn ngữ', 'Language')}</label>
        <div className="flex gap-2">
          {[['vi', 'Tiếng Việt'], ['en', 'English']].map(([code, label]) => (
            <button key={code} onClick={() => setLang(code)} className={lang === code ? 'btn-primary' : 'btn-ghost'}>{label}</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="font-semibold">{tr('Màu nhấn chính', 'Primary accent')}</label>
          <input type="color" className="h-10 w-full rounded-xl bg-transparent cursor-pointer" value={ui.accent} onChange={(e) => update({ accent: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="font-semibold">{tr('Màu nhấn phụ', 'Secondary accent')}</label>
          <input type="color" className="h-10 w-full rounded-xl bg-transparent cursor-pointer" value={ui.accent2} onChange={(e) => update({ accent2: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-semibold">{tr('Độ đậm lớp phủ nền', 'Background overlay opacity')}: {Math.round(ui.overlay * 100)}%</label>
        <input type="range" min="0.2" max="0.9" step="0.05" value={ui.overlay} onChange={(e) => update({ overlay: Number(e.target.value) })} className="w-full accent-violet-500" />
      </div>

      <button onClick={() => update(DEFAULTS)} className="btn-ghost w-full">↺ {tr('Khôi phục mặc định', 'Reset to default')}</button>
    </motion.div>
  );
}
