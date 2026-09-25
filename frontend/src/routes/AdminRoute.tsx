import { Navigate, Outlet } from 'react-router-dom';
import { LoadingState } from '../components/common/LoadingState';
import { useAuth } from '../hooks/useAuth';

export const AdminRoute = () => {
  const { user, isAdmin, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
