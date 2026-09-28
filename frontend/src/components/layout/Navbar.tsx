import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TopNav } from './TopNav';
import { NotificationBell } from './NotificationBell';
import { layout } from '../../theme';
import { copy } from '../../theme';
import { UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const { user, isAdmin, logOut } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogOut = async () => {
    setLoggingOut(true);
    try {
      await logOut();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 bg-navy px-4 py-2 sm:px-6 lg:flex-nowrap lg:gap-x-4 lg:py-0 lg:px-6 ${
        isAdmin ? 'lg:h-[54px]' : 'lg:h-[58px]'
      }`}
    >
      <Link
        to="/"
        className="shrink-0 whitespace-nowrap text-lg font-bold text-white"
      >
        {copy.wordmark}
      </Link>

      <div
        className={`order-last w-full min-w-0 overflow-x-auto lg:order-none lg:w-auto lg:flex-1 ${
          isAdmin ? 'lg:hidden' : ''
        }`}
      >
        <TopNav />
      </div>

      <div className="ml-auto flex min-w-0 items-center justify-end gap-3 whitespace-nowrap">
        {user && (
          <>
            <NotificationBell />
            <span className="truncate text-[15px] font-semibold text-white">
              {user.firstName} {user.lastName}
            </span>
            <span className={layout.roleBadge}>
              {user.role === UserRole.ADMIN ? 'Admin' : 'Employee'}
            </span>
            <button
              type="button"
              onClick={handleLogOut}
              disabled={loggingOut}
              className="text-[15px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};
