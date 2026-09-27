import { NavLink } from 'react-router-dom';
import { layout, typeScale } from '../../theme';
import { navItemsForRole } from '../../theme/navigation';
import { useAuth } from '../../hooks/useAuth';

export const TopNav = () => {
  const { isAdmin } = useAuth();

  return (
    <nav className="flex items-center gap-1">
      {navItemsForRole(isAdmin).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `${layout.topNavItem} ${typeScale.navLabel} ${
              isActive ? layout.topNavActive : layout.topNavInactive
            }`
          }
        >
          <item.icon className="h-4 w-4" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};
