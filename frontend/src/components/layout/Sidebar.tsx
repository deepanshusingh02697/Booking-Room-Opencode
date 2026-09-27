import { NavLink } from 'react-router-dom';
import { copy, layout, typeScale } from '../../theme';
import { adminNavItems } from '../../theme/navigation';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <aside className="hidden w-[299px] shrink-0 border-r border-rule bg-white lg:block">
      <div className="px-6 pt-5">
        <p className={typeScale.eyebrow}>{copy.adminMenuEyebrow}</p>
      </div>
      <nav className="mt-6 flex flex-col gap-1">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${layout.sidebarItem} ${typeScale.navLabel} ${
                isActive ? layout.sidebarActive : layout.sidebarInactive
              }`
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
