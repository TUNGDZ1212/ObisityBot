// Bộ chọn AI Provider: Gemini, Claude, ChatGPT hoặc custom (OpenAI-compatible)
import { useLanguage } from '../context/LanguageContext.jsx';

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini', hint: 'gemini-2.0-flash' },
  { value: 'claude', label: 'Anthropic Claude', hint: 'claude-3-5-haiku-latest' },
  { value: 'openai', label: 'OpenAI ChatGPT', hint: 'gpt-4o-mini' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)', hint: 'model-name' },
];

export default function AISelector({ value, onChange }) {
  const { tr } = useLanguage();
  const current = PROVIDERS.find((p) => p.value === value) ?? PROVIDERS[0];

  return (
    <div className="space-y-2">
      <select className="glass-input bg-slate-900/60" value={value} onChange={(e) => onChange(e.target.value)}>
        {PROVIDERS.map((p) => (
          <option key={p.value} value={p.value} className="bg-slate-900">{p.label}</option>
        ))}
      </select>
      <p className="text-xs opacity-60">
        {tr('Gợi ý tên model', 'Suggested model')}: <code>{current.hint}</code>
      </p>
    </div>
  );
}
