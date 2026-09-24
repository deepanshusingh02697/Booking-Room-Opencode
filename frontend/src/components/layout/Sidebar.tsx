import { NavLink } from 'react-router-dom';
import { navLinkClass } from './AppLayout';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/bookings', label: 'My Bookings' },
  { to: '/admin/rooms', label: 'Admin Rooms' },
  { to: '/admin/calendar', label: 'Admin Calendar' },
  { to: '/admin/analytics', label: 'Analytics' },
];

export const Sidebar = () => {
  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};