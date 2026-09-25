import { NavLink } from 'react-router-dom';
import { navLinkClass } from './AppLayout';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/', label: 'Dashboard', adminOnly: false },
  { to: '/rooms', label: 'Rooms', adminOnly: false },
  { to: '/bookings', label: 'My Bookings', adminOnly: false },
  { to: '/admin/rooms', label: 'Admin Rooms', adminOnly: true },
  { to: '/admin/calendar', label: 'Admin Calendar', adminOnly: true },
  { to: '/admin/analytics', label: 'Analytics', adminOnly: true },
];

export const Sidebar = () => {
  const { isAdmin } = useAuth();
  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};