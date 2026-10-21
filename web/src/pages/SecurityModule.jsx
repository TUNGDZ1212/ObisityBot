import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function SecurityModule() {
  const { guildId } = useParams();
  const [activeTab, setActiveTab] = useState('nuke');
  const [sec, setSec] = useState({
    // Tab 1: Anti-Nuke & Raid
    antiRaidEnabled: false,
    minAccountAgeDays: 7,
    antiNukeChannelsEnabled: false,
    maxChannelDeletePerMin: 3,
    antiNukeRolesEnabled: false,
    maxRoleDeletePerMin: 3,
    antiMassBanEnabled: false,
    maxBanPerMin: 5,
    antiBotJoinEnabled: false,

    // Tab 2: Content & Anti-Spam
    antiLinkEnabled: false,
    antiInviteEnabled: false,
    antiMassMentionEnabled: false,
    maxMentions: 5,
    antiBadwordsEnabled: false,
    badwordsList: '',
    antiGhostPingEnabled: false,
    antiDuplicateEnabled: false,

    // Tab 3: Verification & Roles
    autoRoleEnabled: false,
    autoRoleId: '',
    verificationGateEnabled: false,
    verificationRoleId: '',
    whitelistRoles: '',
    whitelistUsers: '',

    // Tab 4: Emergency & Logs
    lockdownMode: false,
    logChannelId: ''
  });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/guilds/${guildId}/security`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.security) {
          const s = data.security;
          setSec((prev) => ({
            ...prev,
            ...s,
            badwordsList: Array.isArray(s.badwordsList) ? s.badwordsList.join(', ') : s.badwordsList || '',
            whitelistRoles: Array.isArray(s.whitelistRoles) ? s.whitelistRoles.join(', ') : s.whitelistRoles || '',
            whitelistUsers: Array.isArray(s.whitelistUsers) ? s.whitelistUsers.join(', ') : s.whitelistUsers || ''
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [guildId]);

  const handleSave = async () => {
    setMsg('Đang lưu...');
    try {
      // Chuyển chuỗi phân cách bởi dấu phẩy thành Array
      const payload = {
        ...sec,
        badwordsList: typeof sec.badwordsList === 'string' ? sec.badwordsList.split(',').map((s) => s.trim()).filter(Boolean) : sec.badwordsList,
        whitelistRoles: typeof sec.whitelistRoles === 'string' ? sec.whitelistRoles.split(',').map((s) => s.trim()).filter(Boolean) : sec.whitelistRoles,
        whitelistUsers: typeof sec.whitelistUsers === 'string' ? sec.whitelistUsers.split(',').map((s) => s.trim()).filter(Boolean) : sec.whitelistUsers
      };

      const res = await fetch(`/api/guilds/${guildId}/security`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ security: payload })
      });
      const data = await res.json();
      if (data.success) setMsg('✅ Đã lưu cấu hình bảo mật!');
      else setMsg('❌ Lỗi khi lưu dữ liệu!');
    } catch {
      setMsg('❌ Lỗi kết nối server!');
    }
  };

  const toggle = (key) => setSec((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) return <div className="p-6 text-white opacity-80">Đang nạp dữ liệu bảo mật...</div>;

  return (
    <div className="glass p-6 rounded-2xl text-white max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">🛡️ Trung Tâm Bảo Mật Advanced</h2>
          <p className="text-xs opacity-70 mt-1">Cấu hình phân khu chống phá hoại, spam và bảo vệ server</p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition shadow-lg shrink-0"
        >
          Lưu tất cả thay đổi
        </button>
      </div>

      {msg && <div className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{msg}</div>}

      {/* Sub-Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('nuke')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'nuke' ? 'bg-white/20 text-white shadow' : 'opacity-60 hover:opacity-100'
          }`}
        >
          💥 Anti-Nuke & Anti-Raid
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'content' ? 'bg-white/20 text-white shadow' : 'opacity-60 hover:opacity-100'
          }`}
        >
          💬 Lọc Nội Dung & Anti-Spam
        </button>
        <button
          onClick={() => setActiveTab('auth')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'auth' ? 'bg-white/20 text-white shadow' : 'opacity-60 hover:opacity-100'
          }`}
        >
          🔐 Xác Thực & Phân Quyền
        </button>
        <button
          onClick={() => setActiveTab('emergency')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'emergency' ? 'bg-red-500/30 text-red-300 shadow' : 'opacity-60 hover:opacity-100'
          }`}
        >
          🚨 Khóa Khẩn Cấp & Log
        </button>
      </div>

      {/* TAB 1: ANTI-NUKE & RAID */}
      {activeTab === 'nuke' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-sm">Chặn Nick Ảo (Anti-Raid Core)</span>
              <input type="checkbox" checked={sec.antiRaidEnabled} onChange={() => toggle('antiRaidEnabled')} className="w-5 h-5 cursor-pointer" />
            </label>
            {sec.antiRaidEnabled && (
              <div>
                <span className="text-xs opacity-70">Tuổi nick tối thiểu (ngày):</span>
                <input
                  type="number"
                  value={sec.minAccountAgeDays}
                  onChange={(e) => setSec({ ...sec, minAccountAgeDays: Number(e.target.value) })}
                  className="mt-1 w-full p-2 text-sm rounded bg-black/40 border border-white/10"
                />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-sm">Anti-Nuke Xóa Kênh</span>
              <input type="checkbox" checked={sec.antiNukeChannelsEnabled} onChange={() => toggle('antiNukeChannelsEnabled')} className="w-5 h-5 cursor-pointer" />
            </label>
            {sec.antiNukeChannelsEnabled && (
              <div>
                <span className="text-xs opacity-70">Giới hạn kênh xóa / phút / Admin:</span>
                <input
                  type="number"
                  value={sec.maxChannelDeletePerMin}
                  onChange={(e) => setSec({ ...sec, maxChannelDeletePerMin: Number(e.target.value) })}
                  className="mt-1 w-full p-2 text-sm rounded bg-black/40 border border-white/10"
                />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-sm">Anti-Nuke Xóa Role</span>
              <input type="checkbox" checked={sec.antiNukeRolesEnabled} onChange={() => toggle('antiNukeRolesEnabled')} className="w-5 h-5 cursor-pointer" />
            </label>
            {sec.antiNukeRolesEnabled && (
              <div>
                <span className="text-xs opacity-70">Giới hạn role xóa / phút / Admin:</span>
                <input
                  type="number"
                  value={sec.maxRoleDeletePerMin}
                  onChange={(e) => setSec({ ...sec, maxRoleDeletePerMin: Number(e.target.value) })}
                  className="mt-1 w-full p-2 text-sm rounded bg-black/40 border border-white/10"
                />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-sm">Chặn Bot Lạ Tham Gia</span>
              <input type="checkbox" checked={sec.antiBotJoinEnabled} onChange={() => toggle('antiBotJoinEnabled')} className="w-5 h-5 cursor-pointer" />
            </label>
            <p className="text-xs opacity-60">Tự động kick bot mới nếu không được xác nhận bởi Admin.</p>
          </div>
        </div>
      )}

      {/* TAB 2: LỌC NỘI DUNG & ANTI-SPAM */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-sm">Tự động xóa Link (Anti-Link)</span>
                <input type="checkbox" checked={sec.antiLinkEnabled} onChange={() => toggle('antiLinkEnabled')} className="w-5 h-5 cursor-pointer" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-sm">Chặn Discord Invite Link</span>
                <input type="checkbox" checked={sec.antiInviteEnabled} onChange={() => toggle('antiInviteEnabled')} className="w-5 h-5 cursor-pointer" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-sm">Chặn Ghost Ping</span>
                <input type="checkbox" checked={sec.antiGhostPingEnabled} onChange={() => toggle('antiGhostPingEnabled')} className="w-5 h-5 cursor-pointer" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-sm">Chặn Tin Trùng Lặp (Duplicate)</span>
                <input type="checkbox" checked={sec.antiDuplicateEnabled} onChange={() => toggle('antiDuplicateEnabled')} className="w-5 h-5 cursor-pointer" />
              </label>
            </div>
          </div>

          {/* Danh sách từ cấm */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-sm">Bộ Lọc Từ Cấm (Badwords)</span>
              <input type="checkbox" checked={sec.antiBadwordsEnabled} onChange={() => toggle('antiBadwordsEnabled')} className="w-5 h-5 cursor-pointer" />
            </label>
            {sec.antiBadwordsEnabled && (
              <div>
                <span className="text-xs opacity-70">Danh sách từ cấm (phân cách bằng dấu phẩy):</span>
                <textarea
                  rows={3}
                  value={sec.badwordsList}
                  onChange={(e) => setSec({ ...sec, badwordsList: e.target.value })}
                  placeholder="tục tĩu, chửi thề, hack..."
                  className="mt-1 w-full p-2.5 text-sm rounded-xl bg-black/40 border border-white/10 resize-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: XÁC THỰC & PHÂN QUYỀN */}
      {activeTab === 'auth' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-sm">AutoRole (Cấp Role Tự Động)</span>
                <input type="checkbox" checked={sec.autoRoleEnabled} onChange={() => toggle('autoRoleEnabled')} className="w-5 h-5 cursor-pointer" />
              </label>
              {sec.autoRoleEnabled && (
                <input
                  type="text"
                  placeholder="Role ID mặc định"
                  value={sec.autoRoleId}
                  onChange={(e) => setSec({ ...sec, autoRoleId: e.target.value })}
                  className="w-full p-2 text-sm rounded bg-black/40 border border-white/10"
                />
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-sm">Cổng Xác Thực (Verification Gate)</span>
                <input type="checkbox" checked={sec.verificationGateEnabled} onChange={() => toggle('verificationGateEnabled')} className="w-5 h-5 cursor-pointer" />
              </label>
              {sec.verificationGateEnabled && (
                <input
                  type="text"
                  placeholder="Role ID sau khi Verify thành công"
                  value={sec.verificationRoleId}
                  onChange={(e) => setSec({ ...sec, verificationRoleId: e.target.value })}
                  className="w-full p-2 text-sm rounded bg-black/40 border border-white/10"
                />
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <span className="font-semibold text-sm block">Whitelist Roles & Users (Miễn trừ bảo mật)</span>
            <div>
              <span className="text-xs opacity-70">Role IDs ngoại lệ (phân cách bằng dấu phẩy):</span>
              <input
                type="text"
                value={sec.whitelistRoles}
                onChange={(e) => setSec({ ...sec, whitelistRoles: e.target.value })}
                placeholder="10293848..., 98765432..."
                className="mt-1 w-full p-2 text-sm rounded bg-black/40 border border-white/10 mb-2"
              />
            </div>
            <div>
              <span className="text-xs opacity-70">User IDs ngoại lệ:</span>
              <input
                type="text"
                value={sec.whitelistUsers}
                onChange={(e) => setSec({ ...sec, whitelistUsers: e.target.value })}
                placeholder="29384729..."
                className="mt-1 w-full p-2 text-sm rounded bg-black/40 border border-white/10"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KHÓA KHẨN CẤP & LOG */}
      {activeTab === 'emergency' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-base text-red-300 block">🚨 Chế Độ Khóa Server Khẩn Cấp (Lockdown)</span>
                <p className="text-xs opacity-70">Khi kích hoạt, mọi thành viên không có quyền Admin sẽ bị khóa quyền gửi tin nhắn ở toàn bộ các kênh.</p>
              </div>
              <input type="checkbox" checked={sec.lockdownMode} onChange={() => toggle('lockdownMode')} className="w-6 h-6 cursor-pointer" />
            </label>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <span className="font-semibold text-sm block">Kênh Xuất Audit Log Bảo Mật</span>
            <input
              type="text"
              placeholder="Nhập Discord Channel ID để đẩy log về Discord"
              value={sec.logChannelId}
              onChange={(e) => setSec({ ...sec, logChannelId: e.target.value })}
              className="w-full p-2.5 text-sm rounded-xl bg-black/40 border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
