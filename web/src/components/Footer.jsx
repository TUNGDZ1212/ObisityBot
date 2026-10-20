// Chân trang: thông tin liên hệ và liên kết. Thay các giá trị bên dưới bằng thông tin thật của bạn.
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext.jsx';

const CONTACT = {
  email: 'support4obisity@gmail.com',
  github: 'https://github.com/your-username',
  discord: 'https://discord.gg/your-invite',
  website: 'https://example.com',
};

export default function Footer() {
  const { tr } = useLanguage();
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mx-4 mb-4 glass px-6 py-5 grid gap-4 md:grid-cols-3 text-sm"
    >
      <div>
        <p className="font-bold text-base">Discord System</p>
        <p className="opacity-70 mt-1">{tr('Dashboard quản lý Discord Bot hiện đại.', 'A modern Discord Bot management dashboard.')}</p>
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{tr('Liên hệ', 'Contact')}</p>
        <a href={`mailto:${CONTACT.email}`} className="block opacity-80 hover:opacity-100">✉️ {CONTACT.email}</a>
        <a href={CONTACT.website} target="_blank" rel="noreferrer" className="block opacity-80 hover:opacity-100">🌍 Website</a>
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{tr('Liên kết', 'Links')}</p>
        <a href={CONTACT.github} target="_blank" rel="noreferrer" className="block opacity-80 hover:opacity-100">💻 GitHub</a>
        <a href={CONTACT.discord} target="_blank" rel="noreferrer" className="block opacity-80 hover:opacity-100">💬 Discord Support</a>
      </div>
      <p className="md:col-span-3 text-center opacity-50 text-xs pt-2 border-t border-white/10">
        © {new Date().getFullYear()} Discord System. {tr('Bảo lưu mọi quyền.', 'All rights reserved.')}
      </p>
    </motion.footer>
  );
}
