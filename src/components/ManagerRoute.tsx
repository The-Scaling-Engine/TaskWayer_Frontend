import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ManagerRouteProps {
  children: React.ReactNode;
}

export default function ManagerRoute({ children }: ManagerRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'MANAGER' && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
