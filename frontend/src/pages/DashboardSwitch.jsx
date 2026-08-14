import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import CustomerDashboard from './CustomerDashboard';

/**
 * DashboardSwitch — Router component for `/dashboard`.
 * Dynamically serves CustomerDashboard for users with the 'customer' role,
 * and the Admin/Staff Dashboard for all other authenticated roles.
 */
export default function DashboardSwitch() {
  const { user } = useAuth();

  if (user?.role === 'customer') {
    return <CustomerDashboard />;
  }

  return <Dashboard />;
}
