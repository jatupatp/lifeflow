import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      className="btn-icon"
      onClick={toggleTheme}
      whileTap={{ scale: 0.85 }}
      aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </motion.div>
    </motion.button>
  );
}
