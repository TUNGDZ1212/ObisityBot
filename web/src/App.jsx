// Routing chính và khung giao diện: video nền + dark overlay, Navbar, Footer, layout quản lý server
import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';
import Login from './pages/Login.jsx';
import ServerPicker from './pages/ServerPicker.jsx';
import Overview from './pages/Overview.jsx';
import WelcomeGoodbyeModule from './pages/WelcomeGoodbyeModule.jsx';
import StatsModule from './pages/StatsModule.jsx';
import BoostModule from './pages/BoostModule.jsx';
import AISettings from './pages/AISettings.jsx';
import Settings, { applyUiSettings } from './pages/Settings.jsx';
import SecurityModule from './pages/SecurityModule.jsx';
import LogsModule from './pages/LogsModule.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useLanguage } from './context/LanguageContext.jsx';

// Khung chung: video nền phát liên tục, lớp phủ tối, Navbar và Footer
function Shell() {
  const location = useLocation();
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video className="h-full w-full object-cover" src="/background/video.mp4" autoPlay loop muted playsInline />
        {/* Lớp phủ tối: độ đậm lấy từ --overlay (Settings có thể chỉnh) */}
        <div className="absolute inset-0 bg-black" style={{ opacity: 'var(--overlay)' }} />
      </div>
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

// Chặn trang nếu chưa đăng nhập
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const { tr } = useLanguage();
  if (loading) return <p className="text-center opacity-70 py-20">{tr('Đang tải...', 'Loading...')}</p>;
  return user ? children : <Navigate to="/" replace />;
}

// Layout quản lý một server: Sidebar bên trái, nội dung module bên phải
function ManageLayout() {
  const { guildId } = useParams();
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Sidebar key={guildId} />
      <section className="flex-1 min-w-0">
        <Outlet />
      </section>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    applyUiSettings(); // Áp dụng màu nhấn và độ phủ nền đã lưu
  }, []);

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Login />} />
        <Route path="/servers" element={<RequireAuth><ServerPicker /></RequireAuth>} />
        <Route path="/manage/:guildId" element={<RequireAuth><ManageLayout /></RequireAuth>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="welcome" element={<WelcomeGoodbyeModule />} />
          <Route path="stats" element={<StatsModule />} />
          <Route path="boost" element={<BoostModule />} />
          <Route path="security" element={<SecurityModule />} />
          <Route path="logs" element={<LogsModule />} />
          <Route path="ai" element={<AISettings />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
