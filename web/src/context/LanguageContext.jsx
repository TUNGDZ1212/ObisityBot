// Context ngôn ngữ giao diện (Tiếng Việt / English), lưu lựa chọn vào localStorage.
// Dùng: const { tr } = useLanguage(); tr('Tiếng Việt', 'English')
import { createContext, useContext, useMemo, useState } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'vi');

  const value = useMemo(
    () => ({
      lang,
      setLang: (next) => {
        localStorage.setItem('lang', next);
        setLangState(next);
      },
      tr: (vi, en) => (lang === 'vi' ? vi : en),
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
