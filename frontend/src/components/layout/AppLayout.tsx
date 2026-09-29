import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { NotificationProvider } from '../../realtime/NotificationProvider';

export const AppLayout = () => {
  const { isAdmin } = useAuth();

  return (
    <NotificationProvider>
      <div className="flex min-h-screen flex-col bg-shell">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          {isAdmin ? (
            <main className="min-w-0 flex-1 overflow-x-auto px-6">
              <Outlet />
            </main>
          ) : (
            <main className="min-w-0 flex-1 overflow-x-auto px-4 sm:px-6">
              <div className="mx-auto max-w-[1563px]">
                <Outlet />
              </div>
            </main>
          )}
        </div>
      </div>
    </NotificationProvider>
  );
};
