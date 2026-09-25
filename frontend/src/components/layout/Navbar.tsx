import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const { user, logOut } = useAuth();
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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link to="/" className="text-lg font-bold text-slate-800">
        Meeting Room Intelligence
      </Link>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        {user ? (
          <>
            <span className="font-medium text-slate-800">
              {user.firstName} {user.lastName}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {user.role}
            </span>
            <Button variant="secondary" loading={loggingOut} onClick={handleLogOut}>
              Log out
            </Button>
          </>
        ) : (
          <span>Signed out</span>
        )}
      </div>
    </header>
  );
};
