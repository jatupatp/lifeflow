import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Repeat,
  CalendarDays,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { to: '/goals', label: 'เป้าหมาย', icon: Target },
  { to: '/tasks', label: 'งานประจำวัน', icon: CheckSquare },
  { to: '/habits', label: 'กิจวัตร', icon: Repeat },
  { to: '/calendar', label: 'ปฏิทิน', icon: CalendarDays },
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <span className="app-logo">LifeFlow</span>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <item.icon className="sidebar-link-icon" />
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-version">v1.0</div>
    </aside>
  );
}
