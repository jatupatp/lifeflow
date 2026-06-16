import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Repeat,
  CalendarDays,
} from 'lucide-react';
import { motion } from 'framer-motion';
import './BottomNav.css';

const navItems = [
  { to: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { to: '/goals', label: 'เป้าหมาย', icon: Target },
  { to: '/tasks', label: 'งาน', icon: CheckSquare },
  { to: '/habits', label: 'กิจวัตร', icon: Repeat },
  { to: '/calendar', label: 'ปฏิทิน', icon: CalendarDays },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? ' active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="bottom-nav-icon" />
              <span className="bottom-nav-label">{item.label}</span>
              {isActive && (
                <motion.span
                  className="bottom-nav-dot"
                  layoutId="bottom-nav-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
