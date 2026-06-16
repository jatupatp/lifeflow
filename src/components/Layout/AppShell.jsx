import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ThemeToggle from './ThemeToggle';
import './AppShell.css';

export default function AppShell({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-shell">
      {!isMobile && <Sidebar />}
      <main className="app-main">
        <header className="app-header">
          <span className="app-logo">LifeFlow</span>
          <ThemeToggle />
        </header>
        <div className="app-content">
          {children}
        </div>
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
}
