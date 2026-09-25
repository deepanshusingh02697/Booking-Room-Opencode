import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '../components/common/LoadingState';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = () => {
  const { user, initialLoading } = useAuth();
  const location = useLocation();

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
