import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function SecurityModule() {
  const { guildId } = useParams();
  const [sec, setSec] = useState({
    autoRoleEnabled: false,
    autoRoleId: '',
    antiRaidEnabled: false,
    minAccountAgeDays: 7,
    antiLinkEnabled: false,
    antiInviteEnabled: false,
    antiMassMentionEnabled: false,
    maxMentions: 5,
    antiBadwordsEnabled: false,
    antiBotJoinEnabled: false,
    antiGhostPingEnabled: false,
    antiNukeChannelsEnabled: false,
    antiNukeRolesEnabled: false,
    antiMassBanEnabled: false,
    verificationGateEnabled: false,
    antiDuplicateEnabled: false,
    lockdownMode: false
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/security`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.security) setSec((prev) => ({ ...prev, ...data.security }));
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
        body: JSON.stringify({ security: sec })
      });
      const data = await res.json();
      if (data.success) setMsg('✅ Đã lưu bộ 20 tính năng bảo mật!');
      else setMsg('❌ Lỗi lưu dữ liệu!');
    } catch {
      setMsg('❌ Lỗi kết nối!');
    }
  };

  const toggle = (key) => setSec((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) return <div className="p-4 text-white">Đang tải trung tâm bảo mật...</div>;

  return (
    <div className="glass p-6 rounded-2xl text-white max-w-5xl">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">🛡️ Trung Tâm Bảo Mật Server Advanced (20 Features)</h2>
          <p className="text-xs opacity-70 mt-1">Hệ thống bảo vệ đa tầng chống Nuke, Spam, Raid & Hakker</p>
        </div>
        <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition">
          Lưu tất cả thay đổi
        </button>
      </div>

      {msg && <div className="mb-4 text-sm font-semibold text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Item 1: AutoRole */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">1. AutoRole</span>
            <input type="checkbox" checked={sec.autoRoleEnabled} onChange={() => toggle('autoRoleEnabled')} className="w-4 h-4" />
          </label>
          {sec.autoRoleEnabled && (
            <input
              type="text"
              placeholder="Role ID"
              value={sec.autoRoleId || ''}
              onChange={(e) => setSec({ ...sec, autoRoleId: e.target.value })}
              className="mt-2 w-full p-2 text-xs rounded bg-black/40 border border-white/10"
            />
          )}
        </div>

        {/* Item 2: Anti-Raid */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">2. Anti-Raid Core</span>
            <input type="checkbox" checked={sec.antiRaidEnabled} onChange={() => toggle('antiRaidEnabled')} className="w-4 h-4" />
          </label>
          {sec.antiRaidEnabled && (
            <input
              type="number"
              placeholder="Tuổi nick tối thiểu (ngày)"
              value={sec.minAccountAgeDays || 7}
              onChange={(e) => setSec({ ...sec, minAccountAgeDays: Number(e.target.value) })}
              className="mt-2 w-full p-2 text-xs rounded bg-black/40 border border-white/10"
            />
          )}
        </div>

        {/* Item 3: Anti-Link */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">3. Anti-Link (Chặn URL)</span>
            <input type="checkbox" checked={sec.antiLinkEnabled} onChange={() => toggle('antiLinkEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 4: Anti-Invite */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">4. Chặn Discord Invites</span>
            <input type="checkbox" checked={sec.antiInviteEnabled} onChange={() => toggle('antiInviteEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 5: Anti-Mass Mention */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">5. Anti-Mass Mention</span>
            <input type="checkbox" checked={sec.antiMassMentionEnabled} onChange={() => toggle('antiMassMentionEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 6: Anti-Badwords */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">6. Kiểm duyệt từ cấm</span>
            <input type="checkbox" checked={sec.antiBadwordsEnabled} onChange={() => toggle('antiBadwordsEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 7: Anti-Ghost Ping */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">7. Chặn Ghost Ping</span>
            <input type="checkbox" checked={sec.antiGhostPingEnabled} onChange={() => toggle('antiGhostPingEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 8: Anti-Bot Join */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">8. Chặn Bot Lạ Tham Gia</span>
            <input type="checkbox" checked={sec.antiBotJoinEnabled} onChange={() => toggle('antiBotJoinEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 9: Anti-Nuke Channels */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">9. Anti-Nuke (Xóa Kênh)</span>
            <input type="checkbox" checked={sec.antiNukeChannelsEnabled} onChange={() => toggle('antiNukeChannelsEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 10: Anti-Nuke Roles */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">10. Anti-Nuke (Xóa Role)</span>
            <input type="checkbox" checked={sec.antiNukeRolesEnabled} onChange={() => toggle('antiNukeRolesEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 11: Anti-Mass Ban */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">11. Chặn Ban Hàng Loạt</span>
            <input type="checkbox" checked={sec.antiMassBanEnabled} onChange={() => toggle('antiMassBanEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 12: Verification Gate */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">12. Verification CAPTCHA</span>
            <input type="checkbox" checked={sec.verificationGateEnabled} onChange={() => toggle('verificationGateEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 13: Anti-Duplicate Message */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm">13. Chặn Tin Trùng Lặp</span>
            <input type="checkbox" checked={sec.antiDuplicateEnabled} onChange={() => toggle('antiDuplicateEnabled')} className="w-4 h-4" />
          </label>
        </div>

        {/* Item 14: Emergency Lockdown */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-sm text-red-300">14. Khóa Server Khẩn Cấp</span>
            <input type="checkbox" checked={sec.lockdownMode} onChange={() => toggle('lockdownMode')} className="w-4 h-4" />
          </label>
        </div>
      </div>
    </div>
  );
}
