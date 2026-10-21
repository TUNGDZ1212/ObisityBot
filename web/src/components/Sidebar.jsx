// Thanh công cụ bên hông: chuyển giữa các tab cấu hình của một server
import { NavLink, useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Sidebar() {
  const { guildId } = useParams();
  const { tr } = useLanguage();

  const items = [
    { to: 'overview', icon: '📊', label: tr('Tổng quan', 'Overview') },
    { to: 'welcome', icon: '👋', label: tr('Chào mừng / Tạm biệt', 'Welcome / Goodbye') },
    { to: 'stats', icon: '📈', label: tr('Thống kê server', 'Server Stats') },
    { to: 'boost', icon: '🚀', label: 'Server Boost' },
    { to: 'security', icon: '🛡️', label: tr('Bảo Mật Server', 'Server Security') },
    { to: 'logs', icon: '📋', label: tr('Nhật Ký Hoạt Động', 'Audit Logs') },
    { to: 'ai', icon: '🤖', label: 'AI Settings' },
    { to: 'settings', icon: '⚙️', label: tr('Cài đặt', 'Settings') },
  ];

  return (
    <aside className="glass p-4 lg:w-64 shrink-0 h-fit lg:sticky lg:top-28">
      <Link to="/servers" className="block mb-4 text-sm opacity-70 hover:opacity-100">
        ← {tr('Quay lại', 'Back')}
      </Link>
      <nav className="flex lg:flex-col gap-2 overflow-x-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={`/manage/${guildId}/${item.to}`}
            className={({ isActive }) =>
              `flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 transition ${
                isActive ? 'bg-white/20 font-semibold shadow-lg' : 'hover:bg-white/10 opacity-80'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
