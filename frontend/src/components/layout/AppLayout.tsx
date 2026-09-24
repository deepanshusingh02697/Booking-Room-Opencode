import { NavLink, Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'block rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white'
    : 'block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200';

export { NavLink };