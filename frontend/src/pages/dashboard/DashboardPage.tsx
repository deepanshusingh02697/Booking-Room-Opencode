import { AdminDashboard } from './AdminDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { useAuth } from '../../hooks/useAuth';

export const DashboardPage = () => {
  const { isAdmin } = useAuth();

  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
};
