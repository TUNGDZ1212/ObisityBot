// Trang đăng nhập: giới thiệu và nút đăng nhập Discord OAuth2. Đã đăng nhập thì chuyển tới /servers
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Login() {
  const { user, loading } = useAuth();
  const { tr } = useLanguage();

  if (!loading && user) return <Navigate to="/servers" replace />;

  const features = [
    { icon: '🤖', text: tr('AI Server Manager', 'AI Server Manager') },
    { icon: '👋', text: tr('Chào mừng & Tạm biệt', 'Welcome & Goodbye') },
    { icon: '📈', text: tr('Thống kê realtime', 'Realtime Stats') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass max-w-2xl mx-auto p-10 text-center space-y-6"
    >
      <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
        {tr('Quản lý Discord Server', 'Manage your Discord servers')}{' '}
        <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
          {tr('dễ dàng hơn', 'with ease')}
        </span>
      </h1>
      <p className="opacity-80 text-lg">
        {tr(
          'Đăng nhập bằng Discord để xem các server bạn đang quản trị và cấu hình bot chỉ trong vài cú nhấp.',
          'Sign in with Discord to see the servers you administer and configure the bot in a few clicks.',
        )}
      </p>
      <a href="/api/auth/discord" className="btn-primary text-lg px-8 py-3">
        🔐 {tr('Đăng nhập bằng Discord', 'Login with Discord')}
      </a>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        {features.map((f, i) => (
          <motion.div
            key={f.text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm"
          >
            <span className="text-2xl block mb-1">{f.icon}</span>
            {f.text}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
