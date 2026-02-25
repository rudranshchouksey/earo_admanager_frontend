import { Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/dashboard/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
