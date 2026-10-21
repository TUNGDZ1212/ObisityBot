import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function SecurityModule() {
  const { guildId } = useParams();
  const [security, setSecurity] = useState({
    autoRoleEnabled: false,
    autoRoleId: '',
    antiRaidEnabled: false,
    minAccountAgeDays: 7
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/security`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.security) {
          setSecurity((prev) => ({ ...prev, ...data.security }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [guildId]);

  const handleSave = async () => {
    setMsg('Đang lưu...');
    try {
      const res = await fetch(`/api/guilds/${guildId}/security`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ security })
      });
      const data = await res.json();
      if (data.success) setMsg('✅ Đã lưu cấu hình bảo mật!');
      else setMsg('❌ Có lỗi xảy ra!');
    } catch {
      setMsg('❌ Lỗi kết nối!');
    }
  };

  if (loading) return <div className="p-4 text-white">Đang tải...</div>;

  return (
    <div className="glass p-6 rounded-2xl text-white max-w-2xl">
      <h2 className="text-xl font-bold mb-4">🛡️ Cấu hình Bảo Mật Server</h2>
      {msg && <div className="mb-4 text-sm font-semibold text-emerald-400">{msg}</div>}

      <div className="space-y-6">
        {/* AutoRole */}
        <div className="border-b border-white/10 pb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={security.autoRoleEnabled}
              onChange={(e) => setSecurity({ ...security, autoRoleEnabled: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="font-semibold">Tự động cấp Role (AutoRole)</span>
          </label>
          {security.autoRoleEnabled && (
            <input
              type="text"
              placeholder="Nhập Role ID cần tự động cấp"
              value={security.autoRoleId || ''}
              onChange={(e) => setSecurity({ ...security, autoRoleId: e.target.value })}
              className="mt-3 w-full p-2.5 rounded-xl bg-black/30 border border-white/20 text-sm"
            />
          )}
        </div>

        {/* Anti-Raid */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={security.antiRaidEnabled}
              onChange={(e) => setSecurity({ ...security, antiRaidEnabled: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="font-semibold">Chống Nick Ảo (Anti-Raid)</span>
          </label>
          {security.antiRaidEnabled && (
            <div className="mt-3">
              <span className="text-xs opacity-70 block mb-1">Số ngày tuổi nick tối thiểu:</span>
              <input
                type="number"
                value={security.minAccountAgeDays || 7}
                onChange={(e) => setSecurity({ ...security, minAccountAgeDays: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/20 text-sm"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition"
        >
          Lưu cài đặt
        </button>
      </div>
    </div>
  );
}
